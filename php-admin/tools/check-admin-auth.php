<?php
/** Integration tests use an isolated temporary owner and sessions, never the real account. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__) . '/admin/includes/auth.php';
$root = dirname(__DIR__);
$temp = sys_get_temp_dir() . '/katribo-auth-test-' . bin2hex(random_bytes(8));
if (!mkdir($temp, 0700)) throw new RuntimeException('Cannot create isolated test directory.');
$stateFile = $temp . '/auth-state.php';
$environment = getenv();
$environment['KATRIBO_ADMIN_AUTH_FILE'] = $stateFile;
$cookieFile = $temp . '/cookies.txt';
$logFile = $temp . '/server.log';
$server = null;
$passed = [];

function check(bool $ok, string $label): void
{
    global $passed;
    if (!$ok) throw new RuntimeException('FAIL: ' . $label);
    $passed[] = $label;
}

function request(string $path, ?array $data = null, array $headers = [], ?string $cookie = null): array
{
    global $port, $cookieFile;
    $curl = curl_init('http://127.0.0.1:' . $port . $path);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 5, CURLOPT_CONNECTTIMEOUT => 2, CURLOPT_PROXY => '', CURLOPT_HTTPHEADER => $headers]);
    if ($cookie === null) curl_setopt_array($curl, [CURLOPT_COOKIEFILE => $cookieFile, CURLOPT_COOKIEJAR => $cookieFile]);
    else curl_setopt($curl, CURLOPT_COOKIE, $cookie);
    if ($data !== null) curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($data)]);
    $raw = curl_exec($curl);
    if ($raw === false) { $error = curl_error($curl); curl_close($curl); throw new RuntimeException('Local HTTP test unavailable: ' . $error); }
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $size = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
    $cookies = curl_getinfo($curl, CURLINFO_COOKIELIST);
    curl_close($curl);
    return ['status' => $status, 'headers' => substr($raw, 0, $size), 'body' => substr($raw, $size), 'cookies' => $cookies];
}

function csrf(array $response): string
{
    if (!preg_match('/name="(?:csrf|admin-csrf)" (?:value|content)="([a-f0-9]{64})"/', $response['body'], $matches)) throw new RuntimeException('Missing CSRF token.');
    return $matches[1];
}

function sessionCookie(array $response): array
{
    foreach ($response['cookies'] as $line) {
        $parts = explode("\t", $line);
        if (str_replace('#HttpOnly_', '', $parts[0] ?? '') === '127.0.0.1' && str_starts_with($parts[5] ?? '', 'KATRIBO_ADMIN_')) return ['name' => $parts[5], 'value' => $parts[6]];
    }
    throw new RuntimeException('Missing admin session cookie.');
}

function ageSession(array $cookie, array $changes): void
{
    global $temp;
    session_save_path($temp);
    session_name($cookie['name']); session_id($cookie['value']);
    session_start();
    foreach ($changes as $name => $value) $_SESSION[$name] = $value;
    session_write_close();
}

try {
    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $error);
    if (!$socket) throw new RuntimeException('Cannot bind test port: ' . $error);
    $port = (int) substr(strrchr(stream_socket_get_name($socket, false), ':'), 1);
    fclose($socket);
    $server = proc_open([PHP_BINARY, '-d', 'session.save_path=' . $temp, '-S', '127.0.0.1:' . $port, '-t', $root], [0 => ['pipe', 'r'], 1 => ['file', $logFile, 'a'], 2 => ['file', $logFile, 'a']], $pipes, $root, $environment);
    if (!is_resource($server)) throw new RuntimeException('Cannot start local test server.');
    fclose($pipes[0]);
    $ready = false;
    for ($i = 0; $i < 30; $i++) {
        $probe = @stream_socket_client('tcp://127.0.0.1:' . $port, $errno, $error, 0.1);
        if ($probe) { fclose($probe); $ready = true; break; }
        usleep(100000);
    }
    if (!$ready) throw new RuntimeException('Local HTTP test server did not become reachable.');

    $storefront = request('/index.php');
    check(in_array($storefront['status'], [302, 503], true) && !str_contains($storefront['headers'], '/admin/login.php'), 'Visitors can open the storefront entry without an admin session');
    $r = request('/admin/');
    check($r['status'] === 303 && str_contains($r['headers'], '/admin/setup.php') && !str_contains($r['body'], 'admin-catalogue'), 'Unauthenticated dashboard requests cannot read the dashboard');
    check(request('/admin/session.php')['status'] === 401, 'Session API rejects unauthenticated requests');
    check(request('/admin/views/dashboard.php')['status'] === 404, 'Direct dashboard-template access is denied');
    check(request('/admin/views/auth-page.php')['status'] === 404, 'Direct authentication-template access is denied');
    check(request('/tools/check-admin.php')['status'] === 404, 'CLI smoke tool cannot expose a dashboard over HTTP');
    check(request('/admin/setup.php', null, ['Host: untrusted.example'])['status'] === 403, 'Setup rejects an untrusted Host header');
    $r = request('/admin/setup.php');
    check($r['status'] === 200, 'First-time setup is accessible on localhost');
    $token = csrf($r);
    $password = 'Test-only-passphrase-' . bin2hex(random_bytes(12));
    $details = ['name' => 'Test <Admin>', 'email' => 'owner@example.invalid', 'password' => $password, 'confirm' => $password];
    check(request('/admin/setup.php', $details)['status'] === 403 && !is_file($stateFile), 'Setup requires a valid CSRF token');
    check(request('/admin/setup.php', array_merge($details, ['csrf' => $token, 'password' => 'short', 'confirm' => 'short']))['status'] === 422 && !is_file($stateFile), 'Setup rejects a short password');
    check(request('/admin/setup.php', array_merge($details, ['csrf' => $token, 'confirm' => 'different']))['status'] === 422, 'Setup rejects mismatched passwords');
    $r = request('/admin/setup.php', $details + ['csrf' => $token]);
    check($r['status'] === 303 && str_contains($r['headers'], 'login.php?created=1'), 'Owner account is created and redirects to sign-in');
    $stored = file_get_contents($stateFile);
    $state = json_decode(substr($stored, strlen(ADMIN_STORE_PREFIX)), true, 512, JSON_THROW_ON_ERROR);
    check(!str_contains($stored, $password) && password_verify($password, $state['owner']['hash']), 'Only a verifiable password hash is persisted');
    check(str_starts_with($stored, ADMIN_STORE_PREFIX), 'Credential data has a PHP execution guard');
    $ownerId = $state['owner']['id'];
    check(request('/admin/setup.php', $details + ['csrf' => $token])['status'] === 303, 'Setup closes after the first account is created');
    $r = request('/admin/login.php'); $token = csrf($r); $oldCookie = sessionCookie($r);
    check(str_contains($r['headers'], 'HttpOnly') || str_contains(file_get_contents($cookieFile), '#HttpOnly_'), 'Administrator cookie is HttpOnly');
    check(request('/admin/login.php', ['email' => $details['email'], 'password' => $password])['status'] === 403, 'Login requires CSRF protection');
    check(request('/admin/login.php', ['email' => $details['email'], 'password' => 'incorrect', 'csrf' => $token])['status'] === 401, 'Incorrect passwords cannot sign in');
    check(request('/admin/login.php', ['email' => 'unknown@example.invalid', 'password' => $password, 'csrf' => $token])['status'] === 401, 'Unknown accounts receive the same failure status');
    $r = request('/admin/login.php', ['email' => strtoupper($details['email']), 'password' => $password, 'csrf' => $token]);
    check($r['status'] === 303 && str_contains($r['headers'], '/admin/index.php'), 'Correct credentials sign in with case-normalized email');
    $cookie = sessionCookie($r);
    check($cookie['value'] !== $oldCookie['value'], 'Sign-in rotates the session ID');
    check(str_contains(strtolower($r['headers']), 'samesite=lax'), 'Admin cookie uses SameSite=Lax');
    check(str_contains(strtolower($r['headers']), 'path=/admin/'), 'Admin cookie is scoped to the admin path');
    check(request('/admin/', null, [], $oldCookie['name'] . '=' . $oldCookie['value'])['status'] === 303, 'The pre-login session ID cannot access the dashboard');
    $r = request('/admin/'); $token = csrf($r);
    check($r['status'] === 200 && str_contains($r['body'], 'Test &lt;Admin&gt;') && str_contains($r['body'], 'admin-catalogue'), 'Signed-in owner sees the dashboard with an escaped display name');
    check(str_contains($r['headers'], 'no-store') && str_contains($r['headers'], 'frame-ancestors'), 'Protected responses disable caching and framing');
    check(request('/admin/session.php')['status'] === 200, 'Signed-in session checks succeed');
    check(request('/admin/session.php', [])['status'] === 403, 'Activity updates require CSRF');
    check(request('/admin/session.php', ['csrf' => $token])['status'] === 200, 'Valid activity updates succeed');
    check(request('/admin/logout.php')['status'] === 405 && request('/admin/session.php')['status'] === 200, 'GET requests cannot sign the owner out');
    check(request('/admin/logout.php', ['csrf' => 'incorrect'])['status'] === 403 && request('/admin/session.php')['status'] === 200, 'Forged logout requests are rejected');
    check(request('/admin/logout.php', ['csrf' => $token])['status'] === 303, 'POST with a valid token signs out');
    check(request('/admin/', null, [], $cookie['name'] . '=' . $cookie['value'])['status'] === 303, 'A logged-out session cannot be replayed');
    check(request('/admin/session.php')['status'] === 401, 'Signed-out session API is inaccessible');

    $login = function () use ($details, $password): array {
        $form = request('/admin/login.php');
        $r = request('/admin/login.php', ['email' => $details['email'], 'password' => $password, 'csrf' => csrf($form)]);
        check($r['status'] === 303, 'Owner can sign in again');
        return sessionCookie($r);
    };
    $cookie = $login();
    ageSession($cookie, ['last_seen' => time() - ADMIN_IDLE_SECONDS - 1]);
    check(request('/admin/session.php')['status'] === 401, 'An idle session expires on the server');
    $cookie = $login();
    ageSession($cookie, ['last_seen' => time(), 'signed_at' => time() - ADMIN_MAX_SESSION_SECONDS - 1]);
    check(request('/admin/session.php')['status'] === 401, 'Absolute session expiry is enforced despite recent activity');

    $token = csrf(request('/admin/login.php'));
    for ($i = 0; $i < 5; $i++) check(request('/admin/login.php', ['email' => $details['email'], 'password' => 'incorrect', 'csrf' => $token])['status'] === 401, 'Failed login counted without authenticating');
    $r = request('/admin/login.php', ['email' => $details['email'], 'password' => $password, 'csrf' => $token]);
    check($r['status'] === 429 && str_contains($r['headers'], 'Retry-After:'), 'Repeated login failures trigger a timed lockout');
    $stored = file_get_contents($stateFile);
    $state = json_decode(substr($stored, strlen(ADMIN_STORE_PREFIX)), true, 512, JSON_THROW_ON_ERROR);
    check($state['owner']['id'] === $ownerId, 'Rejected setup and login attempts preserve the original owner');
    foreach ($state['attempts'] as &$attempt) $attempt['start'] = time() - 901;
    unset($attempt);
    file_put_contents($stateFile, ADMIN_STORE_PREFIX . json_encode($state, JSON_THROW_ON_ERROR));
    $cookie = $login();
    check(request('/admin/session.php')['status'] === 200, 'Sign-in recovers after the lockout window');
    file_put_contents($stateFile, 'invalid storage');
    check(request('/admin/')['status'] === 503 && request('/admin/setup.php')['status'] === 503, 'Corrupt storage fails closed rather than reopening account setup');
    echo 'PASS: ' . count($passed) . ' HTTP authentication checks; real owner and session files were not used.' . PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage() . PHP_EOL);
    $failed = true;
} finally {
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    // The exact random directory was created above for this run; no recursive cleanup.
    foreach (glob($temp . '/*') ?: [] as $file) if (is_file($file)) unlink($file);
    rmdir($temp);
}
exit(isset($failed) ? 1 : 0);

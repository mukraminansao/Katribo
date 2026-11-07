<?php
declare(strict_types=1);

const ADMIN_IDLE_SECONDS = 1800;
const ADMIN_MAX_SESSION_SECONDS = 28800;
const ADMIN_STORE_PREFIX = "<?php http_response_code(404); exit; ?>\n";

function admin_base_path(): string
{
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/admin/index.php');
    // PHP's built-in server may report a directory URL rather than index.php.
    if (str_ends_with($script, '/')) return $script;
    return rtrim(dirname($script), '/') . '/';
}

function admin_bootstrap(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    header('Cache-Control: no-store, private');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_trans_sid', '0');
    ini_set('session.gc_maxlifetime', (string) ADMIN_MAX_SESSION_SECONDS);
    session_name('KATRIBO_ADMIN_' . substr(hash('sha256', dirname(__DIR__)), 0, 10));
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => admin_base_path(),
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    if (!session_start()) throw new RuntimeException('Could not start the administrator session.');
}

/** PHP-guarded data plus Apache denial; no clear-text passwords are stored. */
function admin_store_file(): string
{
    return getenv('KATRIBO_ADMIN_AUTH_FILE') ?: dirname(__DIR__) . '/private/auth-state.php';
}

/** Serialize account creation and attempt counters across concurrent requests. */
function admin_state(callable $operation, bool $write = false): mixed
{
    $path = admin_store_file();
    $lock = @fopen(dirname($path) . '/auth-lock.php', 'c+b');
    if (!$lock || !flock($lock, $write ? LOCK_EX : LOCK_SH)) {
        if ($lock) fclose($lock);
        throw new RuntimeException('Administrator storage is unavailable.');
    }
    $temp = null;
    try {
        $state = ['version' => 1, 'owner' => null, 'attempts' => []];
        if (is_file($path)) {
            $raw = @file_get_contents($path);
            if ($raw === false || !str_starts_with($raw, ADMIN_STORE_PREFIX)) throw new RuntimeException('Invalid administrator storage.');
            $state = json_decode(substr($raw, strlen(ADMIN_STORE_PREFIX)), true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($state) || ($state['version'] ?? null) !== 1 || !array_key_exists('owner', $state) || !is_array($state['attempts'] ?? null)) throw new RuntimeException('Invalid administrator storage.');
            $owner = $state['owner'];
            if ($owner !== null && (!is_array($owner) || !isset($owner['id'], $owner['name'], $owner['email'], $owner['hash'], $owner['auth_version']))) throw new RuntimeException('Invalid administrator account.');
            if (isset($state['users']) && !is_array($state['users'])) throw new RuntimeException('Invalid team accounts.');
            foreach ($state['users'] ?? [] as $id => $user) {
                if (!is_array($user) || !isset($user['id'], $user['name'], $user['email'], $user['hash'], $user['auth_version'], $user['role'], $user['active']) || $id !== $user['id'] || !in_array($user['role'], ['manager', 'staff'], true) || !is_bool($user['active']) || ($owner && $id === $owner['id'])) throw new RuntimeException('Invalid team account.');
            }
        }
        $result = $operation($state);
        if ($write) {
            $encoded = ADMIN_STORE_PREFIX . json_encode($state, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
            $temp = dirname($path) . '/auth-write-' . bin2hex(random_bytes(12)) . '.php';
            if (@file_put_contents($temp, $encoded, LOCK_EX) !== strlen($encoded)) throw new RuntimeException('Could not save administrator storage.');
            @chmod($temp, 0600);
            if (!@rename($temp, $path)) throw new RuntimeException('Could not replace administrator storage.');
            $temp = null;
        }
        return $result;
    } finally {
        if ($temp !== null && is_file($temp)) unlink($temp);
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function admin_has_owner(): bool
{
    return admin_state(fn(array &$state): bool => $state['owner'] !== null);
}

function admin_local_setup_allowed(): bool
{
    $peer = $_SERVER['REMOTE_ADDR'] ?? '';
    $host = strtolower($_SERVER['HTTP_HOST'] ?? '');
    return in_array($peer, ['127.0.0.1', '::1', '::ffff:127.0.0.1'], true)
        && preg_match('/^(localhost|127\.0\.0\.1|\[::1\])(:[0-9]{1,5})?$/D', $host) === 1;
}

function admin_csrf_token(): string
{
    if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function admin_valid_csrf(mixed $token): bool
{
    return is_string($token) && isset($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $token);
}

function admin_account_errors(string $name, string $email, string $password, string $confirm): array
{
    $errors = [];
    if (mb_strlen($name) < 2 || mb_strlen($name) > 80) $errors[] = 'Enter a name between 2 and 80 characters.';
    if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Enter a valid email address.';
    if (mb_strlen($password) < 12 || strlen($password) > 72 || str_contains($password, "\0")) $errors[] = 'Use at least 12 characters and no more than 72 bytes for your password.';
    if (!hash_equals($password, $confirm)) $errors[] = 'The passwords do not match.';
    return $errors;
}

function admin_create_owner(string $name, string $email, string $password): bool
{
    if (admin_account_errors($name, $email, $password, $password)) throw new InvalidArgumentException('Invalid administrator details.');
    $hash = password_hash($password, PASSWORD_DEFAULT);
    return admin_state(function (array &$state) use ($name, $email, $hash): bool {
        if ($state['owner'] !== null) return false;
        $state['owner'] = [
            'id' => bin2hex(random_bytes(16)), 'name' => $name,
            'email' => strtolower($email), 'hash' => $hash,
            'auth_version' => bin2hex(random_bytes(16)), 'created_at' => time(),
        ];
        return true;
    }, true);
}

function admin_attempt_login(string $email, string $password, string $ip): array
{
    $email = strtolower(trim($email));
    return admin_state(function (array &$state) use ($email, $password, $ip): array {
        $now = time();
        foreach ($state['attempts'] as $key => $attempt) {
            if ($now - $attempt['start'] >= 900) unset($state['attempts'][$key]);
        }
        $limits = ['ip:' . hash('sha256', $ip) => 5, 'account:' . hash('sha256', $email) => 20];
        foreach ($limits as $key => $limit) {
            $attempt = $state['attempts'][$key] ?? null;
            if ($attempt !== null && $attempt['count'] >= $limit) return ['ok' => false, 'retry_after' => max(1, 900 - ($now - $attempt['start']))];
        }
        $owner = null; $userKey = null;
        if ($state['owner'] !== null && hash_equals($state['owner']['email'], $email)) $owner = $state['owner'];
        else foreach ($state['users'] ?? [] as $id => $user) if (hash_equals($user['email'], $email)) { $owner = $user; $userKey = $id; break; }
        // A valid dummy hash keeps an unknown email on the password verification path.
        $hash = $owner['hash'] ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $validPassword = strlen($password) <= 72 && !str_contains($password, "\0");
        $verified = password_verify($validPassword ? $password : '', $hash);
        if ($owner !== null && ($owner['active'] ?? true) && hash_equals($owner['email'], $email) && strlen($email) <= 254 && $verified && $validPassword) {
            foreach ($limits as $key => $_) unset($state['attempts'][$key]);
            if ($userKey === null) $account =& $state['owner']; else $account =& $state['users'][$userKey];
            if (password_needs_rehash($hash, PASSWORD_DEFAULT)) $account['hash'] = password_hash($password, PASSWORD_DEFAULT);
            $account['last_login_at'] = $now;
            return ['ok' => true, 'owner' => $account];
        }
        foreach ($limits as $key => $_) {
            $attempt = $state['attempts'][$key] ?? ['start' => $now, 'count' => 0];
            $attempt['count']++;
            $state['attempts'][$key] = $attempt;
        }
        // Bound disk growth even when many different email addresses are submitted.
        if (count($state['attempts']) > 2000) {
            uasort($state['attempts'], fn($a, $b) => $a['start'] <=> $b['start']);
            $state['attempts'] = array_slice($state['attempts'], -2000, null, true);
        }
        return ['ok' => false, 'retry_after' => 0];
    }, true);
}

function admin_sign_in(array $owner): void
{
    if (!session_regenerate_id(true)) throw new RuntimeException('Could not renew administrator session.');
    $_SESSION = ['admin_id' => $owner['id'], 'auth_version' => $owner['auth_version'], 'signed_at' => time(), 'last_seen' => time(), 'csrf' => bin2hex(random_bytes(32))];
}

function admin_current_user(bool $touch = true): ?array
{
    if (!isset($_SESSION['admin_id'], $_SESSION['auth_version'], $_SESSION['signed_at'], $_SESSION['last_seen'])) return null;
    $now = time();
    if ($now - $_SESSION['last_seen'] >= ADMIN_IDLE_SECONDS || $now - $_SESSION['signed_at'] >= ADMIN_MAX_SESSION_SECONDS) {
        $_SESSION = [];
        session_regenerate_id(true);
        return null;
    }
    $owner = admin_state(function (array &$state): ?array {
        if ($state['owner'] !== null && hash_equals($state['owner']['id'], $_SESSION['admin_id'])) return $state['owner'] + ['role' => 'owner'];
        return $state['users'][$_SESSION['admin_id']] ?? null;
    });
    if ($owner === null || !($owner['active'] ?? true) || !hash_equals($owner['id'], $_SESSION['admin_id']) || !hash_equals($owner['auth_version'], $_SESSION['auth_version'])) {
        $_SESSION = [];
        return null;
    }
    if ($touch) $_SESSION['last_seen'] = $now;
    return ['id' => $owner['id'], 'name' => $owner['name'], 'email' => $owner['email'], 'role' => $owner['role'] ?? 'owner'];
}

function admin_can(array $user, string $permission): bool
{
    $role = $user['role'] ?? 'owner';
    return match ($permission) {
        'manage-team' => $role === 'owner',
        'manage-menu' => in_array($role, ['owner', 'manager'], true),
        'process-orders' => in_array($role, ['owner', 'manager', 'staff'], true),
        default => false,
    };
}

function admin_redirect(string $page): never
{
    header('Location: ' . admin_base_path() . $page, true, 303);
    exit;
}

function admin_require_user(): array
{
    admin_bootstrap();
    $user = admin_current_user();
    if ($user === null) admin_redirect(admin_has_owner() ? 'login.php' : 'setup.php');
    return $user;
}

function admin_sign_out(): void
{
    $_SESSION = [];
    $params = session_get_cookie_params();
    setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $params['path'], 'secure' => $params['secure'], 'httponly' => true, 'samesite' => 'Lax']);
    session_destroy();
}

function admin_unavailable(Throwable $error): never
{
    error_log('Katribo admin: ' . get_class($error) . ' in authentication storage/session handling.');
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'Administrator sign-in is temporarily unavailable. Check the PHP session directory and admin/private folder permissions, then try again.';
    exit;
}

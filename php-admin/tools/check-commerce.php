<?php
/** End-to-end HTTP/MySQL checks. All writes are confined to a fresh random test database. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/orders.php';
require_once __DIR__ . '/../includes/catalogue.php';
require_once __DIR__ . '/../admin/includes/auth.php';
class CommercePreviewComplete extends RuntimeException {}

if (($argv[1] ?? '') === '--worker') {
    if (!preg_match('/^katribo_test_[a-f0-9]{16}$/D', getenv('KATRIBO_DB_NAME') ?: '')) exit(2);
    echo json_encode(order_place(db(), json_decode(stream_get_contents(STDIN), true, 64, JSON_THROW_ON_ERROR)), JSON_THROW_ON_ERROR);
    exit;
}

$root = dirname(__DIR__);
$temp = sys_get_temp_dir() . '/katribo-commerce-test-' . bin2hex(random_bytes(8));
mkdir($temp, 0700);
$name = 'katribo_test_' . bin2hex(random_bytes(8));
$environment = getenv();
$environment['KATRIBO_DB_NAME'] = $name;
$environment['KATRIBO_ADMIN_AUTH_FILE'] = $temp . '/auth-state.php';
putenv('KATRIBO_DB_NAME=' . $name);
putenv('KATRIBO_ADMIN_AUTH_FILE=' . $environment['KATRIBO_ADMIN_AUTH_FILE']);
$cookieFile = $temp . '/cookies.txt';
$processes = []; $created = false; $serverDb = null; $count = 0;

function verify(bool $condition, string $message): void
{
    global $count;
    if (!$condition) throw new RuntimeException('FAIL: ' . $message);
    $count++;
}

function startServer(array $env): int
{
    global $temp, $root, $processes;
    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $error);
    if (!$socket) throw new RuntimeException('Local test port unavailable.');
    $port = (int) substr(strrchr(stream_socket_get_name($socket, false), ':'), 1); fclose($socket);
    $process = proc_open([PHP_BINARY, '-d', 'session.save_path=' . $temp, '-S', '127.0.0.1:' . $port, '-t', $root], [0 => ['pipe', 'r'], 1 => ['file', $temp . '/server.log', 'a'], 2 => ['file', $temp . '/server.log', 'a']], $pipes, $root, $env);
    if (!is_resource($process)) throw new RuntimeException('Could not start test server.');
    fclose($pipes[0]); $processes[] = $process;
    for ($i = 0; $i < 30; $i++) {
        $probe = @stream_socket_client('tcp://127.0.0.1:' . $port, $errno, $error, 0.1);
        if ($probe) { fclose($probe); return $port; }
        usleep(100000);
    }
    throw new RuntimeException('Local HTTP test server did not become reachable.');
}

function http(string $path, mixed $data = null, array $options = []): array
{
    global $port, $cookieFile;
    $curl = curl_init('http://127.0.0.1:' . ($options['port'] ?? $port) . $path);
    $headers = $options['headers'] ?? [];
    if ($data !== null) $headers[] = !empty($options['form']) ? 'Content-Type: application/x-www-form-urlencoded' : 'Content-Type: application/json';
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 2, CURLOPT_PROXY => '', CURLOPT_HTTPHEADER => $headers]);
    if (!empty($options['guest'])) curl_setopt($curl, CURLOPT_COOKIE, '');
    else curl_setopt_array($curl, [CURLOPT_COOKIEJAR => $cookieFile, CURLOPT_COOKIEFILE => $cookieFile]);
    if ($data !== null) curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => !empty($options['form']) ? http_build_query($data) : (is_string($data) ? $data : json_encode($data, JSON_THROW_ON_ERROR))]);
    if (isset($options['method'])) curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $options['method']);
    $raw = curl_exec($curl);
    if ($raw === false) throw new RuntimeException('HTTP test failed: ' . curl_error($curl));
    $size = curl_getinfo($curl, CURLINFO_HEADER_SIZE); $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE); curl_close($curl);
    $body = substr($raw, $size);
    return ['status' => $status, 'body' => $body, 'headers' => substr($raw, 0, $size), 'data' => json_decode($body, true)];
}

function token(array $r): string
{
    if (!preg_match('/name="(?:csrf|admin-csrf)" (?:value|content)="([a-f0-9]{64})"/', $r['body'], $m)) throw new RuntimeException('Missing CSRF token.');
    return $m[1];
}

function basket(array $changes = []): array
{
    return array_replace(['requestKey' => bin2hex(random_bytes(24)), 'name' => 'Test Guest', 'phone' => '09171234567', 'email' => 'guest@example.invalid', 'note' => 'Test pickup note', 'fulfilment' => 'pickup', 'items' => [['id' => 'iced-latte', 'size' => 'large', 'addons' => ['extra-espresso'], 'qty' => 2]]], $changes);
}

function startConnectedSite(int $backendPort): int
{
    global $temp, $root, $processes, $environment;
    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $error);
    if (!$socket) throw new RuntimeException('Test website port unavailable.');
    $sitePort = (int) substr(strrchr(stream_socket_get_name($socket, false), ':'), 1); fclose($socket);
    $env = $environment;
    $env['PORT'] = (string) $sitePort;
    $env['KATRIBO_BACKEND_URL'] = 'http://127.0.0.1:' . $backendPort . '/';
    $node = getenv('ProgramFiles') . '/nodejs/node.exe';
    $process = proc_open([$node, 'server.mjs'], [0 => ['pipe','r'], 1 => ['file', $temp . '/node.log', 'a'], 2 => ['file', $temp . '/node.log', 'a']], $pipes, $root . '/katribo-react', $env);
    if (!is_resource($process)) throw new RuntimeException('Could not start connected website.');
    fclose($pipes[0]); $processes[] = $process;
    for ($i = 0; $i < 40; $i++) {
        $probe = @stream_socket_client('tcp://127.0.0.1:' . $sitePort, $errno, $error, 0.1);
        if ($probe) { fclose($probe); return $sitePort; }
        usleep(100000);
    }
    throw new RuntimeException('Connected website did not start.');
}

function mutate(array $body): array
{
    global $csrf;
    return http('/admin/api.php', $body, ['headers' => ['X-CSRF-Token: ' . $csrf]]);
}

try {
    $serverDb = db_connect(false);
    // CREATE without IF NOT EXISTS proves this run owns the database it later drops.
    $serverDb->exec('CREATE DATABASE `' . $name . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'); $created = true;
    $pdo = db_connect(); db_migrate($pdo, products_seed()); db_migrate($pdo, products_seed());
    verify((int) $pdo->query('SELECT COUNT(*) FROM menu_items')->fetchColumn() === 26, 'Rerunning schema setup does not duplicate menu entries');
    verify((int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn() === 0, 'A fresh database has no sample orders');
    $password = 'Disposable-passphrase-' . bin2hex(random_bytes(8));
    admin_create_owner('Test Owner', 'owner@example.invalid', $password);
    $port = startServer($environment);
    if (($argv[1] ?? '') === '--preview') {
        $sitePort = startConnectedSite($port);
        echo json_encode(['url' => 'http://127.0.0.1:' . $port, 'site' => 'http://127.0.0.1:' . $sitePort, 'database' => $name, 'testEmail' => 'owner@example.invalid', 'testPassword' => $password], JSON_THROW_ON_ERROR) . PHP_EOL;
        // Retain an isolated browser QA fixture until the controlling terminal closes stdin.
        fgets(STDIN);
        throw new CommercePreviewComplete();
    }
    verify(http('/admin/api.php', null, ['guest' => true])['status'] === 401, 'Guest cannot read orders, customer details or the management catalogue');
    verify(http('/admin/api.php', ['action' => 'product-delete'], ['guest' => true])['status'] === 401, 'Guest cannot mutate the catalogue');
    verify(http('/tools/setup-database.php')['status'] === 404 && http('/tools/check-commerce.php')['status'] === 404, 'Database tools reject HTTP access');
    verify(http('/api/catalogue.php', null, ['guest' => true])['status'] === 200 && http('/menu.php', null, ['guest' => true])['status'] === 200, 'Visitors can browse without an account');
    $loginToken = token(http('/admin/login.php'));
    verify(http('/admin/login.php', ['email' => 'owner@example.invalid', 'password' => $password, 'csrf' => $loginToken], ['form' => true])['status'] === 303, 'Disposable owner can sign in');
    $csrf = token(http('/admin/'));
    $bootstrap = http('/admin/api.php');
    verify($bootstrap['status'] === 200 && count($bootstrap['data']['products']) === 26 && $bootstrap['data']['orders'] === [], 'Admin starts with the seeded menu and actual empty order list');
    $sitePort = startConnectedSite($port);
    $public = http('/api/catalogue', null, ['guest' => true, 'port' => $sitePort]);
    verify($public['status'] === 200 && count($public['data']['products']) === 26, 'React website reads the same live catalogue as admin');
    verify(!isset($public['data']['orders']) && !str_contains($public['body'], 'customer_phone'), 'Public catalogue exposes no orders or customer information');
    $iced = array_values(array_filter($public['data']['products'], fn($p) => $p['id'] === 'iced-latte'))[0];
    verify($iced['image'] === '/images/drinks/iced-latte.jpg', 'Connected menu preserves GitHub high-resolution photos');
    $espresso = array_values(array_filter($public['data']['products'], fn($p) => $p['id'] === 'espresso'))[0];
    verify(str_starts_with($espresso['image'], '/media/assets/img/drinks/'), 'Other admin photos use the restricted media bridge');
    verify(http($espresso['image'], null, ['guest' => true, 'port' => $sitePort])['status'] === 200, 'Admin-only catalogue photos load on the React website');
    verify(http('/media/admin/private/auth-state.php', null, ['guest' => true, 'port' => $sitePort])['status'] === 404, 'Media bridge cannot read private files');
    verify(http('/api/place-order', basket(), ['guest' => true, 'port' => $sitePort, 'headers' => ['Origin: https://untrusted.example']])['status'] === 403, 'Website bridge rejects cross-origin orders');
    verify(http('/api/place-order', basket(), ['guest' => true, 'port' => $sitePort, 'form' => true])['status'] === 415, 'Website bridge requires JSON orders');
    $connectedPayload = basket(['paymentMethod' => 'gcash', 'expectedTotal' => 380]);
    $connected = http('/api/place-order', $connectedPayload, ['guest' => true, 'port' => $sitePort]);
    verify($connected['status'] === 200 && $connected['data']['total'] === 380 && !isset($connected['data']['demo']), 'React order is persisted through PHP with no demo confirmation');
    $connectedOrders = http('/admin/api.php')['data']['orders'];
    verify(count($connectedOrders) === 1 && $connectedOrders[0]['ref'] === $connected['data']['ref'] && $connectedOrders[0]['status'] === 'Pending', 'Website order appears immediately in the authenticated admin');
    verify($connectedOrders[0]['paymentMethod'] === 'gcash' && $connectedOrders[0]['note'] === 'Test pickup note', 'Payment preference and customer note are stored separately');
    $retry = http('/api/place-order', $connectedPayload, ['guest' => true, 'port' => $sitePort]);
    verify($retry['data']['ref'] === $connected['data']['ref'] && count(orders_read($pdo)) === 1, 'Website retries return the same order without duplicates');
    verify(http('/api/place-order', basket(['expectedTotal' => 1]), ['guest' => true, 'port' => $sitePort])['status'] === 409, 'Changed checkout prices require customer review before saving');
    verify(http('/api/place-order', basket(['paymentMethod' => 'unknown']), ['guest' => true, 'port' => $sitePort])['status'] === 422, 'Invalid payment preference is rejected');
    // This database belongs exclusively to the test run; reset its one fixture order.
    $pdo->exec('DELETE FROM order_status_history'); $pdo->exec('DELETE FROM order_items'); $pdo->exec('DELETE FROM orders');
    verify(http('/admin/api.php', ['action' => 'product-delete', 'id' => 'iced-latte', 'version' => 1])['status'] === 403, 'Management writes require CSRF');
    verify(http('/admin/api.php', null, ['method' => 'DELETE'])['status'] === 405, 'Unsupported management methods are rejected');
    verify(http('/api/place-order.php', null, ['guest' => true])['status'] === 405, 'Checkout is POST only');
    verify(http('/api/place-order.php', basket(), ['guest' => true, 'form' => true])['status'] === 415, 'Checkout requires JSON');
    verify(http('/api/place-order.php', '{', ['guest' => true])['status'] === 400, 'Malformed JSON is rejected');
    verify(http('/api/place-order.php', basket(), ['guest' => true, 'headers' => ['Origin: https://untrusted.example']])['status'] === 403, 'Cross-origin browser orders are rejected');

    $payload = basket(['total' => 1, 'price' => 1]);
    $placed = http('/api/place-order.php', $payload, ['guest' => true]);
    verify($placed['status'] === 200 && $placed['data']['ok'] && $placed['data']['total'] === 380 && !isset($placed['data']['demo']), 'Guest order is saved and priced from the database, not client totals');
    $ref = $placed['data']['ref'];
    verify(str_starts_with($ref, 'KTB-') && (int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn() === 1, 'Success includes a reference backed by one saved order');
    verify((int) $pdo->query('SELECT COUNT(*) FROM order_items')->fetchColumn() === 1, 'Order lines are persisted');
    $r = http('/api/place-order.php', $payload, ['guest' => true]);
    verify($r['data']['ref'] === $ref && (int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn() === 1, 'Retrying the same checkout returns the original order');
    verify(http('/api/place-order.php', array_replace($payload, ['note' => 'Different instructions']), ['guest' => true])['status'] === 409, 'Reusing a request key for different details is rejected');
    foreach ([['phone' => 'invalid'], ['name' => []], ['items' => []], ['items' => [['id' => 'iced-latte', 'qty' => 1.5]]], ['items' => [['id' => 'iced-latte', 'qty' => '2']]], ['items' => [['id' => 'iced-latte', 'qty' => 0]]], ['items' => [['id' => 'iced-latte', 'qty' => 100]]], ['items' => [['id' => 'iced-latte', 'qty' => 1, 'size' => 'invalid']]], ['items' => [['id' => 'iced-latte', 'qty' => 1, 'addons' => ['extra-espresso','extra-espresso']]]], ['items' => [['id' => 'iced-latte', 'qty' => 1, 'addons' => ['unknown']]]], ['items' => [['id' => 'missing', 'qty' => 1]]], ['items' => [['id' => 'espresso', 'qty' => 1]]]] as $bad) verify(http('/api/place-order.php', basket($bad), ['guest' => true])['status'] === 422, 'Invalid customer/cart input cannot create an order');
    verify((int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn() === 1, 'Rejected checkouts leave no partial orders');
    $orders = http('/admin/api.php')['data']['orders']; $order = $orders[0];
    verify($order['ref'] === $ref && $order['status'] === 'Pending' && $order['phone'] === '+639171234567' && $order['note'] === $payload['note'], 'Admin receives the real pending order, normalized contact and instructions');
    $update = ['action' => 'order-status', 'id' => $order['id'], 'version' => $order['version']];
    verify(mutate($update + ['status' => 'Completed'])['status'] === 422, 'Pending orders cannot skip Processing');
    $r = mutate($update + ['status' => 'Processing']);
    verify($r['status'] === 200 && $r['data']['order']['version'] === 2, 'Owner can process a pending order');
    verify(mutate($update + ['status' => 'Cancelled'])['status'] === 409, 'A stale order version cannot overwrite a newer status');
    $r = mutate(array_replace($update, ['version' => 2, 'status' => 'Completed']));
    verify($r['status'] === 200 && $r['data']['order']['status'] === 'Completed', 'Processed orders can be completed');
    verify(mutate(array_replace($update, ['version' => 3, 'status' => 'Processing']))['status'] === 422, 'Completed orders cannot be reopened');
    verify((int) $pdo->query('SELECT COUNT(*) FROM order_status_history')->fetchColumn() === 3, 'Status history records each real transition');

    $newItem = ['action' => 'product-save', 'id' => null, 'name' => 'Seasonal </script><script>alert("x")</script>', 'category' => 'Latte', 'price' => 200, 'image' => '../assets/img/drinks/iced-latte.jpg', 'description' => 'Test description', 'available' => true, 'nonCoffee' => false];
    $r = mutate($newItem); $item = $r['data']['product'] ?? [];
    verify($r['status'] === 200 && ($item['price'] ?? null) === 200, 'Owner can add a database-backed menu item');
    $public = http('/menu.php', null, ['guest' => true]);
    verify(str_contains($public['body'], 'Seasonal &lt;/script&gt;') && !str_contains($public['body'], 'Seasonal </script>'), 'Menu text and inline catalogue JSON escape stored markup');
    $customPayload = basket(['items' => [['id' => $item['id'], 'qty' => 1]]]);
    $customOrder = http('/api/place-order.php', $customPayload, ['guest' => true]);
    verify($customOrder['status'] === 200 && $customOrder['data']['total'] === 200, 'New menu items can be ordered without a visitor account');
    $edit = array_replace($newItem, ['id' => $item['id'], 'version' => 1, 'price' => 250, 'name' => 'Seasonal Latte']);
    verify(mutate($edit)['status'] === 200, 'Owner can change an item price');
    verify(mutate($edit)['status'] === 409, 'Stale menu edits cannot overwrite newer prices');
    $newPayload = basket(['items' => [['id' => $item['id'], 'qty' => 1]]]);
    verify(http('/api/place-order.php', $newPayload, ['guest' => true])['data']['total'] === 250, 'Checkout immediately uses the updated database price');
    $live = http('/api/catalogue', null, ['guest' => true, 'port' => $sitePort]);
    $liveItem = array_values(array_filter($live['data']['products'], fn($p) => $p['id'] === $item['id']))[0];
    verify($liveItem['name'] === 'Seasonal Latte' && $liveItem['price'] === 250, 'Admin-added items and edited prices appear in the React catalogue');
    verify(http('/api/place-order.php', $customPayload, ['guest' => true])['data']['total'] === 200, 'Retrying an accepted order preserves its historical price after a menu edit');
    $saved = orders_read($pdo);
    $old = array_values(array_filter($saved, fn($o) => $o['ref'] === $customOrder['data']['ref']))[0];
    verify($old['lines'][0]['unit'] === 200 && str_starts_with($old['lines'][0]['name'], 'Seasonal </script>'), 'Historical order lines preserve both name and price');
    verify(mutate(array_replace($edit, ['version' => 2, 'available' => false]))['status'] === 200, 'Owner can hide a menu item');
    $live = http('/api/catalogue', null, ['guest' => true, 'port' => $sitePort]);
    verify(!in_array($item['id'], array_column($live['data']['products'], 'id'), true), 'Hidden admin items disappear from the React menu');
    verify(http('/drink.php?id=' . $item['id'], null, ['guest' => true])['status'] === 404, 'Hidden items cannot be opened on the public site');
    verify(http('/api/place-order.php', basket(['items' => [['id' => $item['id'], 'qty' => 1]]]), ['guest' => true])['status'] === 422, 'Hidden items cannot be ordered from a stale cart');
    verify(mutate(['action' => 'product-delete', 'id' => $item['id'], 'version' => 3])['status'] === 200, 'Menu removal is persisted');
    verify((int) $pdo->query("SELECT COUNT(*) FROM order_items WHERE product_id='" . $item['id'] . "'")->fetchColumn() === 2, 'Removing a menu item leaves its order history intact');
    foreach ([['price' => -1], ['price' => 1.5], ['category' => 'Unknown'], ['image' => '../includes/config.php']] as $bad) verify(mutate(array_replace($newItem, $bad))['status'] === 422, 'Invalid prices, categories and image paths are rejected');
    $pastry = mutate(array_replace($newItem, ['name' => 'Test Cake', 'category' => 'Pastries', 'price' => 150]))['data']['product'];
    verify(http('/api/place-order.php', basket(['items' => [['id' => $pastry['id'], 'qty' => 1, 'size' => 'large']]]), ['guest' => true])['status'] === 422, 'Pastries cannot be ordered with drink size upgrades');
    $page = http('/drink.php?id=' . $pastry['id'], null, ['guest' => true]);
    verify($page['status'] === 200 && !str_contains($page['body'], 'name="addons"'), 'Pastry details omit drink add-ons');
    $before = (int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn();
    $pdo->exec("CREATE TRIGGER commerce_test_failure BEFORE INSERT ON order_items FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Intentional test failure'");
    verify(http('/api/place-order.php', basket(), ['guest' => true])['status'] === 503, 'A failed order-line write does not return a confirmation');
    $pdo->exec('DROP TRIGGER commerce_test_failure');
    verify((int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn() === $before, 'Order and lines roll back together on a storage failure');

    $same = basket(); $workers = [];
    for ($i = 0; $i < 2; $i++) {
        $worker = proc_open([PHP_BINARY, __FILE__, '--worker'], [0 => ['pipe','r'], 1 => ['pipe','w'], 2 => ['pipe','w']], $pipes, $root, $environment);
        if (!is_resource($worker)) throw new RuntimeException('Could not start concurrency worker.');
        fwrite($pipes[0], json_encode($same, JSON_THROW_ON_ERROR)); fclose($pipes[0]); $workers[] = [$worker, $pipes];
    }
    $refs = [];
    foreach ($workers as [$worker, $pipes]) {
        $output = stream_get_contents($pipes[1]); $error = stream_get_contents($pipes[2]); fclose($pipes[1]); fclose($pipes[2]);
        verify(proc_close($worker) === 0, 'Concurrent order worker succeeds');
        $refs[] = json_decode($output, true, 64, JSON_THROW_ON_ERROR)['ref'];
    }
    verify($refs[0] === $refs[1] && (int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn() === $before + 1, 'Concurrent retries create exactly one order');
    db_migrate($pdo, products_seed());
    verify($pdo->query("SELECT deleted_at FROM menu_items WHERE id='" . $item['id'] . "'")->fetchColumn() !== null, 'Rerunning setup does not resurrect removed menu items');
    $pdo->exec('UPDATE menu_items SET is_available=0');
    $page = http('/api/catalogue', null, ['guest' => true, 'port' => $sitePort]);
    verify($page['status'] === 200 && $page['data']['products'] === [], 'All hidden items produce an empty live menu, not a sample fallback');
    $outageEnv = $environment; $outageEnv['KATRIBO_DB_NAME'] = $name . '_missing'; $outagePort = startServer($outageEnv);
    $r = http('/api/place-order.php', basket(), ['guest' => true, 'port' => $outagePort]);
    verify($r['status'] === 503 && $r['data']['ok'] === false && !isset($r['data']['ref']), 'Database outage never produces a fake order success');
    $outageSite = startConnectedSite($outagePort);
    verify(http('/api/catalogue', null, ['guest' => true, 'port' => $outageSite])['status'] === 503, 'React catalogue reports database outages without stale sample data');
    verify(http('/api/place-order', basket(), ['guest' => true, 'port' => $outageSite])['status'] === 503, 'React checkout preserves PHP database failure responses');
    verify(http('/admin/api.php', null, ['port' => $outagePort])['status'] === 503, 'Admin reports a database outage instead of sample orders');
    $outagePage = http('/checkout.php', null, ['guest' => true, 'port' => $outagePort]);
    verify($outagePage['status'] === 200 && str_contains($outagePage['body'], '"catalogueOnline":false') && str_contains($outagePage['body'], 'temporarily unavailable'), 'Checkout detects an offline catalogue and signals the browser to retain its cart');
    verify((int) db_connect()->query('SELECT COUNT(*) FROM orders')->fetchColumn() === $before + 1, 'A separate database connection reads persisted orders');
    echo 'PASS: ' . $count . ' HTTP/MySQL commerce checks. Real accounts, menu edits and orders were not used.' . PHP_EOL;
} catch (CommercePreviewComplete $done) {
    echo 'Isolated browser preview closed.' . PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage() . PHP_EOL);
    $failed = true;
} finally {
    foreach ($processes as $process) { proc_terminate($process); proc_close($process); }
    $pdo = null;
    if ($created && $serverDb && preg_match('/^katribo_test_[a-f0-9]{16}$/D', $name)) $serverDb->exec('DROP DATABASE `' . $name . '`');
    foreach (glob($temp . '/*') ?: [] as $file) if (is_file($file)) unlink($file);
    rmdir($temp);
}
exit(isset($failed) ? 1 : 0);

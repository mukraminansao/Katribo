<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/catalogue.php';
require_once __DIR__ . '/../includes/orders.php';
require_once __DIR__ . '/includes/menu-photos.php';
require_once __DIR__ . '/includes/team.php';
header('Content-Type: application/json; charset=utf-8');
try {
    admin_bootstrap();
    $admin = admin_current_user($_SERVER['REQUEST_METHOD'] !== 'GET');
    if ($admin === null) throw new ShopError(401, 'Your session ended. Sign in again.');
    $method = $_SERVER['REQUEST_METHOD'];
    if (!in_array($method, ['GET','POST'], true)) { header('Allow: GET, POST'); throw new ShopError(405, 'Method not allowed.'); }
    if ($method === 'POST' && !admin_valid_csrf($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null)) throw new ShopError(403, 'This form expired. Reload the dashboard and try again.');
    // Do not hold the PHP session lock during database reads/writes.
    session_write_close();
    $pdo = db();
    if ($method === 'GET') {
        $catalogue = array_values(catalogue_all($pdo));
        foreach ($catalogue as &$p) $p['image'] = '../' . $p['image'];
        unset($p);
        echo json_encode(['ok' => true, 'user' => $admin, 'team' => admin_can($admin, 'manage-team') ? admin_team_list() : [], 'products' => $catalogue, 'categories' => catalogue_categories($pdo), 'orders' => orders_read($pdo)], JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }
    $multipart = str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data;');
    if ($multipart && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 7 * 1024 * 1024) throw new ShopError(413, 'Choose a photo smaller than 6 MB.');
    $body = $multipart ? ($_POST['payload'] ?? '') : file_get_contents('php://input', false, null, 0, 65537);
    if (!is_string($body) || strlen($body) > 65536) throw new ShopError(413, 'Request too large.');
    try { $in = json_decode($body, true, 64, JSON_THROW_ON_ERROR); } catch (JsonException $error) { throw new ShopError(400, 'Invalid request.'); }
    if (!is_array($in)) throw new ShopError(400, 'Invalid request.');
    $action = $in['action'] ?? null;
    if (in_array($action, ['product-save', 'product-delete', 'featured-reorder'], true) && !admin_can($admin, 'manage-menu')) throw new ShopError(403, 'Only the owner or a manager can change the menu.');
    if ($multipart && ($action !== 'product-save' || !isset($_FILES['photo']) || count($_FILES) !== 1)) throw new ShopError(422, 'Upload one photo while saving a menu item.');
    if ($action === 'order-status') $result = ['order' => order_update_status($pdo, $in, $admin['id'])];
    elseif ($action === 'product-save') $result = ['product' => $multipart ? admin_save_menu_with_photo($pdo, $in, $_FILES['photo']) : catalogue_save($pdo, $in)];
    elseif ($action === 'product-delete') { catalogue_delete($pdo, $in); $result = []; }
    elseif ($action === 'featured-reorder') $result = ['products' => catalogue_reorder_featured($pdo, $in)];
    elseif ($action === 'team-save') $result = ['team' => admin_team_save($admin, $in)];
    else throw new ShopError(400, 'Unknown management action.');
    echo json_encode(['ok' => true] + $result, JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE);
} catch (ShopError $error) {
    http_response_code($error->status); echo json_encode(['ok' => false, 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    error_log('Katribo management database error: ' . get_class($error));
    http_response_code(503); echo json_encode(['ok' => false, 'message' => 'The database is unavailable. Start MySQL in XAMPP and try again.']);
}

<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/orders.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Allow: POST'); throw new ShopError(405, 'Method not allowed.'); }
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') throw new ShopError(415, 'Send the order as JSON.');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
    if ($origin !== null) {
        $scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
        if ($origin !== $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? '')) throw new ShopError(403, 'Please order from the Katribo website.');
    }
    $body = file_get_contents('php://input', false, null, 0, 65537);
    if (strlen($body) > 65536) throw new ShopError(413, 'Order too large.');
    try { $in = json_decode($body, true, 64, JSON_THROW_ON_ERROR); } catch (JsonException $error) { throw new ShopError(400, 'Invalid order.'); }
    if (!is_array($in)) throw new ShopError(400, 'Invalid order.');
    // Validate even if MySQL is down so malformed requests do not reach storage.
    order_input($in);
    echo json_encode(order_place(db(), $in), JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
} catch (ShopError $error) {
    http_response_code($error->status); echo json_encode(['ok' => false, 'message' => $error->getMessage(), 'fields' => (object) $error->fields]);
} catch (Throwable $error) {
    error_log('Katribo checkout database error: ' . get_class($error));
    http_response_code(503); echo json_encode(['ok' => false, 'message' => 'We could not confirm your order. Your cart is kept; please retry without changing the details.']);
}

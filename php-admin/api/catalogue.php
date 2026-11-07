<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/catalogue.php';
require_once __DIR__ . '/../includes/products.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        header('Allow: GET');
        throw new ShopError(405, 'Method not allowed.');
    }
    $products = array_map(static fn(array $p): array => array_intersect_key($p, array_flip([
        'id', 'name', 'category', 'price', 'image', 'nonCoffee', 'description', 'soldOut', 'featured', 'featuredRank',
    ])), array_values(catalogue_all(db(), true)));
    echo json_encode(['ok' => true, 'products' => $products, 'sizes' => SIZES, 'addons' => ADDONS], JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE);
} catch (ShopError $error) {
    http_response_code($error->status);
    echo json_encode(['ok' => false, 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    error_log('Katribo public catalogue error: ' . get_class($error));
    http_response_code(503);
    echo json_encode(['ok' => false, 'message' => 'The menu is temporarily unavailable. Please try again shortly.']);
}

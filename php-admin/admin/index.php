<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
try {
    $admin = admin_require_user();
    require_once __DIR__ . '/../includes/config.php';
    require_once __DIR__ . '/../includes/products.php';
    // Photo choices are independent of availability and catalogue deletion.
    $catalogue = array_values(products_seed());
    foreach ($catalogue as &$item) {
        $item['image'] = '../' . $item['image'];
        $item['available'] = true;
    }
    unset($item);
    define('KATRIBO_ADMIN_VIEW', true);
    require __DIR__ . '/views/dashboard.php';
} catch (Throwable $error) { admin_unavailable($error); }

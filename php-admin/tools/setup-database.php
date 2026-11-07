<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/products.php';
require_once __DIR__ . '/../includes/database.php';
try {
    $settings = db_settings();
    $server = db_connect(false);
    $server->exec('CREATE DATABASE IF NOT EXISTS `' . $settings['name'] . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $pdo = db_connect();
    db_migrate($pdo, products_seed());
    echo 'Database ' . $settings['name'] . ' is ready. Menu items: ' . $pdo->query('SELECT COUNT(*) FROM menu_items WHERE deleted_at IS NULL')->fetchColumn() . '. Orders: ' . $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn() . '.' . PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, 'Database setup failed (' . get_class($error) . '). Check MySQL and the KATRIBO_DB_* environment settings.' . PHP_EOL);
    exit(1);
}

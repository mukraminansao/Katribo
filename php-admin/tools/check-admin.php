<?php
/** Read-only template/asset checks. HTTP authentication is tested separately. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
chdir(dirname(__DIR__));
require_once 'includes/config.php';
require_once 'includes/products.php';
require_once 'admin/includes/auth.php';
define('KATRIBO_ADMIN_VIEW', true);
$admin = ['name' => 'Template check', 'email' => 'test@example.invalid'];
$_SESSION = ['csrf' => str_repeat('0', 64)];
$catalogue = array_values(products_seed());
foreach ($catalogue as &$item) { $item['image'] = '../' . $item['image']; $item['available'] = true; }
unset($item);
ob_start();
require 'admin/views/dashboard.php';
$html = ob_get_clean();
$dom = new DOMDocument();
libxml_use_internal_errors(true);
$dom->loadHTML('<?xml encoding="UTF-8">' . $html);
$xpath = new DOMXPath($dom);
$bootstrap = $xpath->query('//script[@id="admin-catalogue"]')->item(0);
$items = json_decode($bootstrap->textContent, true, 512, JSON_THROW_ON_ERROR);
$errors = [];
if (count($items) !== count(products_seed())) $errors[] = 'Catalogue count mismatch.';
foreach ($items as $p) {
    $relative = strtok($p['image'], '?');
    if (!is_file('admin/' . $relative)) $errors[] = 'Missing image: ' . $relative;
    if (!isset($p['id'], $p['name'], $p['category'], $p['available'])) $errors[] = 'Invalid catalogue entry.';
}
$ids = [];
foreach ($xpath->query('//*[@id]') as $node) {
    $id = $node->getAttribute('id');
    if (isset($ids[$id])) $errors[] = 'Duplicate ID: ' . $id;
    $ids[$id] = true;
}
foreach ($xpath->query('//*[@src or @href]') as $node) {
    $ref = $node->getAttribute('src') ?: $node->getAttribute('href');
    if (str_starts_with($ref, '#')) continue;
    if (!is_file('admin/' . strtok($ref, '?'))) $errors[] = 'Missing shell asset: ' . $ref;
}
$css = file_get_contents('admin/assets/admin.css');
preg_match_all('/url\([\'"]?([^\)\'" ]+)/', $css, $matches);
foreach ($matches[1] as $ref) {
    if (!is_file('admin/assets/' . $ref)) $errors[] = 'Missing CSS asset: ' . $ref;
}
if (!is_file('assets/img/drinks/chocolate-cake.jpg')) $errors[] = 'Quick-action cake image missing.';
if (!is_file('assets/img/drinks/iced-latte.jpg')) $errors[] = 'Quick-action latte image missing.';
if ($errors) {
    fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL);
    exit(1);
}
echo 'PASS: ' . count($items) . ' catalogue entries, unique shell IDs, all shell/product/CSS image and font references.' . PHP_EOL;

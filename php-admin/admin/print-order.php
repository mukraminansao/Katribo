<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/orders.php';
if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'HEAD'], true)) { http_response_code(405); header('Allow: GET, HEAD'); exit; }
try {
    $admin = admin_require_user();
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $order = $id ? (orders_read(db(), $id)[0] ?? null) : null;
    if (!$order) { http_response_code(404); echo 'Order not found.'; exit; }
    $date = (new DateTimeImmutable($order['date']))->setTimezone(new DateTimeZone('Asia/Manila'))->format('M j, Y · g:i A');
} catch (Throwable $error) { admin_unavailable($error); }
?>
<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Prep slip · Order #<?= (int) $order['id'] ?></title><link rel="stylesheet" href="assets/print.css?v=1"><script src="assets/print.js?v=1" defer></script></head>
<body><header class="print-controls"><a href="index.php#orders">← Back to orders</a><button type="button" id="print-slip">Print prep slip</button><p>Choose your printer and paper size in the print dialog.</p></header>
<main class="prep-slip"><header><p class="slip-brand">KATRIBO</p><p>PREPARATION SLIP · IN-STORE PICKUP</p><h1>Order #<?= (int) $order['id'] ?></h1><p class="slip-reference"><?= e($order['ref']) ?></p><p><?= e($date) ?></p></header>
<p class="slip-status"><?= $order['status'] === 'Cancelled' ? 'CANCELLED — DO NOT PREPARE' : ($order['status'] === 'Completed' ? 'PICKUP COMPLETED' : strtoupper($order['status'])) ?></p>
<section class="slip-customer"><h2>Customer</h2><strong><?= e($order['customer']) ?></strong><p><?= e($order['phone']) ?></p></section>
<section><h2>Items to prepare</h2><ol class="slip-items"><?php foreach ($order['lines'] as $line): ?><li><strong class="slip-qty"><?= (int) $line['qty'] ?>×</strong><div><strong><?= e($line['name']) ?></strong><p><?= e($line['size']) ?></p><?php if ($line['addons']): ?><p class="slip-addons">+ <?= e(implode(', ', $line['addons'])) ?></p><?php endif; ?></div></li><?php endforeach; ?></ol></section>
<?php if ($order['note']): ?><section class="slip-note"><h2>Customer note</h2><p><?= e($order['note']) ?></p></section><?php endif; ?>
<footer><p>Payment at pickup<?= $order['paymentMethod'] ? ' · ' . e(ucfirst($order['paymentMethod'])) : '' ?></p><p>Good coffee. A little care.</p></footer></main></body></html>

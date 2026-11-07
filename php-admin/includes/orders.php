<?php
declare(strict_types=1);
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/shop-error.php';
require_once __DIR__ . '/products.php';

function order_input(array $in): array
{
    foreach (['name','phone','email','note','fulfilment','requestKey'] as $key) {
        if (isset($in[$key]) && !is_string($in[$key])) throw new ShopError(422, 'Invalid customer details.');
    }
    $name = trim($in['name'] ?? '');
    $phone = preg_replace('/[\s\-()]/', '', $in['phone'] ?? '');
    $email = trim($in['email'] ?? '');
    $note = trim($in['note'] ?? '');
    $fulfilment = $in['fulfilment'] ?? 'pickup';
    $errors = [];
    if (mb_strlen($name) < 2 || mb_strlen($name) > 80) $errors['name'] = 'Please enter your full name.';
    if (!preg_match('/^(\+639|09)\d{9}$/D', $phone)) $errors['phone'] = 'Enter a valid PH mobile number.';
    if (strlen($email) > 254 || ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL))) $errors['email'] = 'Enter a valid email address.';
    if ($fulfilment !== 'pickup') $errors['fulfilment'] = 'Only pickup is available.';
    if (mb_strlen($note) > 300) throw new ShopError(422, 'Keep special instructions within 300 characters.');
    if ($errors) throw new ShopError(422, 'Please check the highlighted fields.', $errors);
    if (str_starts_with($phone, '09')) $phone = '+63' . substr($phone, 1);
    $requestKey = $in['requestKey'] ?? '';
    if (!preg_match('/^[a-zA-Z0-9-]{16,64}$/D', $requestKey)) throw new ShopError(422, 'Please reload checkout and try again.');
    $items = $in['items'] ?? null;
    if (!is_array($items) || !array_is_list($items) || count($items) < 1 || count($items) > 50) throw new ShopError(422, 'Your cart must contain between 1 and 50 items.');
    $normalized = [];
    foreach ($items as $it) {
        if (!is_array($it) || !is_string($it['id'] ?? null) || !preg_match('/^[a-z0-9-]{1,80}$/D', $it['id'])) throw new ShopError(422, 'Invalid menu item in your cart.');
        $qty = $it['qty'] ?? null;
        if (!is_int($qty) || $qty < 1 || $qty > 99) throw new ShopError(422, 'Invalid quantity.');
        $size = $it['size'] ?? 'regular';
        if (!is_string($size) || !in_array($size, array_column(SIZES, 'id'), true)) throw new ShopError(422, 'Invalid size selected.');
        $addons = $it['addons'] ?? [];
        if (!is_array($addons) || !array_is_list($addons) || count($addons) > count(ADDONS)) throw new ShopError(422, 'Invalid add-ons selected.');
        foreach ($addons as $addon) if (!is_string($addon) || !in_array($addon, array_column(ADDONS, 'id'), true)) throw new ShopError(422, 'Invalid add-on selected.');
        if (count($addons) !== count(array_unique($addons))) throw new ShopError(422, 'Choose each add-on only once.');
        sort($addons);
        $normalized[] = ['id' => $it['id'], 'qty' => $qty, 'size' => $size, 'addons' => $addons];
    }
    $result = ['name' => $name, 'phone' => $phone, 'email' => $email, 'note' => $note, 'fulfilment' => $fulfilment, 'requestKey' => $requestKey, 'items' => $normalized];
    // Optional keys keep historical PHP checkout request hashes compatible.
    if (array_key_exists('paymentMethod', $in)) {
        if (!is_string($in['paymentMethod']) || !in_array($in['paymentMethod'], ['cash', 'gcash', 'card'], true)) throw new ShopError(422, 'Choose a valid payment method.');
        $result['paymentMethod'] = $in['paymentMethod'];
    }
    if (array_key_exists('expectedTotal', $in)) {
        if (!is_int($in['expectedTotal']) || $in['expectedTotal'] < 0) throw new ShopError(422, 'Invalid order total.');
        $result['expectedTotal'] = $in['expectedTotal'];
    }
    return $result;
}

function orders_read(PDO $pdo, ?int $id = null): array
{
    $q = $pdo->prepare('SELECT * FROM orders' . ($id !== null ? ' WHERE id=?' : '') . ' ORDER BY created_at DESC,id DESC');
    $q->execute($id !== null ? [$id] : []);
    $list = [];
    foreach ($q->fetchAll() as $row) {
        $list[(int) $row['id']] = ['id' => (int) $row['id'], 'ref' => $row['reference'], 'customer' => $row['customer_name'],
            'customerKey' => $row['customer_phone'], 'phone' => $row['customer_phone'], 'email' => $row['customer_email'],
            'note' => $row['note'], 'paymentMethod' => $row['payment_method'], 'date' => str_replace(' ', 'T', $row['created_at']) . 'Z',
            'status' => $row['status'], 'version' => (int) $row['version'], 'total' => (int) $row['total'], 'lines' => []];
    }
    if (!$list) return [];
    $q = $pdo->prepare('SELECT * FROM order_items' . ($id !== null ? ' WHERE order_id=?' : '') . ' ORDER BY id');
    $q->execute($id !== null ? [$id] : []);
    foreach ($q->fetchAll() as $row) {
        if (isset($list[(int) $row['order_id']])) $list[(int) $row['order_id']]['lines'][] = [
            'id' => $row['product_id'], 'name' => $row['product_name'], 'category' => $row['category'],
            'image' => asset($row['image']), 'size' => $row['size_label'], 'addons' => json_decode($row['addons_json'], true, 512, JSON_THROW_ON_ERROR),
            'qty' => (int) $row['qty'], 'unit' => (int) $row['unit_price'],
        ];
    }
    return array_values($list);
}

function order_confirmation(PDO $pdo, array $row, string $hash): array
{
    if (!hash_equals($row['request_hash'], $hash)) throw new ShopError(409, 'This checkout request was already used for different details. Refresh checkout before placing a different order.');
    $order = orders_read($pdo, (int) $row['id'])[0];
    return ['ok' => true, 'ref' => $order['ref'], 'name' => $order['customer'], 'total' => $order['total'], 'lines' => $order['lines']];
}

function order_place(PDO $pdo, array $raw): array
{
    $in = order_input($raw);
    $hash = hash('sha256', json_encode($in, JSON_THROW_ON_ERROR));
    $lookup = $pdo->prepare('SELECT id,request_hash FROM orders WHERE request_key=?');
    $lookup->execute([$in['requestKey']]);
    if ($existing = $lookup->fetch()) return order_confirmation($pdo, $existing, $hash);
    for ($attempt = 0; $attempt < 3; $attempt++) {
        try {
            $pdo->beginTransaction();
            $ids = array_values(array_unique(array_column($in['items'], 'id')));
            sort($ids);
            $q = $pdo->prepare('SELECT * FROM menu_items WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ') ORDER BY id FOR UPDATE');
            $q->execute($ids);
            $catalogue = array_column($q->fetchAll(), null, 'id');
            $sizes = array_column(SIZES, null, 'id'); $addons = array_column(ADDONS, null, 'id');
            $lines = []; $total = 0;
            foreach ($in['items'] as $it) {
                $p = $catalogue[$it['id']] ?? null;
                if (!$p || $p['deleted_at'] !== null || !$p['is_available'] || $p['price'] === null) throw new ShopError(422, 'An item in your cart is no longer available. Please refresh the menu.');
                if ($p['is_sold_out'] ?? false) throw new ShopError(422, $p['name'] . ' is sold out. Remove it from your cart or choose another drink.');
                if ($p['category'] === 'Pastries' && ($it['size'] !== 'regular' || $it['addons'])) throw new ShopError(422, 'Pastries are sold without size changes or drink add-ons.');
                $size = $sizes[$it['size']];
                $unit = (int) $p['price'] + $size['add'];
                $chosen = [];
                foreach ($it['addons'] as $aid) { $unit += $addons[$aid]['price']; $chosen[] = $addons[$aid]['label']; }
                $lines[] = ['id' => $p['id'], 'name' => $p['name'], 'category' => $p['category'], 'image' => $p['image'], 'size' => $size['label'], 'addons' => $chosen, 'qty' => $it['qty'], 'unit' => $unit];
                $total += $unit * $it['qty'];
            }
            if (isset($in['expectedTotal']) && $in['expectedTotal'] !== $total) throw new ShopError(409, 'Menu prices changed. Refresh this page to review your updated total before ordering.');
            $ref = 'KTB-' . (new DateTimeImmutable('now', new DateTimeZone('Asia/Manila')))->format('ymd') . '-' . strtoupper(bin2hex(random_bytes(6)));
            $q = $pdo->prepare('INSERT INTO orders (reference,request_key,request_hash,customer_name,customer_phone,customer_email,note,fulfilment,payment_method,total) VALUES (?,?,?,?,?,?,?,?,?,?)');
            $q->execute([$ref, $in['requestKey'], $hash, $in['name'], $in['phone'], $in['email'], $in['note'], $in['fulfilment'], $in['paymentMethod'] ?? null, $total]);
            $id = (int) $pdo->lastInsertId();
            $line = $pdo->prepare('INSERT INTO order_items (order_id,product_id,product_name,category,image,size_label,addons_json,qty,unit_price) VALUES (?,?,?,?,?,?,?,?,?)');
            foreach ($lines as $l) $line->execute([$id, $l['id'], $l['name'], $l['category'], $l['image'], $l['size'], json_encode($l['addons'], JSON_THROW_ON_ERROR), $l['qty'], $l['unit']]);
            $q = $pdo->prepare("INSERT INTO order_status_history (order_id,to_status) VALUES (?,'Pending')"); $q->execute([$id]);
            $pdo->commit();
            return ['ok' => true, 'ref' => $ref, 'name' => $in['name'], 'total' => $total, 'lines' => $lines];
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            if ($error instanceof PDOException) {
                $lookup->execute([$in['requestKey']]);
                if ($existing = $lookup->fetch()) return order_confirmation($pdo, $existing, $hash);
                if (($error->getCode() === '40001' || (int) ($error->errorInfo[1] ?? 0) === 1213) && $attempt < 2) continue;
            }
            throw $error;
        }
    }
    throw new RuntimeException('Could not save order.');
}

function order_update_status(PDO $pdo, array $in, string $adminId): array
{
    $id = $in['id'] ?? null; $version = $in['version'] ?? null; $status = $in['status'] ?? null;
    if (!is_int($id) || $id < 1 || !is_int($version) || $version < 1 || !is_string($status)) throw new ShopError(422, 'Invalid order update.');
    $pdo->beginTransaction();
    try {
        $q = $pdo->prepare('SELECT status,version FROM orders WHERE id=? FOR UPDATE'); $q->execute([$id]); $row = $q->fetch();
        if (!$row) throw new ShopError(404, 'Order not found.');
        if ((int) $row['version'] !== $version) throw new ShopError(409, 'This order changed elsewhere. Reload it before saving.');
        $allowed = ['Pending' => ['Processing','Cancelled'], 'Processing' => ['Completed','Cancelled'], 'Completed' => [], 'Cancelled' => []];
        if ($status !== $row['status']) {
            if (!in_array($status, $allowed[$row['status']], true)) throw new ShopError(422, 'Choose the next order status. Completed and cancelled orders cannot be reopened.');
            $q = $pdo->prepare('UPDATE orders SET status=?,version=version+1 WHERE id=?'); $q->execute([$status, $id]);
            $q = $pdo->prepare('INSERT INTO order_status_history (order_id,from_status,to_status,admin_id) VALUES (?,?,?,?)'); $q->execute([$id, $row['status'], $status, $adminId]);
        }
        $pdo->commit();
        return orders_read($pdo, $id)[0];
    } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
}

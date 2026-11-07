<?php
declare(strict_types=1);
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/shop-error.php';

function catalogue_item(array $row): array
{
    return ['id' => $row['id'], 'name' => $row['name'], 'category' => $row['category'],
        'price' => $row['price'] === null ? null : (int) $row['price'], 'image' => asset($row['image']),
        'nonCoffee' => (bool) $row['non_coffee'], 'description' => $row['description'],
        'available' => (bool) $row['is_available'], 'soldOut' => (bool) ($row['is_sold_out'] ?? false),
        'featured' => (bool) ($row['is_featured'] ?? false), 'featuredRank' => (int) ($row['featured_rank'] ?? 0), 'version' => (int) $row['version']];
}

function catalogue_all(PDO $pdo, bool $publicOnly = false): array
{
    $rows = $pdo->query('SELECT m.* FROM menu_items m JOIN menu_categories c ON c.name=m.category WHERE m.deleted_at IS NULL' . ($publicOnly ? ' AND m.is_available=1' : '') . ' ORDER BY c.sort_order, m.created_at, m.id')->fetchAll();
    $list = [];
    foreach ($rows as $row) $list[$row['id']] = catalogue_item($row);
    return $list;
}

function catalogue_categories(PDO $pdo): array
{
    return $pdo->query('SELECT name FROM menu_categories ORDER BY sort_order, name')->fetchAll(PDO::FETCH_COLUMN);
}

function catalogue_save(PDO $pdo, array $in): array
{
    $id = $in['id'] ?? null;
    if ($id !== null && (!is_string($id) || !preg_match('/^[a-z0-9-]{1,80}$/D', $id))) throw new ShopError(422, 'Invalid menu item.');
    $name = is_string($in['name'] ?? null) ? trim($in['name']) : '';
    $category = $in['category'] ?? '';
    $price = $in['price'] ?? null;
    $description = $in['description'] ?? '';
    $image = $in['image'] ?? '';
    if (mb_strlen($name) < 1 || mb_strlen($name) > 80 || !is_string($description) || mb_strlen($description) > 500) throw new ShopError(422, 'Enter a name of up to 80 characters and a description of up to 500.');
    if (!is_string($category) || !in_array($category, catalogue_categories($pdo), true)) throw new ShopError(422, 'Choose an existing category.');
    if ($price !== null && (!is_int($price) || $price < 0 || $price > 100000)) throw new ShopError(422, 'Use a whole-peso price from 0 to 100,000, or leave it unpriced.');
    // Photos must already exist in a narrow local path; uploaded files are decoded and re-encoded separately.
    if (!is_string($image)) throw new ShopError(422, 'Choose an existing photo.');
    $image = strtok(preg_replace('#^\.\./#', '', $image), '?');
    if ($image === 'assets/hero-katribo.jpg') $image = 'admin/assets/hero-katribo.jpg';
    if (!preg_match('#^(assets/img/drinks/[a-z0-9-]+\.jpg|assets/img/uploads/menu-[a-f0-9]{32}\.jpg|admin/assets/hero-katribo\.jpg)$#D', $image) || !is_file(dirname(__DIR__) . '/' . $image)) throw new ShopError(422, 'Choose an existing photo.');
    if (!is_bool($in['available'] ?? null) || !is_bool($in['nonCoffee'] ?? null)) throw new ShopError(422, 'Invalid item availability.');
    $previous = $id === null ? null : (catalogue_all($pdo)[$id] ?? null);
    $soldOut = array_key_exists('soldOut', $in) ? $in['soldOut'] : ($previous['soldOut'] ?? false);
    $featured = array_key_exists('featured', $in) ? $in['featured'] : ($previous['featured'] ?? false);
    $rank = array_key_exists('featuredRank', $in) ? $in['featuredRank'] : ($previous['featuredRank'] ?? 0);
    if (!is_bool($soldOut) || !is_bool($featured) || !is_int($rank) || $rank < 0 || $rank > 10000) throw new ShopError(422, 'Invalid stock or featured-drink settings.');
    $values = [$name, $category, $price, $image, (int) $in['nonCoffee'], $description, (int) $in['available'], (int) $soldOut, (int) $featured, $rank];
    if ($id === null) {
        $id = 'item-' . bin2hex(random_bytes(10));
        $q = $pdo->prepare('INSERT INTO menu_items (name,category,price,image,non_coffee,description,is_available,is_sold_out,is_featured,featured_rank,id) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
        $q->execute([...$values, $id]);
    } else {
        $version = $in['version'] ?? null;
        if (!is_int($version) || $version < 1) throw new ShopError(422, 'Reload the menu item before saving.');
        $q = $pdo->prepare('UPDATE menu_items SET name=?,category=?,price=?,image=?,non_coffee=?,description=?,is_available=?,is_sold_out=?,is_featured=?,featured_rank=?,version=version+1 WHERE id=? AND version=? AND deleted_at IS NULL');
        $q->execute([...$values, $id, $version]);
        if ($q->rowCount() !== 1) throw new ShopError(409, 'This item changed elsewhere. Reload it before saving.');
    }
    return catalogue_all($pdo)[$id];
}

/** Reordering is atomic and refuses a stale or incomplete selection. */
function catalogue_reorder_featured(PDO $pdo, array $input): array
{
    $items = $input['items'] ?? null;
    if (!is_array($items) || !array_is_list($items) || count($items) > 200) throw new ShopError(422, 'Reload the featured list before reordering.');
    $ids = [];
    foreach ($items as $item) {
        if (!is_array($item) || !is_string($item['id'] ?? null) || !preg_match('/^[a-z0-9-]{1,80}$/D', $item['id']) || !is_int($item['version'] ?? null) || $item['version'] < 1 || isset($ids[$item['id']])) throw new ShopError(422, 'Invalid featured order.');
        $ids[$item['id']] = $item['version'];
    }
    $pdo->beginTransaction();
    try {
        // Lock all non-deleted menu rows, including drinks concurrently being featured.
        $rows = $pdo->query('SELECT id,version,is_featured FROM menu_items WHERE deleted_at IS NULL ORDER BY id FOR UPDATE')->fetchAll();
        $current = [];
        foreach ($rows as $row) if ($row['is_featured']) $current[$row['id']] = (int) $row['version'];
        if (count($current) !== count($ids)) throw new ShopError(409, 'The featured list changed elsewhere. Refresh before reordering.');
        foreach ($ids as $id => $version) if (($current[$id] ?? null) !== $version) throw new ShopError(409, 'The featured list changed elsewhere. Refresh before reordering.');
        $q = $pdo->prepare('UPDATE menu_items SET featured_rank=?,version=version+1 WHERE id=?');
        foreach ($items as $position => $item) $q->execute([$position + 1, $item['id']]);
        $result = array_values(catalogue_all($pdo));
        $pdo->commit();
        return $result;
    } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
}

function catalogue_delete(PDO $pdo, array $in): void
{
    if (!is_string($in['id'] ?? null) || !is_int($in['version'] ?? null)) throw new ShopError(422, 'Invalid menu item.');
    $q = $pdo->prepare('UPDATE menu_items SET deleted_at=UTC_TIMESTAMP(),is_available=0,version=version+1 WHERE id=? AND version=? AND deleted_at IS NULL');
    $q->execute([$in['id'], $in['version']]);
    if ($q->rowCount() !== 1) throw new ShopError(409, 'This item changed elsewhere. Reload the menu before deleting.');
}

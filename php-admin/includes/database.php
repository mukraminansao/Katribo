<?php
declare(strict_types=1);

/** XAMPP defaults; override with server environment variables when deploying. */
function db_settings(): array
{
    $env = fn(string $name, string $default): string => getenv($name) === false ? $default : getenv($name);
    return [
        'host' => $env('KATRIBO_DB_HOST', '127.0.0.1'), 'port' => $env('KATRIBO_DB_PORT', '3306'),
        'name' => $env('KATRIBO_DB_NAME', 'katribo'), 'user' => $env('KATRIBO_DB_USER', 'root'),
        'password' => $env('KATRIBO_DB_PASSWORD', ''),
    ];
}

function db_connect(bool $selectDatabase = true): PDO
{
    $s = db_settings();
    if (!preg_match('/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/D', $s['name']) || !ctype_digit($s['port'])) throw new RuntimeException('Invalid database configuration.');
    $dsn = 'mysql:host=' . $s['host'] . ';port=' . $s['port'] . ';charset=utf8mb4';
    if ($selectDatabase) $dsn .= ';dbname=' . $s['name'];
    $pdo = new PDO($dsn, $s['user'], $s['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_TIMEOUT => 3]);
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}

function db(): PDO
{
    static $pdo;
    return $pdo ??= db_connect();
}

function db_migrate(PDO $pdo, array $seed): void
{
    // DDL is deliberately outside the seed transaction (MySQL implicitly commits DDL).
    $pdo->exec(file_get_contents(__DIR__ . '/../database/schema.sql'));
    $pdo->beginTransaction();
    try {
        $exists = $pdo->query("SELECT version FROM schema_migrations WHERE version = 1 FOR UPDATE")->fetchColumn();
        if (!$exists) {
            $category = $pdo->prepare('INSERT IGNORE INTO menu_categories (name, sort_order) VALUES (?, ?)');
            foreach (['Coffee', 'Milkshake', 'Latte', 'Macchiato', 'Specialty', 'Pastries'] as $i => $name) $category->execute([$name, $i]);
            $insert = $pdo->prepare('INSERT IGNORE INTO menu_items (id, name, category, price, image, non_coffee, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
            foreach ($seed as $p) $insert->execute([$p['id'], $p['name'], $p['category'], $p['price'], strtok($p['image'], '?'), (int) $p['nonCoffee'], $p['description']]);
            $pdo->exec('INSERT INTO schema_migrations (version) VALUES (1)');
        }
        $pdo->commit();
    } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
    // Additive migration: retain all existing orders and leave old payment preferences unknown.
    if (!$pdo->query('SELECT version FROM schema_migrations WHERE version=2')->fetchColumn()) {
        if (!$pdo->query("SHOW COLUMNS FROM orders LIKE 'payment_method'")->fetch()) {
            $pdo->exec('ALTER TABLE orders ADD COLUMN payment_method VARCHAR(16) NULL AFTER fulfilment');
        }
        $pdo->exec('INSERT IGNORE INTO schema_migrations (version) VALUES (2)');
    }
    if (!$pdo->query('SELECT version FROM schema_migrations WHERE version=3')->fetchColumn()) {
        foreach (['is_sold_out' => 'TINYINT(1) NOT NULL DEFAULT 0', 'is_featured' => 'TINYINT(1) NOT NULL DEFAULT 0', 'featured_rank' => 'INT UNSIGNED NOT NULL DEFAULT 0'] as $column => $definition) {
            if (!$pdo->query("SHOW COLUMNS FROM menu_items LIKE '$column'")->fetch()) $pdo->exec("ALTER TABLE menu_items ADD COLUMN $column $definition");
        }
        // Preserve the customer's existing homepage favorites on first upgrade.
        $favorites = ['caramel-macchiato','iced-latte','spanish-latte','chocolate-milkshake','matcha-latte','strawberry-milkshake','ube-milkshake','cookies-cream'];
        $mark = $pdo->prepare('UPDATE menu_items SET is_featured=1,featured_rank=? WHERE id=? AND deleted_at IS NULL');
        foreach ($favorites as $rank => $id) $mark->execute([$rank + 1, $id]);
        $pdo->exec('INSERT IGNORE INTO schema_migrations (version) VALUES (3)');
    }
}

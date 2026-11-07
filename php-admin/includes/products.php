<?php
/**
 * KATRIBO — initial catalogue seed (DESIGN SAMPLE, NOT A VERIFIED MENU)
 *
 * - Drink names follow the supplied design brief / drinks reference sheet.
 * - Prices are only filled in where the all-black UI reference shows one.
 *   Every other price is null and is displayed as "Price unavailable";
 *   those drinks cannot be added to the cart until a real price is set.
 * - Size and add-on prices are the sample values shown in the UI reference.
 * - Images are individual tiles cropped from katribo-drinks-reference.png.
 * - Only Caramel Macchiato has a description, copied from the UI reference.
 *   Do not add ingredients or allergen info until the café confirms them.
 *
 * Imported once by tools/setup-database.php. After setup, manage the live
 * catalogue in Admin; public pages and checkout read the MySQL menu.
 */

// Order follows the UI reference filter bar (Specialty added by the brief)
const CATEGORIES = ['All', 'Coffee', 'Milkshake', 'Latte', 'Macchiato', 'Specialty', 'Non-Coffee'];

const SIZES = [
    ['id' => 'regular', 'label' => 'Regular', 'add' => 0],
    ['id' => 'large',   'label' => 'Large',   'add' => 20],   // from UI reference: "Large +₱20"
];

const ADDONS = [
    ['id' => 'extra-espresso', 'label' => 'Extra Espresso', 'price' => 20],
    ['id' => 'caramel-syrup',  'label' => 'Caramel Syrup',  'price' => 20],
    ['id' => 'whipped-cream',  'label' => 'Whipped Cream',  'price' => 20],
    ['id' => 'oat-milk',       'label' => 'Oat Milk',       'price' => 30],
];

/*  id => [name, category, price|null, image, nonCoffee, description|null]  */
const PRODUCTS_RAW = [
    // Coffee
    'americano'              => ['Americano',              'Coffee',    120,  'americano',              false],
    'espresso'               => ['Espresso',               'Coffee',    null, 'espresso',               false],
    'cold-brew'              => ['Cold Brew',              'Coffee',    null, 'cold-brew',              false],
    'mocha'                  => ['Mocha',                  'Coffee',    150,  'mocha',                  false],
    // Latte
    'iced-latte'             => ['Iced Latte',             'Latte',     150,  'iced-latte',             false],
    'hot-latte'              => ['Hot Latte',              'Latte',     null, 'hot-latte',              false],
    'spanish-latte'          => ['Spanish Latte',          'Latte',     160,  'spanish-latte',          false],
    'caramel-latte'          => ['Caramel Latte',          'Latte',     160,  'caramel-latte',          false],
    'vanilla-latte'          => ['Vanilla Latte',          'Latte',     null, 'vanilla-latte',          false],
    'hazelnut-latte'         => ['Hazelnut Latte',         'Latte',     160,  'hazelnut-latte',         false],
    'matcha-latte'           => ['Matcha Latte',           'Latte',     150,  'matcha-latte',           true],
    // Macchiato
    'caramel-macchiato'      => ['Caramel Macchiato',      'Macchiato', 160,  'caramel-macchiato',      false,
        'A perfect balance of rich espresso, steamed milk, and sweet caramel, topped with a smooth finish.'],
    'brown-sugar-macchiato'  => ['Brown Sugar Macchiato',  'Macchiato', 160,  'brown-sugar-latte',      false],
    'white-chocolate-mocha'  => ['White Chocolate Mocha',  'Macchiato', 160,  'white-chocolate-mocha',  false],
    'dark-mocha-macchiato'   => ['Dark Mocha Macchiato',   'Macchiato', 160,  'dark-mocha',             false],
    // Milkshake
    'chocolate-milkshake'    => ['Chocolate Milkshake',    'Milkshake', 160,  'chocolate-milkshake',    true],
    'vanilla-milkshake'      => ['Vanilla Milkshake',      'Milkshake', 160,  'vanilla-milkshake',      true],
    'strawberry-milkshake'   => ['Strawberry Milkshake',   'Milkshake', 160,  'strawberry-milkshake',   true],
    'matcha-milkshake'       => ['Matcha Milkshake',       'Milkshake', null, 'matcha-milkshake',       true],
    'cookies-cream'          => ['Cookies & Cream',        'Milkshake', 160,  'cookies-cream-milkshake', true],
    'mango-milkshake'        => ['Mango Milkshake',        'Milkshake', null, 'mango-milkshake',        true],
    'ube-milkshake'          => ['Ube Milkshake',          'Milkshake', null, 'ube-milkshake',          true],
    'caramel-milkshake'      => ['Caramel Milkshake',      'Milkshake', null, 'caramel-milkshake',      true],
    // Specialty
    'biscoff-latte'          => ['Biscoff Latte',          'Specialty', null, 'biscoff-latte',          false],
    'hojicha-latte'          => ['Hojicha Latte',          'Specialty', 160,  'hojicha-latte',          true],
    'coffee-jelly'           => ['Coffee Jelly',           'Specialty', null, 'coffee-jelly-milkshake', false],
];

/** Normalised product list, keyed by id. */
function products_seed(): array
{
    static $list = null;
    if ($list !== null) return $list;
    $list = [];
    foreach (PRODUCTS_RAW as $id => $p) {
        $list[$id] = [
            'id'          => $id,
            'name'        => $p[0],
            'category'    => $p[1],
            'price'       => $p[2],
            'image'       => asset('assets/img/drinks/' . $p[3] . '.jpg'),
            'nonCoffee'   => $p[4],
            'description' => $p[5] ?? null,
        ];
    }
    return $list;
}

/** The database is authoritative after setup; fallback keeps browsing available on an outage. */
function products(): array
{
    static $list = null;
    if ($list !== null) return $list;
    require_once __DIR__ . '/catalogue.php';
    try {
        $list = catalogue_all(db(), true);
        $GLOBALS['katribo_catalogue_online'] = true;
    } catch (Throwable $error) {
        $list = products_seed();
        $GLOBALS['katribo_catalogue_online'] = false;
    }
    return $list;
}

function product_categories(): array
{
    return array_values(array_unique([...CATEGORIES, ...array_column(products(), 'category')]));
}

function product(string $id): ?array
{
    return products()[$id] ?? null;
}

/** Pick products by id, preserving order. */
function pick(array $ids): array
{
    return array_values(array_filter(array_map('product', $ids)));
}

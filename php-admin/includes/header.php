<?php
/**
 * Shared <head>, top navbar, mobile drawer, search overlay.
 * Set $page (home|menu|about|gallery|contact|cart|checkout|drink) and $title before including.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/products.php';
require_once __DIR__ . '/components.php';

$page  = $page  ?? 'home';
$title = $title ?? SITE['name'] . ' — ' . SITE['tagline'];
$desc  = $desc  ?? SITE['intro'];

$nav = [
    'home'    => ['Home', 'index.php'],
    'menu'    => ['Menu', 'menu.php'],
    'about'   => ['About', 'about.php'],
    'gallery' => ['Gallery', 'gallery.php'],
    'contact' => ['Contact', 'contact.php'],
];
$activeNav = $page === 'drink' ? 'menu' : $page;

// Current database catalogue for client-side cart + search.
$clientData = [
    'products' => array_values(array_map(fn($p) => [
        'id' => $p['id'], 'name' => $p['name'], 'category' => $p['category'],
        'price' => $p['price'], 'image' => $p['image'], 'soldOut' => $p['soldOut'] ?? false,
    ], products())),
    'sizes'  => SIZES,
    'addons' => ADDONS,
    'catalogueOnline' => $GLOBALS['katribo_catalogue_online'] ?? false,
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title><?= e($title) ?></title>
    <meta name="description" content="<?= e($desc) ?>">
    <meta name="theme-color" content="#080808">
    <link rel="preload" href="assets/fonts/Inter-Black.woff" as="font" type="font/woff" crossorigin>
    <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="assets/css/style.css?v=1">
    <script>window.KATRIBO = <?= json_encode($clientData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;</script>
    <script src="assets/js/app.js?v=3" defer></script>
</head>
<body class="page-<?= e($page) ?>">
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header" id="siteHeader">
    <div class="container header-inner">
        <a class="logo" href="index.php" aria-label="KATRIBO home">KATRIBO</a>

        <nav class="main-nav" aria-label="Primary">
            <ul>
                <?php foreach ($nav as $key => [$label, $href]): ?>
                    <li><a href="<?= $href ?>"<?= $activeNav === $key ? ' class="is-active" aria-current="page"' : '' ?>><?= $label ?></a></li>
                <?php endforeach; ?>
            </ul>
        </nav>

        <div class="header-actions">
            <button type="button" class="icon-btn icon-btn--plain" data-open-search aria-label="Search drinks"><?= icon('search', 20) ?></button>
            <a class="icon-btn icon-btn--plain cart-link" href="cart.php" aria-label="Cart">
                <?= icon('cart', 20) ?><span class="cart-count" data-cart-count hidden>0</span>
            </a>
            <a class="btn btn--primary btn--sm header-cta" href="menu.php">Order Now</a>
            <button type="button" class="icon-btn icon-btn--plain nav-toggle" data-open-drawer aria-label="Open menu" aria-expanded="false" aria-controls="drawer"><?= icon('menu', 24) ?></button>
        </div>
    </div>
</header>

<!-- Mobile drawer -->
<div class="drawer" id="drawer" hidden>
    <div class="drawer-backdrop" data-close-drawer></div>
    <nav class="drawer-panel" aria-label="Mobile">
        <div class="drawer-top">
            <span class="logo">KATRIBO</span>
            <button type="button" class="icon-btn icon-btn--plain" data-close-drawer aria-label="Close menu"><?= icon('close', 24) ?></button>
        </div>
        <ul class="drawer-links">
            <?php foreach ($nav as $key => [$label, $href]): ?>
                <li><a href="<?= $href ?>"<?= $activeNav === $key ? ' class="is-active" aria-current="page"' : '' ?>><?= $label ?></a></li>
            <?php endforeach; ?>
            <li><a href="cart.php"<?= $page === 'cart' ? ' class="is-active"' : '' ?>>Cart</a></li>
        </ul>
        <a class="btn btn--primary btn--block" href="menu.php"><span>Order Now</span><?= icon('arrow', 16) ?></a>
    </nav>
</div>

<!-- Search overlay -->
<div class="search-overlay" id="search" role="dialog" aria-modal="true" aria-label="Search drinks" hidden>
    <div class="search-panel container">
        <div class="search-bar">
            <?= icon('search', 22) ?>
            <input type="search" id="searchInput" placeholder="Search drinks…" autocomplete="off" aria-label="Search drinks">
            <button type="button" class="icon-btn icon-btn--plain" data-close-search aria-label="Close search"><?= icon('close', 22) ?></button>
        </div>
        <ul class="search-results" id="searchResults" aria-live="polite"></ul>
    </div>
</div>

<main id="main">
<?php if (($GLOBALS['katribo_catalogue_online'] ?? false) === false): ?>
<p class="demo-banner container" role="status">The live menu is temporarily unavailable. Displayed items may be out of date; orders cannot be confirmed until the connection returns.</p>
<?php endif; ?>

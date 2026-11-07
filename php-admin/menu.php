<?php
$page  = 'menu';
$title = 'Menu — KATRIBO';
$desc  = 'Handcrafted drinks made for good people: coffee, lattes, macchiatos, milkshakes and specialty drinks.';
require __DIR__ . '/includes/header.php';

$groups = [];
foreach (products() as $p) $groups[$p['category']][] = $p;
$groups['Non-Coffee'] = array_values(array_filter(products(), fn($p) => $p['nonCoffee']));

$requested = $_GET['cat'] ?? 'All';
$active = in_array($requested, product_categories(), true) ? $requested : 'All';
?>

<section class="page-hero">
    <div class="container">
        <h1 class="page-title">Our Menu</h1>
        <p class="page-sub">Handcrafted drinks made for good people.</p>

        <div class="filter-bar" role="tablist" aria-label="Drink categories" data-filter>
            <?php foreach (product_categories() as $c): ?>
                <button type="button" role="tab" class="filter-pill<?= $c === $active ? ' is-active' : '' ?>"
                        aria-selected="<?= $c === $active ? 'true' : 'false' ?>" data-cat="<?= e($c) ?>"><?= e($c) ?></button>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section section--menu">
    <div class="container" data-menu data-active="<?= e($active) ?>">
        <?php foreach (product_categories() as $c): if ($c === 'All' || empty($groups[$c])) continue; ?>
            <section class="menu-group<?= $c === 'Non-Coffee' ? ' menu-group--virtual' : '' ?>" data-group="<?= e($c) ?>" aria-labelledby="g-<?= e(strtolower($c)) ?>">
                <div class="menu-group-head">
                    <h2 class="menu-group-title" id="g-<?= e(strtolower($c)) ?>"><?= e($c) ?></h2>
                    <button type="button" class="pill-link" data-cat="<?= e($c) ?>">View All <?= icon('arrow', 14) ?></button>
                </div>
                <div class="product-grid product-grid--4">
                    <?php foreach ($groups[$c] as $i => $p): ?>
                        <div class="menu-item<?= $i >= 4 ? ' is-extra' : '' ?>"><?= product_card($p, $i >= 4) ?></div>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endforeach; ?>

        <p class="menu-note"><?= icon('info', 16) ?> Sample menu for design purposes. Drinks marked “Price unavailable” can be ordered once the café confirms pricing.</p>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>

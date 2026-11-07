<?php
$page  = 'gallery';
$title = 'Gallery — KATRIBO';
$desc  = 'Moments, coffee, and the view at KATRIBO.';
require __DIR__ . '/includes/header.php';

$filters = ['All', 'Drinks', 'Interior', 'Coffee Equipment', 'Backyard View'];

// [src, alt, categories, caption, shape]  shape: tall | wide | square
$S = 'assets/img/shop/';
$D = 'assets/img/drinks/';
$gallery = [
    [$D . 'caramel-macchiato.jpg', 'Iced caramel macchiato in a KATRIBO cup', ['Drinks'], 'Caramel Macchiato', 'square'],
    [$S . 'katribo-interior-02.jpg', "KATRIBO 'Welcome to our backyard' wall sign", ['Interior'], 'Welcome to our backyard', 'tall'],
    [$S . 'katribo-interior-01.jpg', 'Espresso bar facing the windows and the bay', ['Interior', 'Backyard View', 'Coffee Equipment'], 'The bar, by the bay', 'tall'],
    [$S . 'katribo-espresso-bar.jpg', 'Dual-group espresso machine and grinder', ['Coffee Equipment'], 'Espresso machine & grinder', 'wide'],
    [$D . 'matcha-latte.jpg', 'Iced matcha latte', ['Drinks'], 'Matcha Latte', 'square'],
    [$S . 'katribo-bay-view.jpg', 'Outdoor tables and the bay seen through the front windows', ['Backyard View'], 'Our backyard view', 'wide'],
    [$S . 'katribo-staff.jpg', 'The KATRIBO team behind the bar', ['Interior'], 'The KATRIBO team', 'tall'],
    [$D . 'strawberry-milkshake.jpg', 'Strawberry milkshake with whipped cream', ['Drinks'], 'Strawberry Milkshake', 'square'],
    [$D . 'spanish-latte.jpg', 'Iced Spanish latte', ['Drinks'], 'Spanish Latte', 'square'],
    [$D . 'latte-art.jpg', 'Hot latte with leaf latte art', ['Drinks'], 'Latte art', 'square'],
    [$D . 'ube-milkshake.jpg', 'Ube milkshake', ['Drinks'], 'Ube Milkshake', 'square'],
    [$D . 'chocolate-milkshake.jpg', 'Chocolate milkshake with chocolate drizzle', ['Drinks'], 'Chocolate Milkshake', 'square'],
    [$D . 'americano.jpg', 'Hot americano in a glass mug', ['Drinks'], 'Americano', 'square'],
];
?>

<section class="page-hero">
    <div class="container">
        <h1 class="page-title page-title--case">Our Gallery</h1>
        <p class="page-sub">Moments, coffee, and the view.</p>
        <div class="filter-bar" role="tablist" aria-label="Gallery categories" data-gallery-filter>
            <?php foreach ($filters as $i => $f): ?>
                <button type="button" role="tab" class="filter-pill<?= $i === 0 ? ' is-active' : '' ?>" aria-selected="<?= $i === 0 ? 'true' : 'false' ?>" data-cat="<?= e($f) ?>"><?= e($f) ?></button>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section section--flush">
    <div class="container">
        <ul class="masonry" data-gallery>
            <?php foreach ($gallery as $i => [$src, $alt, $cats, $cap, $shape]): ?>
                <li class="masonry-item masonry-item--<?= $shape ?>" data-cats="<?= e(implode('|', $cats)) ?>">
                    <button type="button" class="masonry-btn" data-lightbox="<?= $i ?>" aria-label="Open image: <?= e($cap) ?>">
                        <img src="<?= e(asset($src)) ?>" alt="<?= e($alt) ?>" loading="<?= $i < 4 ? 'eager' : 'lazy' ?>">
                        <span class="masonry-cap"><span><?= e($cap) ?></span><em><?= e($cats[0]) ?></em></span>
                    </button>
                </li>
            <?php endforeach; ?>
        </ul>
        <p class="menu-note"><?= icon('info', 16) ?> Café photos are KATRIBO's own. Drink images are from the KATRIBO drinks reference sheet.</p>
    </div>
</section>

<!-- Lightbox -->
<div class="lightbox" data-lb hidden role="dialog" aria-modal="true" aria-label="Image viewer">
    <button type="button" class="lb-close icon-btn" data-lb-close aria-label="Close viewer"><?= icon('close', 20) ?></button>
    <button type="button" class="lb-nav lb-prev icon-btn" data-lb-prev aria-label="Previous image"><?= icon('arrow-left', 20) ?></button>
    <figure class="lb-figure">
        <img data-lb-img alt="">
        <figcaption><span data-lb-cap></span><em data-lb-count></em></figcaption>
    </figure>
    <button type="button" class="lb-nav lb-next icon-btn" data-lb-next aria-label="Next image"><?= icon('arrow', 20) ?></button>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>

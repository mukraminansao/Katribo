<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/products.php';

$p = product((string) ($_GET['id'] ?? ''));
if (!$p) {
    http_response_code(404);
}

$page  = 'drink';
$title = $p ? $p['name'] . ' — KATRIBO' : 'Drink not found — KATRIBO';
$desc  = $p['description'] ?? SITE['intro'];
require __DIR__ . '/includes/header.php';

if (!$p): ?>
    <section class="page-hero empty-state">
        <div class="container">
            <h1 class="page-title">Drink not found</h1>
            <p class="page-sub">We couldn't find that drink. It may have been removed from the menu.</p>
            <div class="btn-row"><?= button('Back to Menu', 'menu.php', 'primary', true, 'btn--lg') ?></div>
        </div>
    </section>
<?php require __DIR__ . '/includes/footer.php'; exit; endif;

$orderable = $p['price'] !== null && !($p['soldOut'] ?? false);

// Recommendations: same category first, then others with a price
$related = array_filter(products(), fn($x) => $x['id'] !== $p['id'] && $x['category'] === $p['category']);
$others  = array_filter(products(), fn($x) => $x['id'] !== $p['id'] && $x['category'] !== $p['category'] && $x['price'] !== null);
$related = array_slice(array_values($related + $others), 0, 4);
?>

<section class="detail">
    <div class="container">
        <a class="back-link" href="menu.php"><?= icon('arrow-left', 16) ?> Back to Menu</a>

        <div class="detail-grid">
            <figure class="detail-media">
                <img src="<?= e($p['image']) ?>" alt="<?= e($p['name']) ?> in a KATRIBO cup" width="1200" height="1500" fetchpriority="high">
            </figure>

            <form class="detail-body" data-detail="<?= e($p['id']) ?>" novalidate>
                <h1 class="detail-title"><?= e($p['name']) ?></h1>
                <p class="detail-price<?= $orderable ? '' : ' is-unavailable' ?>" data-unit-price><?= e(peso($p['price'])) ?></p>

                <?php if ($p['description']): ?>
                    <p class="detail-desc"><?= e($p['description']) ?></p>
                <?php endif; ?>

                <?php if (!$orderable): ?>
                    <p class="notice"><?= icon('info', 16) ?> <?= ($p['soldOut'] ?? false) ? 'This drink is currently sold out. Please choose another favorite.' : "This drink can't be ordered online yet — pricing is still being confirmed by the café." ?></p>
                <?php endif; ?>

                <?php if ($p['category'] !== 'Pastries'): ?>
                <fieldset class="opt-group"<?= $orderable ? '' : ' disabled' ?>>
                    <legend class="opt-label">Size</legend>
                    <div class="chip-group">
                        <?php foreach (SIZES as $i => $s): ?>
                            <label class="chip">
                                <input type="radio" name="size" value="<?= e($s['id']) ?>"<?= $i === 0 ? ' checked' : '' ?>>
                                <span><?= e($s['label']) ?><?= $s['add'] ? ' <em>+₱' . $s['add'] . '</em>' : '' ?></span>
                            </label>
                        <?php endforeach; ?>
                    </div>
                </fieldset>

                <fieldset class="opt-group"<?= $orderable ? '' : ' disabled' ?>>
                    <legend class="opt-label">Add-ons</legend>
                    <ul class="addon-list">
                        <?php foreach (ADDONS as $a): ?>
                            <li>
                                <label class="check">
                                    <input type="checkbox" name="addons" value="<?= e($a['id']) ?>">
                                    <span class="check-box" aria-hidden="true"><?= icon('check', 14) ?></span>
                                    <span class="check-label"><?= e($a['label']) ?></span>
                                    <span class="check-price">+₱<?= (int) $a['price'] ?></span>
                                </label>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </fieldset>

                <?php endif; ?>
                <div class="detail-actions">
                    <div class="stepper" role="group" aria-label="Quantity">
                        <button type="button" class="stepper-btn" data-step="-1" aria-label="Decrease quantity"<?= $orderable ? '' : ' disabled' ?>><?= icon('minus', 16) ?></button>
                        <output class="stepper-val" data-qty aria-live="polite">1</output>
                        <button type="button" class="stepper-btn" data-step="1" aria-label="Increase quantity"<?= $orderable ? '' : ' disabled' ?>><?= icon('plus', 16) ?></button>
                    </div>
                    <button type="submit" class="btn btn--primary btn--lg detail-add"<?= $orderable ? '' : ' disabled' ?>>
                        <span>Add to Cart</span><span class="btn-price" data-total><?= e(peso($p['price'])) ?></span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</section>

<section class="section section--related" aria-labelledby="relTitle">
    <div class="container">
        <?= str_replace('<h2 class="section-title">', '<h2 class="section-title" id="relTitle">', section_head('You might also like')) ?>
        <div class="product-grid product-grid--4">
            <?php foreach ($related as $r): ?><div><?= product_card($r) ?></div><?php endforeach; ?>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>

<?php
$page  = 'cart';
$title = 'Your Cart — KATRIBO';
require __DIR__ . '/includes/header.php';
$browse = pick(['iced-latte', 'mocha', 'chocolate-milkshake', 'spanish-latte']);
?>

<section class="page-hero page-hero--compact">
    <div class="container">
        <h1 class="page-title page-title--md">Your Cart</h1>
    </div>
</section>

<section class="section section--flush">
    <div class="container cart-layout" data-cart-page>
        <!-- Filled by app.js from the saved cart -->
        <div class="cart-main">
            <ul class="cart-list" data-cart-list aria-live="polite"></ul>

            <div class="cart-empty" data-cart-empty hidden>
                <span class="cart-empty-icon"><?= icon('cart', 32) ?></span>
                <h2>Your cart is empty</h2>
                <p class="muted">Pick something good from the menu.</p>
                <?= button('Browse Menu', 'menu.php', 'primary', true, 'btn--lg') ?>
            </div>

            <div class="field cart-note" data-cart-note-wrap>
                <label for="cartNote" class="sr-only">Special instructions (optional)</label>
                <textarea id="cartNote" class="input" rows="2" maxlength="300" placeholder="Add a note (optional)" data-cart-note></textarea>
            </div>
        </div>

        <aside class="summary summary--plain" data-cart-summary aria-label="Order summary">
            <dl class="summary-rows">
                <div><dt>Subtotal</dt><dd data-subtotal>₱0</dd></div>
                <div><dt>Delivery Fee</dt><dd>₱0</dd></div>
                <div class="summary-total"><dt>Total</dt><dd data-total>₱0</dd></div>
            </dl>
            <a class="btn btn--primary btn--lg btn--block" href="checkout.php" data-checkout-btn><span>Proceed to Checkout</span><?= icon('arrow', 16) ?></a>
            <a class="link-arrow summary-continue" href="menu.php">Continue browsing <?= icon('arrow', 14) ?></a>
        </aside>
    </div>
</section>

<section class="section section--related" aria-labelledby="browseTitle">
    <div class="container">
        <?= str_replace('<h2 class="section-title">', '<h2 class="section-title" id="browseTitle">', section_head('Continue Browsing')) ?>
        <div class="product-grid product-grid--4">
            <?php foreach ($browse as $p): ?><div><?= product_card($p) ?></div><?php endforeach; ?>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>

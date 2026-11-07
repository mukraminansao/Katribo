<?php
$page  = 'checkout';
$title = 'Checkout — KATRIBO';
require __DIR__ . '/includes/header.php';
?>

<section class="page-hero page-hero--compact">
    <div class="container">
        <a class="back-link" href="cart.php"><?= icon('arrow-left', 16) ?> Back to Cart</a>
        <h1 class="page-title page-title--md">Checkout</h1>
        <p class="demo-banner"><?= icon('info', 16) ?> Pickup orders are sent to the Katribo team. Pay at pickup; no online payment is taken.</p>
    </div>
</section>

<section class="section section--flush">
    <div class="container">
        <form class="checkout-layout" data-checkout novalidate>
            <div class="checkout-main">
                <!-- 1. Pickup / Delivery -->
                <fieldset class="step">
                    <legend class="step-title"><span class="step-num">1</span> Delivery / Pickup</legend>
                    <div class="choice-grid">
                        <label class="choice">
                            <input type="radio" name="fulfilment" value="pickup" checked>
                            <span class="choice-body"><span class="radio-dot" aria-hidden="true"></span>Pickup <em>(In-store)</em></span>
                        </label>
                        <label class="choice is-disabled">
                            <input type="radio" name="fulfilment" value="delivery" disabled>
                            <span class="choice-body"><span class="radio-dot" aria-hidden="true"></span>Delivery <em>(Coming Soon)</em></span>
                        </label>
                    </div>
                </fieldset>

                <!-- 2. Customer information -->
                <fieldset class="step">
                    <legend class="step-title"><span class="step-num">2</span> Customer Information</legend>
                    <div class="field">
                        <label class="field-label" for="coName">Full Name</label>
                        <input class="input" id="coName" name="name" type="text" autocomplete="name" required minlength="2" maxlength="80" placeholder="Enter your name" aria-describedby="coNameErr">
                        <p class="field-error" id="coNameErr" hidden></p>
                    </div>
                    <div class="field">
                        <label class="field-label" for="coPhone">Phone Number</label>
                        <input class="input" id="coPhone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required placeholder="Enter your phone number" aria-describedby="coPhoneErr">
                        <p class="field-error" id="coPhoneErr" hidden></p>
                    </div>
                    <div class="field">
                        <label class="field-label" for="coEmail">Email (Optional)</label>
                        <input class="input" id="coEmail" name="email" type="email" autocomplete="email" placeholder="Enter your email" aria-describedby="coEmailErr">
                        <p class="field-error" id="coEmailErr" hidden></p>
                    </div>
                </fieldset>
            </div>

            <!-- 3–5. Summary, total, place order -->
            <aside class="summary">
                <h2 class="step-title"><span class="step-num">3</span> Order Summary</h2>
                <ul class="mini-list" data-co-list></ul>
                <p class="mini-note" data-co-note hidden></p>
                <dl class="summary-rows">
                    <div><dt>Subtotal</dt><dd data-subtotal>₱0</dd></div>
                    <div><dt>Delivery Fee</dt><dd>₱0</dd></div>
                    <div class="summary-total"><dt>Total</dt><dd data-total>₱0</dd></div>
                </dl>
                <p class="form-error" data-co-error role="alert" hidden></p>
                <button type="submit" class="btn btn--primary btn--lg btn--block" data-place-order><span>Place Order</span><?= icon('arrow', 16) ?></button>
            </aside>
        </form>

        <!-- Confirmation (shown only after a successful submission) -->
        <div class="confirm" data-confirm hidden tabindex="-1">
            <span class="confirm-icon"><?= icon('check', 32) ?></span>
            <p class="eyebrow">Pickup order</p>
            <h2 class="display-2">Order received</h2>
            <p class="lead">Thanks, <span data-confirm-name></span>. Your reference is <strong data-confirm-ref></strong>.</p>
            <p class="muted">Total: <strong data-confirm-total></strong> · Pickup in-store. Your order is pending review by the Katribo team. Please keep your reference and pay at pickup.</p>
            <div class="btn-row"><?= button('Back to Home', 'index.php', 'primary', true, 'btn--lg') ?><?= button('Order More', 'menu.php', 'outline', false, 'btn--lg') ?></div>
        </div>

        <div class="cart-empty" data-co-empty hidden>
            <span class="cart-empty-icon"><?= icon('cart', 32) ?></span>
            <h2>Your cart is empty</h2>
            <p class="muted">Add a drink before checking out.</p>
            <?= button('Browse Menu', 'menu.php', 'primary', true, 'btn--lg') ?>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>

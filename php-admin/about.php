<?php
$page  = 'about';
$title = 'About — KATRIBO';
$desc  = 'KATRIBO is a backyard for good coffee, good conversations, and good people.';
require __DIR__ . '/includes/header.php';
?>

<!-- Intro (matches "About KATRIBO" reference frame) -->
<section class="about-hero">
    <div class="about-hero-bg" aria-hidden="true">
        <img src="<?= asset('assets/img/shop/katribo-interior-02.jpg') ?>" alt="" width="1536" height="2048" fetchpriority="high">
    </div>
    <div class="container">
        <div class="about-hero-copy">
            <h1 class="page-title page-title--case">About KATRIBO</h1>
            <p class="lead">KATRIBO is more than just a coffee shop. It's a backyard for good coffee, good conversations, and good people. Inspired by the view, the community, and the simple moments that make life better.</p>
        </div>
        <ul class="values-strip">
            <li><?= icon('leaf', 30) ?><strong>Quality Beans</strong><span>Carefully selected</span></li>
            <li><?= icon('heart', 30) ?><strong>Crafted with Care</strong><span>Made by passionate baristas</span></li>
            <li><?= icon('users', 30) ?><strong>A Cozy Space</strong><span>For everyone</span></li>
            <li><?= icon('wave', 30) ?><strong>Good Vibes</strong><span>By the Bay</span></li>
        </ul>
    </div>
</section>

<!-- The view -->
<section class="section section--tight">
    <div class="container">
        <figure class="wide-photo reveal">
            <img src="<?= asset('assets/img/shop/katribo-bay-view.jpg') ?>" alt="View of the bay and outdoor tables through KATRIBO's front windows" loading="lazy" width="1536" height="460">
            <figcaption>The view from inside — our backyard by the bay.</figcaption>
        </figure>
    </div>
</section>

<!-- Philosophy -->
<section class="section" aria-labelledby="philoTitle">
    <div class="container">
        <div class="section-head reveal"><div>
            <p class="eyebrow">What we care about</p>
            <h2 class="display-2" id="philoTitle" style="margin-top:16px">Good Coffee,<br>Better People</h2>
        </div></div>

        <div class="pillars">
            <article class="pillar reveal">
                <figure><img src="<?= asset('assets/img/shop/katribo-espresso-bar.jpg') ?>" alt="KATRIBO's espresso machine and grinder at the coffee bar" loading="lazy"></figure>
                <div class="pillar-body">
                    <span class="pillar-num">01</span>
                    <h3>Quality Coffee</h3>
                    <p class="muted">Carefully selected beans, prepared at the bar by baristas who care about every cup.</p>
                </div>
            </article>
            <article class="pillar reveal" style="--d: 80ms">
                <figure><img src="<?= asset('assets/img/shop/katribo-staff.jpg') ?>" alt="The KATRIBO team behind the coffee bar" loading="lazy" style="object-position: 50% 60%"></figure>
                <div class="pillar-body">
                    <span class="pillar-num">02</span>
                    <h3>Friendly Atmosphere</h3>
                    <p class="muted">Good conversations and good people — a place where everyone is welcome.</p>
                </div>
            </article>
            <article class="pillar reveal" style="--d: 160ms">
                <figure><img src="<?= asset('assets/img/shop/katribo-interior-01.jpg') ?>" alt="KATRIBO's dining area with windows facing the bay" loading="lazy" style="object-position: 50% 48%"></figure>
                <div class="pillar-body">
                    <span class="pillar-num">03</span>
                    <h3>The Backyard Experience</h3>
                    <p class="muted">A cozy space by the bay to slow down and enjoy the simple moments.</p>
                </div>
            </article>
        </div>
    </div>
</section>

<!-- Tagline -->
<section class="section quote-section">
    <div class="container">
        <blockquote class="big-quote reveal">
            <p>“Welcome to Our Backyard.”</p>
            <footer>— KATRIBO</footer>
        </blockquote>
        <div class="btn-row center reveal">
            <?= button('See the Menu', 'menu.php', 'primary', true, 'btn--lg') ?>
            <?= button('Visit Us', 'contact.php', 'outline', false, 'btn--lg') ?>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>

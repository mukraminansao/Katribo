</main>

<footer class="site-footer">
    <div class="container footer-grid">
        <div class="footer-brand">
            <a class="logo logo--lg" href="index.php">KATRIBO</a>
            <p class="footer-tagline">Welcome to Our Backyard.</p>
            <p class="muted">Good coffee, better people.</p>
        </div>

        <nav class="footer-col" aria-label="Footer">
            <h3 class="footer-h">Explore</h3>
            <ul>
                <li><a href="index.php">Home</a></li>
                <li><a href="menu.php">Menu</a></li>
                <li><a href="about.php">About</a></li>
                <li><a href="gallery.php">Gallery</a></li>
                <li><a href="contact.php">Contact</a></li>
            </ul>
        </nav>

        <div class="footer-col">
            <h3 class="footer-h">Visit</h3>
            <ul class="footer-info">
                <li><?= icon('pin', 16) ?><span><?= placeholder(SITE['address'], 'Address — to be confirmed') ?></span></li>
                <li><?= icon('clock', 16) ?><span><?= placeholder(SITE['hours'], 'Opening hours — to be confirmed') ?></span></li>
                <li><?= icon('mail', 16) ?><span><?= placeholder(SITE['email'], 'Email — to be confirmed') ?></span></li>
            </ul>
        </div>

        <div class="footer-col">
            <h3 class="footer-h">Follow</h3>
            <ul class="social">
                <?php foreach (SITE['social'] as $net => $url): ?>
                    <li>
                        <?php if ($url): ?>
                            <a class="icon-btn" href="<?= e($url) ?>" target="_blank" rel="noopener" aria-label="KATRIBO on <?= ucfirst($net) ?>"><?= icon($net, 18) ?></a>
                        <?php else: ?>
                            <span class="icon-btn is-placeholder" title="<?= ucfirst($net) ?> link — to be confirmed" aria-label="<?= ucfirst($net) ?> link not set yet"><?= icon($net, 18) ?></span>
                        <?php endif; ?>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </div>
    <div class="container footer-bottom">
        <p>© <?= date('Y') ?> KATRIBO. All rights reserved.</p>
        <p class="muted">Prices and availability may change. Orders are for in-store pickup.</p>
    </div>
</footer>

<!-- Mobile tab bar (matches mobile reference) -->
<nav class="tabbar" aria-label="Quick navigation">
    <a href="index.php"<?= $page === 'home' ? ' class="is-active" aria-current="page"' : '' ?>><?= icon('home', 22) ?><span>Home</span></a>
    <a href="menu.php"<?= in_array($page, ['menu', 'drink']) ? ' class="is-active" aria-current="page"' : '' ?>><?= icon('menu-book', 22) ?><span>Menu</span></a>
    <a href="cart.php"<?= in_array($page, ['cart', 'checkout']) ? ' class="is-active" aria-current="page"' : '' ?>><span class="tab-icon"><?= icon('cart', 22) ?><span class="cart-count" data-cart-count hidden>0</span></span><span>Order</span></a>
    <a href="gallery.php"<?= $page === 'gallery' ? ' class="is-active" aria-current="page"' : '' ?>><?= icon('image', 22) ?><span>Gallery</span></a>
    <button type="button" data-open-drawer<?= in_array($page, ['about', 'contact']) ? ' class="is-active"' : '' ?>><?= icon('more', 22) ?><span>More</span></button>
</nav>

<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
</body>
</html>

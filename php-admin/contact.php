<?php
$page  = 'contact';
$title = 'Contact — KATRIBO';
$desc  = 'Get in touch with KATRIBO.';
require __DIR__ . '/includes/header.php';
$hasEmail = SITE['email'] !== null && SITE['email'] !== '';
?>

<section class="contact-top">
    <div class="container contact-grid">
        <div class="contact-info">
            <h1 class="page-title page-title--case">Contact Us</h1>
            <p class="page-sub">We'd love to hear from you.</p>
            <ul class="info-list">
                <li>
                    <span class="info-icon"><?= icon('pin', 20) ?></span>
                    <div><h2>Visit Us</h2><p><?= placeholder(SITE['address'], 'Street address — to be confirmed') ?></p></div>
                </li>
                <li>
                    <span class="info-icon"><?= icon('mail', 20) ?></span>
                    <div><h2>Message Us</h2><p><?= $hasEmail ? '<a href="mailto:' . e(SITE['email']) . '">' . e(SITE['email']) . '</a>' : placeholder(null, 'Email — to be confirmed') ?></p></div>
                </li>
                <?php if (SITE['phone']): ?>
                <li>
                    <span class="info-icon"><?= icon('phone', 20) ?></span>
                    <div><h2>Call Us</h2><p><?= e(SITE['phone']) ?></p></div>
                </li>
                <?php endif; ?>
                <?php if (SITE['hours']): ?>
                <li>
                    <span class="info-icon"><?= icon('clock', 20) ?></span>
                    <div><h2>Opening Hours</h2><p><?= e(SITE['hours']) ?></p></div>
                </li>
                <?php endif; ?>
                <li>
                    <span class="info-icon"><?= icon('users', 20) ?></span>
                    <div>
                        <h2>Follow Us</h2>
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
                </li>
            </ul>
        </div>

        <form class="contact-form" data-contact novalidate data-email="<?= e(SITE['email'] ?? '') ?>">
            <div class="field">
                <label class="sr-only" for="cName">Your Name (required)</label>
                <input class="input" id="cName" name="name" type="text" autocomplete="name" required minlength="2" maxlength="80" placeholder="Your Name" aria-describedby="cNameErr">
                <p class="field-error" id="cNameErr" hidden></p>
            </div>
            <div class="field">
                <label class="sr-only" for="cEmail">Your Email (required)</label>
                <input class="input" id="cEmail" name="email" type="email" autocomplete="email" required placeholder="Your Email" aria-describedby="cEmailErr">
                <p class="field-error" id="cEmailErr" hidden></p>
            </div>
            <div class="field">
                <label class="sr-only" for="cMsg">Message (required)</label>
                <textarea class="input" id="cMsg" name="message" rows="6" required minlength="10" maxlength="1000" placeholder="Message" aria-describedby="cMsgErr"></textarea>
                <p class="field-error" id="cMsgErr" hidden></p>
            </div>
            <button type="submit" class="btn btn--primary btn--lg btn--block"><span>Send Message</span><?= icon('arrow', 16) ?></button>
            <p class="form-status" data-contact-status role="status" hidden></p>
        </form>

        <figure class="contact-photo">
            <img src="<?= asset('assets/img/shop/katribo-interior-01.jpg') ?>" alt="KATRIBO's coffee bar and dining area overlooking the bay" loading="lazy" style="object-position: 50% 50%">
        </figure>
    </div>
</section>

<section class="section" aria-labelledby="locTitle">
    <div class="container">
        <?= str_replace('<h2 class="section-title">', '<h2 class="section-title" id="locTitle">', section_head('Location', 'Find our backyard by the bay.')) ?>
        <?php if (SITE['map_embed']): ?>
            <div class="map-frame"><iframe src="<?= e(SITE['map_embed']) ?>" title="Map showing KATRIBO's location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
        <?php else: ?>
            <div class="map-frame map-frame--placeholder">
                <img src="<?= asset('assets/img/shop/katribo-bay-view.jpg') ?>" alt="The bay as seen from KATRIBO" loading="lazy">
                <div class="map-overlay">
                    <span class="info-icon"><?= icon('pin', 22) ?></span>
                    <p><strong>Map coming soon</strong></p>
                    <p class="muted">Add the café's Google Maps embed link in <code>includes/config.php</code>.</p>
                </div>
            </div>
        <?php endif; ?>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>

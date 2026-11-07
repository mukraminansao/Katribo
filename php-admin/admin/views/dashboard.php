<?php
if (!isset($admin, $catalogue) || !defined('KATRIBO_ADMIN_VIEW')) { http_response_code(404); exit; }
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#080808">
    <meta name="robots" content="noindex, nofollow">
    <meta name="admin-csrf" content="<?= e(admin_csrf_token()) ?>">
    <meta name="admin-id" content="<?= e($admin['id'] ?? 'template') ?>">
    <meta name="admin-role" content="<?= e($admin['role'] ?? 'owner') ?>">
    <title>Dashboard · KATRIBO Admin</title>
    <link rel="icon" href="assets/katribo-profile.png" type="image/png">
    <link rel="stylesheet" href="assets/admin.css?v=12">
    <script id="admin-catalogue" type="application/json"><?= json_encode($catalogue, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE) ?></script>
    <script src="assets/order-alerts.js?v=2" defer></script>
    <script src="assets/admin.js?v=16" defer></script>
    <script src="assets/session-guard.js?v=1" defer></script>
</head>
<body>
    <a class="skip-link" href="#main">Skip to content</a>
    <button class="sidebar-backdrop" aria-label="Close navigation" hidden></button>
    <aside class="sidebar" id="sidebar" aria-label="Admin navigation"></aside>
    <div class="workspace">
        <header class="topbar">
            <button class="icon-button mobile-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar" data-toggle-sidebar></button>
            <form class="global-search" role="search">
                <span data-search-icon></span>
                <input type="search" name="q" id="global-search" placeholder="Search orders, menu items, customers…" aria-label="Search orders, menu items, or customers" autocomplete="off">
                <kbd>/</kbd>
                <div class="search-results" id="search-results" hidden></div>
            </form>
            <div class="topbar-right">
                <span class="preview-badge" data-connection-badge><i></i> Connecting…</span>
                <button class="icon-button notification-button" aria-label="View order notifications" data-notifications></button>
                <button type="button" class="alert-sound-toggle" data-order-sound aria-pressed="false">Sound off</button>
                <details class="profile">
                    <summary><img src="assets/katribo-profile.png" alt="Katribo administrator profile" width="44" height="44"><span><?= e($admin['name']) ?><small><?= e(ucfirst($admin['role'] ?? 'owner')) ?></small></span><span class="profile-chevron">⌄</span></summary>
                    <div class="profile-menu"><p><?= e($admin['name']) ?><small><?= e($admin['email']) ?></small></p><a href="../index.php" target="_blank" rel="noopener">View coffee shop ↗</a><button type="button" data-about-preview>About this workspace</button><button type="button" data-refresh-data>Refresh orders & menu</button><form action="logout.php" method="post" class="signout-form"><input type="hidden" name="csrf" value="<?= e(admin_csrf_token()) ?>"><button type="submit">Sign out</button></form></div>
                </details>
            </div>
        </header>
        <div class="sync-error" role="status" hidden></div>
        <aside class="new-order-alert" id="new-order-alert" role="status" aria-live="polite" hidden><div><strong data-new-order-title>New pickup order</strong><p data-new-order-copy></p></div><a href="#orders?status=Pending">View pending orders →</a><button type="button" data-dismiss-order-alert aria-label="Dismiss new-order alert">×</button></aside>
        <main id="main" tabindex="-1"><noscript><p class="page-note" style="margin-top:24px">Enable JavaScript to use the Katribo admin workspace.</p></noscript></main>
        <footer class="admin-footer"><span>© <?= date('Y') ?> KATRIBO Coffee Bar</span><span>Made for good coffee & better people.</span></footer>
    </div>
    <dialog id="admin-dialog" aria-labelledby="dialog-title"></dialog>
    <div id="toast" class="toast" role="status" hidden></div>
</body>
</html>

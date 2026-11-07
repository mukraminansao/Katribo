<?php
if (!isset($setup, $errors, $email) || session_status() !== PHP_SESSION_ACTIVE) { http_response_code(404); exit; }
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#100e0c">
    <title><?= $setup ? 'Create administrator' : 'Admin sign in' ?> · KATRIBO</title>
    <link rel="icon" href="assets/katribo-profile.png" type="image/png">
    <link rel="stylesheet" href="assets/admin.css?v=3">
    <link rel="stylesheet" href="assets/auth.css?v=3">
    <script src="assets/auth.js?v=1" defer></script>
</head>
<body class="auth-page">
    <a class="skip-link" href="#auth-title">Skip to sign in</a>
    <main class="auth-layout" id="main">
        <header class="auth-header">
            <a class="auth-brand" href="../index.php" aria-label="Katribo Coffee Bar home"><img src="assets/katribo-logo.webp" alt="Katribo" width="1108" height="400"></a>
            <span class="auth-workspace"><span aria-hidden="true"></span> THE COFFEE BAR WORKSPACE</span>
            <a class="auth-shop-link" href="../index.php">Visit the coffee shop <span aria-hidden="true">↗</span></a>
        </header>
        <div class="auth-content">
        <section class="auth-story" aria-label="Katribo Coffee Bar">
            <div class="auth-story-copy"><p class="eyebrow">GOOD COFFEE. BETTER PEOPLE.</p><h1>A little care.<br><em>In every cup.</em></h1><p>Your coffee bar, thoughtfully managed.<br>A fresh start to another good day.</p></div>
        </section>
        <section class="auth-panel" aria-labelledby="auth-title">
            <div class="auth-card">
                <div class="auth-card-heading"><span class="auth-coffee-icon" aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9Z"/><path d="M17 10h1a3 3 0 0 1 0 6h-1M8 3v2m4-3v3m4-2v2M3 22h17"/></svg></span><p class="eyebrow"><?= $setup ? 'YOUR NEXT CHAPTER' : 'A FRESH START' ?></p></div>
                <h2 id="auth-title" tabindex="-1"><?= $setup ? 'Make it yours.' : 'Welcome back.' ?></h2>
                <p class="auth-intro"><?= $setup ? 'Create your administrator account and make yourself at home.' : 'Good to have you here. Let’s get your day brewing.' ?></p>
                <?php if ($errors): ?><div class="auth-alert error" role="alert"><ul><?php foreach ($errors as $message): ?><li><?= e($message) ?></li><?php endforeach; ?></ul></div><?php endif; ?>
                <?php if (!$setup && isset($_GET['created'])): ?><p class="auth-alert success" role="status">Your administrator account is ready. Sign in below.</p><?php endif; ?>
                <?php if (!$setup && isset($_GET['signedout'])): ?><p class="auth-alert success" role="status">You have been signed out.</p><?php endif; ?>
                <?php if (!$setup && isset($_GET['expired'])): ?><p class="auth-alert" role="status">Your session ended. Sign in to continue.</p><?php endif; ?>
                <form method="post" action="<?= $setup ? 'setup.php' : 'login.php' ?>" class="auth-form">
                    <input type="hidden" name="csrf" value="<?= e(admin_csrf_token()) ?>">
                    <?php if ($setup): ?><label class="field" for="admin-name">Your name<input id="admin-name" name="name" autocomplete="name" value="<?= e($name) ?>" required minlength="2" maxlength="80" autofocus></label><?php endif; ?>
                    <label class="field" for="admin-email">Email address<input id="admin-email" type="email" name="email" autocomplete="username" value="<?= e($email) ?>" required maxlength="254" <?= !$setup ? 'autofocus' : '' ?> placeholder="you@example.com"></label>
                    <label class="field" for="admin-password">Password<input id="admin-password" type="password" name="password" autocomplete="<?= $setup ? 'new-password' : 'current-password' ?>" required <?= $setup ? 'minlength="12"' : '' ?> aria-describedby="<?= $setup ? 'password-help' : 'auth-access-note' ?>" placeholder="<?= $setup ? 'Create a memorable passphrase' : 'Enter your password' ?>"></label>
                    <?php if ($setup): ?><p class="auth-help" id="password-help">Use a memorable passphrase with at least 12 characters (maximum 72 bytes).</p><label class="field" for="admin-confirm">Confirm password<input id="admin-confirm" type="password" name="confirm" autocomplete="new-password" required minlength="12"></label><?php endif; ?>
                    <label class="checkbox-field auth-show"><input type="checkbox" data-show-password> Show password<?= $setup ? 's' : '' ?></label>
                    <button class="button primary auth-submit" type="submit"><?= $setup ? 'Create administrator account' : 'Sign in to workspace' ?><span aria-hidden="true">→</span></button>
                </form>
                <p class="auth-access-note" id="auth-access-note"><svg aria-hidden="true" width="15" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></svg><span><?= $setup ? 'One-time administrator setup. This page closes after your account is created.' : 'A private space for the Katribo team.<br>Authorized team access only.' ?></span></p>
            </div>
        </section>
        </div>
        <footer class="auth-footer"><p class="auth-story-foot">Welcome to our backyard.</p><p class="auth-copyright">© <?= date('Y') ?> KATRIBO Coffee Bar <span aria-hidden="true">·</span> Made with care.</p></footer>
    </main>
</body>
</html>

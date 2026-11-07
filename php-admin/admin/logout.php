<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
try {
    admin_bootstrap();
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405); header('Allow: POST'); exit;
    }
    if (!admin_valid_csrf($_POST['csrf'] ?? null)) {
        http_response_code(403);
        echo 'This sign-out form has expired. Reload the dashboard and try again.';
        exit;
    }
    admin_sign_out();
    admin_redirect('login.php?signedout=1');
} catch (Throwable $error) { admin_unavailable($error); }

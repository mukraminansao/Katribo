<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/../includes/config.php';
try {
    admin_bootstrap();
    if (!admin_has_owner()) admin_redirect('setup.php');
    if (admin_current_user(false) !== null) admin_redirect('index.php');
    $errors = [];
    $email = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = is_string($_POST['email'] ?? null) ? strtolower(trim($_POST['email'])) : '';
        $password = is_string($_POST['password'] ?? null) ? $_POST['password'] : '';
        if (!admin_valid_csrf($_POST['csrf'] ?? null)) {
            http_response_code(403);
            $errors[] = 'This form has expired. Please try signing in again.';
        } else {
            $result = admin_attempt_login($email, $password, $_SERVER['REMOTE_ADDR'] ?? 'unknown');
            if ($result['ok']) {
                admin_sign_in($result['owner']);
                admin_redirect('index.php');
            }
            if ($result['retry_after'] > 0) {
                http_response_code(429);
                header('Retry-After: ' . $result['retry_after']);
                $errors[] = 'Too many sign-in attempts. Wait ' . (int) ceil($result['retry_after'] / 60) . ' minutes and try again.';
            } else {
                http_response_code(401);
                $errors[] = 'The email or password is incorrect.';
            }
        }
    } elseif ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405); header('Allow: GET, POST'); exit;
    }
    $setup = false;
    require __DIR__ . '/views/auth-page.php';
} catch (Throwable $error) { admin_unavailable($error); }

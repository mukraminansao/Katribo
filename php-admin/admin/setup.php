<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/../includes/config.php';
try {
    admin_bootstrap();
    if (admin_has_owner()) admin_redirect('login.php');
    if (!admin_local_setup_allowed()) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'First-time administrator setup is available only on this computer. Open http://localhost/Katribo/admin/ on the XAMPP computer to create the owner account.';
        exit;
    }
    $errors = []; $email = ''; $name = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $name = is_string($_POST['name'] ?? null) ? trim($_POST['name']) : '';
        $email = is_string($_POST['email'] ?? null) ? strtolower(trim($_POST['email'])) : '';
        $password = is_string($_POST['password'] ?? null) ? $_POST['password'] : '';
        $confirm = is_string($_POST['confirm'] ?? null) ? $_POST['confirm'] : '';
        if (!admin_valid_csrf($_POST['csrf'] ?? null)) {
            http_response_code(403);
            $errors[] = 'This form has expired. Please submit it again.';
        } else {
            $errors = admin_account_errors($name, $email, $password, $confirm);
            if (!$errors) {
                if (admin_create_owner($name, $email, $password)) admin_redirect('login.php?created=1');
                admin_redirect('login.php');
            }
            http_response_code(422);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405); header('Allow: GET, POST'); exit;
    }
    $setup = true;
    require __DIR__ . '/views/auth-page.php';
} catch (Throwable $error) { admin_unavailable($error); }

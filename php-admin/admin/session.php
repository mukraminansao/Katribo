<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/auth.php';
try {
    admin_bootstrap();
    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'];
    if (!in_array($method, ['GET', 'POST'], true)) {
        http_response_code(405); header('Allow: GET, POST'); echo '{"ok":false}'; exit;
    }
    if ($method === 'POST' && !admin_valid_csrf($_POST['csrf'] ?? null)) {
        http_response_code(403); echo '{"ok":false}'; exit;
    }
    // Background checks do not keep an inactive administrator signed in.
    $user = admin_current_user($method === 'POST');
    if ($user === null) { http_response_code(401); echo '{"ok":false}'; exit; }
    echo json_encode(['ok' => true]);
} catch (Throwable $error) {
    http_response_code(503); header('Content-Type: application/json; charset=utf-8'); echo '{"ok":false}';
}

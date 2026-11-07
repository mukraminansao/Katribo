<?php
// Opens the unchanged GitHub React/Node website. Previous storefront is backed up.
function katriboWebsiteRunning(): bool
{
    $connection = @fsockopen('127.0.0.1', 10000, $errorCode, $errorMessage, 1);
    if (!$connection) return false;
    fclose($connection);
    return true;
}
header('Cache-Control: no-store');
if (katriboWebsiteRunning()) {
    header('Location: http://localhost:10000/', true, 302);
    exit;
}
http_response_code(503);
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Start KATRIBO</title></head>
<body><main><h1>Start the KATRIBO website</h1><p>Double-click <strong>Start-Katribo.cmd</strong> in your Katribo project folder, then refresh this page.</p></main></body></html>

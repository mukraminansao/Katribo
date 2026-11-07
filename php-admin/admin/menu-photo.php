<?php
/** Serve the same canonical product artwork used by the customer site. No menu records change. */
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');
if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'HEAD'], true)) { http_response_code(405); header('Allow: GET, HEAD'); exit; }
$name = $_GET['file'] ?? '';
if (!is_string($name) || !preg_match('/^[a-z0-9-]{1,80}\.jpg$/D', $name)) { http_response_code(404); exit; }
if ($name === 'cookies-cream.jpg') $name = 'cookies-cream-milkshake.jpg';
$directory = dirname(__DIR__) . '/katribo-react/public/images/drinks/';
$file = $directory . $name;
$info = is_file($file) ? @getimagesize($file) : false;
// A missing or undersized replacement gets the customer's neutral placeholder, never the old crop.
if (!$info || $info[2] !== IMAGETYPE_JPEG || min($info[0], $info[1]) < 800) {
    $file = $directory . 'photo-unavailable.svg';
    $mime = 'image/svg+xml';
} else $mime = 'image/jpeg';
if (!is_file($file)) { http_response_code(404); exit; }
$etag = '"' . hash_file('sha256', $file) . '"';
header('ETag: ' . $etag);
header('Cache-Control: public, max-age=0, must-revalidate');
if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($file));
if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') readfile($file);

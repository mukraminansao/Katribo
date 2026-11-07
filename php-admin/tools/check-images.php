<?php
/**
 * KATRIBO — image asset checker (developer tool, not linked from the site)
 *
 * Browser: http://localhost/Katribo/tools/check-images.php
 * CLI:     php tools/check-images.php
 *
 * Lists every image the site needs, its required size, and whether the file
 * on disk is OK, LOW-RES (still a placeholder crop) or MISSING.
 * Visual guide for each drink: assets/img/reference/katribo-asset-reference-v2.png
 */
declare(strict_types=1);

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/products.php';

$root = dirname(__DIR__);

// [file, min width, min height, used for]
$need = [['assets/img/hero-iced-coffee.jpg', 1800, 2400, 'Home hero']];
foreach (products() as $p) {
    $need[] = [strtok($p['image'], '?'), 1200, 1500, $p['name']];
}
$need[] = ['assets/img/drinks/latte-art.jpg', 1200, 1500, 'Gallery: latte art'];
foreach (['katribo-interior-01', 'katribo-interior-02', 'katribo-staff', 'katribo-bay-view', 'katribo-espresso-bar'] as $s) {
    $need[] = ["assets/img/shop/$s.jpg", 0, 0, 'Original café photo (keep)'];
}

$rows = [];
$counts = ['OK' => 0, 'LOW-RES' => 0, 'MISSING' => 0];
foreach ($need as [$file, $w, $h, $use]) {
    $path = "$root/$file";
    $info = is_file($path) ? @getimagesize($path) : false;
    if (!$info) {
        $status = 'MISSING'; $size = '—';
    } else {
        $size = "{$info[0]}×{$info[1]}";
        $status = ($info[0] >= $w && $info[1] >= $h && $info[2] === IMAGETYPE_JPEG) ? 'OK' : 'LOW-RES';
    }
    $counts[$status]++;
    $rows[] = [$file, $use, $w ? "{$w}×{$h}" : 'any', $size, $status];
}

if (PHP_SAPI === 'cli') {
    foreach ($rows as $r) printf("%-8s %-48s %-11s need %-10s %s\n", $r[4], $r[0], $r[3], $r[2], $r[1]);
    printf("\nOK %d · LOW-RES %d · MISSING %d\n", $counts['OK'], $counts['LOW-RES'], $counts['MISSING']);
    exit($counts['OK'] === count($rows) ? 0 : 1);
}
?>
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Image check — KATRIBO</title>
<style>
body{margin:0;background:#080808;color:#fff;font:14px/1.5 Inter,system-ui,sans-serif;padding:32px 16px}
main{max-width:1100px;margin:auto}h1{font-size:28px;margin:0 0 4px}p{color:#A3A3A3}
table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #292929}
th{color:#A3A3A3;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.1em}
code{font-size:13px}.s{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700}
.OK{background:#fff;color:#080808}.LOW-RES{border:1px dashed #A3A3A3;color:#fff}.MISSING{border:1px solid #fff}
img{width:40px;height:50px;object-fit:cover;border-radius:6px;background:#161616;display:block}
</style></head><body><main>
<h1>Image check</h1>
<p>OK <?= $counts['OK'] ?> · LOW-RES <?= $counts['LOW-RES'] ?> · MISSING <?= $counts['MISSING'] ?> — replace files with the same name; see <code>IMAGES.md</code>.</p>
<table><thead><tr><th></th><th>File</th><th>Used for</th><th>Needs</th><th>Current</th><th>Status</th></tr></thead><tbody>
<?php foreach ($rows as [$file, $use, $needSize, $size, $status]): ?>
<tr><td><?php if ($status !== 'MISSING'): ?><img src="../<?= e(asset($file)) ?>" alt=""><?php endif; ?></td>
<td><code><?= e($file) ?></code></td><td><?= e($use) ?></td><td><?= e($needSize) ?></td><td><?= e($size) ?></td>
<td><span class="s <?= $status ?>"><?= $status ?></span></td></tr>
<?php endforeach; ?>
</tbody></table></main></body></html>

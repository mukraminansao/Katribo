<?php
/**
 * KATRIBO — site configuration
 *
 * Business details below are PLACEHOLDERS. Nothing here has been verified.
 * Replace each value marked "TODO" with the café's real information.
 * Any value left as null is shown on the site as a clearly marked placeholder.
 */

const SITE = [
    'name'      => 'KATRIBO',
    'tagline'   => 'Welcome to Our Backyard',
    'slogan'    => 'Good Coffee, Better People',
    'intro'     => 'A cozy coffee spot serving great coffee, refreshing milkshakes, and good vibes by the bay.',

    // TODO: confirm with the café owner. Leave null to show a placeholder.
    'address'   => null,          // e.g. 'Street, Barangay, Jolo, Sulu'
    'email'     => null,          // e.g. 'hello@katribo.ph'
    'phone'     => null,          // e.g. '+63 9xx xxx xxxx'
    'hours'     => null,          // e.g. 'Mon–Sun · 8:00 AM – 10:00 PM'
    'map_embed' => null,          // Google Maps embed URL

    // TODO: real social links. Leave null to show a placeholder.
    'social' => [
        'facebook'  => null,
        'instagram' => null,
        'tiktok'    => null,
    ],
];

/** Currency formatter: Philippine peso. Returns a placeholder for unknown prices. */
function peso(?int $amount): string
{
    return $amount === null ? 'Price unavailable' : '₱' . number_format($amount);
}

/**
 * Asset URL with a version stamp (file modification time), so a replaced
 * image with the SAME filename is picked up immediately instead of cached.
 */
function asset(string $path): string
{
    $file = dirname(__DIR__) . '/' . ltrim(strtok($path, '?'), '/');
    return is_file($file) ? $path . '?v=' . filemtime($file) : $path;
}

/** HTML escape shortcut. */
function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

/** Show a value or a visibly marked placeholder. */
function placeholder(?string $value, string $label): string
{
    return $value !== null && $value !== ''
        ? e($value)
        : '<span class="placeholder-tag" title="Placeholder — replace in includes/config.php">' . e($label) . '</span>';
}

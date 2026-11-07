<?php
/**
 * KATRIBO — reusable UI components
 * Navbar and footer live in header.php / footer.php.
 */

/** Inline stroke icons (24px grid, 1.75 stroke). */
function icon(string $name, int $size = 20, string $class = ''): string
{
    $p = [
        'search'   => '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        'cart'     => '<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
        'arrow'    => '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
        'arrow-left' => '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
        'plus'     => '<path d="M12 5v14"/><path d="M5 12h14"/>',
        'minus'    => '<path d="M5 12h14"/>',
        'menu'     => '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
        'close'    => '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
        'home'     => '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"/>',
        'cup'      => '<path d="M6 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M9 3v2M12 3v2"/>',
        'menu-book'=> '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4V5.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6V5.5Z"/>',
        'image'    => '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m20.5 16-5-5-8 8.5"/>',
        'more'     => '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
        'bean'     => '<ellipse cx="12" cy="12" rx="6" ry="8.5" transform="rotate(35 12 12)"/><path d="M9 17c2-2 1-5 3-7s4-2 3.5-4"/>',
        'shield'   => '<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
        'chair'    => '<path d="M7 11V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6"/><path d="M5 11h14v3H5z"/><path d="M7 14v6M17 14v6"/>',
        'wave'     => '<path d="M3 15c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2"/><path d="M3 19c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2"/><circle cx="16" cy="7" r="3"/>',
        'heart'    => '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
        'users'    => '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>',
        'leaf'     => '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19 13 11"/>',
        'pin'      => '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
        'mail'     => '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
        'phone'    => '<path d="M6.5 4h3l1.5 4-2 1.2a10 10 0 0 0 5.8 5.8l1.2-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2Z"/>',
        'clock'    => '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
        'trash'    => '<path d="M4.5 7h15"/><path d="M9.5 7V5h5v2"/><path d="M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12"/>',
        'check'    => '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
        'facebook' => '<path d="M14 8h2.5V4.5H14A3.5 3.5 0 0 0 10.5 8v2.5H8V14h2.5v6.5H14V14h2.5l.5-3.5h-3V8.6c0-.3.3-.6.6-.6Z"/>',
        'instagram'=> '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6"/>',
        'tiktok'   => '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.4 2.5 2.2 4.2 5 4.5"/>',
        'info'     => '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
        'scroll'   => '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    ][$name] ?? '';

    return '<svg class="icon ' . e($class) . '" width="' . $size . '" height="' . $size . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $p . '</svg>';
}

/** Pill button / link. $variant: primary | outline | ghost */
function button(string $label, string $href, string $variant = 'primary', bool $arrow = false, string $extra = ''): string
{
    return '<a class="btn btn--' . e($variant) . ' ' . e($extra) . '" href="' . e($href) . '">'
        . '<span>' . e($label) . '</span>' . ($arrow ? icon('arrow', 16) : '') . '</a>';
}

/** Section heading with optional "View all" link. */
function section_head(string $title, ?string $sub = null, ?string $link = null, string $linkLabel = 'View All'): string
{
    $h = '<div class="section-head reveal"><div><h2 class="section-title">' . e($title) . '</h2>';
    if ($sub) $h .= '<p class="section-sub">' . e($sub) . '</p>';
    $h .= '</div>';
    if ($link) $h .= '<a class="link-arrow" href="' . e($link) . '">' . e($linkLabel) . icon('arrow', 16) . '</a>';
    return $h . '</div>';
}

/** Product card used on Home, Menu and Details pages. */
function product_card(array $p, bool $lazy = true): string
{
    $hasPrice = $p['price'] !== null;
    $priceCls = $hasPrice ? 'card-price' : 'card-price is-unavailable';
    $btn = $hasPrice && !($p['soldOut'] ?? false)
        ? '<button type="button" class="icon-btn add-btn" data-add="' . e($p['id']) . '" aria-label="Add ' . e($p['name']) . ' to cart">' . icon('plus', 18) . '</button>'
        : '<button type="button" class="icon-btn add-btn" disabled aria-label="' . e($p['name']) . ' — price unavailable, cannot be added yet" title="Price unavailable">' . icon('plus', 18) . '</button>';
    if ($p['soldOut'] ?? false) $btn = '<button type="button" class="icon-btn add-btn" disabled aria-label="' . e($p['name']) . ' — sold out" title="Sold out">' . icon('plus', 18) . '</button>';

    return '<article class="product-card" data-category="' . e($p['category']) . '" data-noncoffee="' . ($p['nonCoffee'] ? '1' : '0') . '">'
        . '<a class="card-media" href="drink.php?id=' . e($p['id']) . '" aria-label="View ' . e($p['name']) . '">'
        . '<img src="' . e($p['image']) . '" alt="' . e($p['name']) . ' in a KATRIBO cup" ' . ($lazy ? 'loading="lazy" ' : '') . 'width="1200" height="1500"></a>'
        . '<div class="card-body"><div class="card-text">'
        . '<h3 class="card-name"><a href="drink.php?id=' . e($p['id']) . '">' . e($p['name']) . '</a></h3>'
        . '<p class="' . $priceCls . '">' . e(peso($p['price'])) . '</p>' . (($p['soldOut'] ?? false) ? '<p class="price-unavailable-note">Sold out</p>' : '') . '</div>'
        . $btn . '</div></article>';
}

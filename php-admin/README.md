# KATRIBO — Coffee Shop Website

All-black, responsive coffee shop site built from the KATRIBO UI reference.
Plain PHP + CSS + vanilla JS — no build step, runs as-is on XAMPP.

**Open:** start Apache and MySQL in XAMPP → http://localhost/Katribo/

## Admin and saved orders

Open **http://localhost/Katribo/admin/** and create your administrator account on the first visit from this computer, then sign in. Checkout orders and menu edits now persist in MySQL. The dashboard, Orders, Customers, and Analytics screens read saved orders; old browser preview records are ignored. Visitors browse and order without signing in. Setup, authentication, database configuration, and tests are in [admin/README.md](admin/README.md).

The `katribo` database has been initialized locally with 26 existing menu items and no sample orders. For a fresh installation, start MySQL and run `C:\xampp\php\php.exe tools/setup-database.php` once from the project folder. The command is safe to repeat and does not reset prices, orders, or removed items.

## Pages
| Page | File | Notes |
|---|---|---|
| Home | `index.php` | Hero, favorites, featured drink, about, "A space…" banner, gallery preview |
| Menu | `menu.php` | Category filter (All / Coffee / Latte / Macchiato / Milkshake / Specialty / Non-Coffee). Deep link: `menu.php?cat=Latte` |
| Drink details | `drink.php?id=…` | Size, add-ons, quantity, live total, recommendations |
| Cart | `cart.php` | Quantity, remove, special instructions, totals — saved in `localStorage` |
| Checkout | `checkout.php` | Guest pickup orders, server-validated prices, MySQL persistence, duplicate-retry protection; pay at pickup |
| About | `about.php` | Uses the original café photos |
| Gallery | `gallery.php` | Filters + lightbox (keyboard, swipe) |
| Contact | `contact.php` | Validated form, contact placeholders, map placeholder |

## Where to edit things
- **Live menu, prices, availability:** Admin → Menu Management. `includes/products.php` contains the initial seed, sizes and add-on configuration.
- **Address, email, phone, hours, socials, map:** `includes/config.php`
- **Navbar / footer / mobile tab bar:** `includes/header.php`, `includes/footer.php`
- **Reusable pieces (product card, buttons, icons):** `includes/components.php`
- **Design tokens (colours, spacing, radii):** top of `assets/css/style.css`

## Honest placeholders (please confirm with the café)
- **Prices:** only drinks whose price appears in the UI reference have one (₱120–₱160).
  Others show **"Price unavailable"** and can't be added to the cart.
- **Size/add-on prices** (Large +₱20, add-ons +₱20/₱30) are the sample values from the reference.
- **Menu list** is the design brief's sample, not a verified KATRIBO menu.
- **Address, email, phone, hours, social links, map** are empty → shown as dashed "to be confirmed" tags.
- **Checkout** posts to `api/place-order.php`, validates details, recalculates prices using MySQL, and saves the order and its lines in one transaction. A confirmation is returned only after commit. Retrying an unchanged request returns the same order. Orders appear as Pending in Admin; online payments and email/SMS notifications are not connected.
- **Seed prices and product descriptions remain unverified design content.** Review them in Menu Management before accepting customer orders.
- **Contact form** validates but isn't connected to an inbox. Set `email` in `config.php` and it will
  open the visitor's email app with the message pre-filled.

## Images
**To swap in high-resolution photos, follow `IMAGES.md` (exact filenames + sizes).**

- `assets/img/shop/` — original café photos (interior, wall branding, staff) plus two crops made from them
  (`katribo-bay-view.jpg`, `katribo-espresso-bar.jpg`).
- `assets/img/drinks/` — individual tiles cropped from `katribo-drinks-reference.png` (labels removed).
- `assets/img/hero-iced-coffee.jpg` — cropped from the UI reference hero and upscaled.
  **Replace with a real high-resolution photo** when available (same filename) — the current one is soft.
- `assets/img/reference/` — the supplied reference sheets, kept for comparison only (not shown on the site).

## Fonts
Inter is self-hosted in `assets/fonts/` (SIL Open Font License) so the site works offline.

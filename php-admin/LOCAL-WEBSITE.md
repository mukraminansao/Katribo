# Restored GitHub website

The customer website in `katribo-react/` uses the design restored from https://github.com/mukraminbariwa5-create/Katribo at revision `aa6c17a6717bfb5c9ab4264fcc2145289622eb0f`, with a local connection to the PHP admin and MySQL database.

Double-click `Start-Katribo.cmd` to start the website and open http://localhost:10000/.
Start Apache and MySQL in XAMPP, then run the launcher. http://localhost/Katribo/ opens the same website. If the Node server is stopped, that address shows startup instructions. The different port preserves the GitHub design's routing and asset URLs.

Admin: http://localhost/Katribo/admin/. Public menu data comes from the same MySQL catalogue. Reload the customer page after changing items, prices or availability in admin. Existing GitHub photos are retained where available. Orders go through PHP validation and appear in admin as Pending. Payment preference and instructions are saved; payment is collected at pickup, with no online charging or notifications.

Menu management now includes JPG/PNG/WebP uploads with local previews, direct visibility switches, and quick price editing. Uploaded photos are optimized to generated JPEGs under `assets/img/uploads/` and are served to the customer site through the updated media bridge. Saving a replacement photo preserves previous order images. Include this folder when backing up the website. Source backups and 49 passing browser/upload/checkout checks are saved in `.restoration/admin-menu-upgrade-20261029/`; all test items/photos were confined to temporary fixtures and removed. The running local Node server has been refreshed to load the upload support.

The admin also supports Sold out controls (visible, ordering paused), opt-in new-order sounds/visual alerts, printable prep slips, Owner/Manager/Staff accounts, and ordered homepage favorites. Owners and managers can select favorites from menu cards and arrange them under Featured drinks; the customer Favorites section follows those settings after refresh. Sold-out drinks keep their photos/prices and cannot be added or ordered; checkout also rejects stock changes that happen after a customer's page was loaded. Existing carts are kept for review. The original eight favorites are preserved by migration 3. React typecheck/build and 86 dedicated end-to-end operations checks passed, along with the existing authentication/commerce/menu/Orders checks. The source/database backups and verification artifacts are in `.restoration/cafe-operations-20261029/`. No real staff accounts or orders were created during verification.

Checkout retries reuse a request key, so a lost response does not create another order. Changed prices require the customer to refresh and review the total. Database failures show an error and retain the saved cart rather than displaying a demo confirmation.

Previous files are preserved in `.restoration/backup-20261029-023815/`, which is denied access through Apache. No database records were changed during restoration.

To rebuild after editing the React source:

```powershell
cd C:\xampp\htdocs\Katribo\katribo-react
npm ci --include=dev
npm run build:server
```

The server reads the build in `dist/`. Keep Node.js 20 or newer installed.

Before connecting, source and database backups were saved in `.restoration/connection-20261029-025405/`. The migration adds only a nullable payment-preference column; existing menu records and order data were verified unchanged. Tests use separate disposable databases and accounts.

Validation: typecheck and production build pass; 87 commerce integration checks, 48 admin authentication checks and the admin asset checks pass. Browser QA verified a website order appearing in admin using an isolated database. The legacy `shared/order.ts` and Netlify function remain demo code for the original hosting setup; the local Node server uses `php-backend.mjs` instead. A static Netlify deployment does not provide this local PHP/MySQL integration.

## Responsive UI refinements

Home and About share four highlights on every screen. The header always exposes the cart, Menu and Gallery use compact category pills, and View All controls share an outlined style. About and Contact use responsive photo panels. Contact messaging remains disabled until a real email destination is configured in `src/data/site.ts`; it never displays a false sent confirmation.

The pre-change source and build are saved in `.restoration/ui-refinement-20261029-043003/`. These refinements do not change the commerce API, admin authentication or database schema. Typecheck/build and all 87 isolated commerce checks passed. Browser checks covered 320, 820, 1024 and 1440px widths, category selection by click and keyboard, empty/populated cart states, and navigation to checkout. The test cart was cleared without placing a real order.

The later hero redesign was reverted at the user's request. The original wide coffee artwork, mobile crop, typography and actions are restored, with no added CSS blur filter. The remaining fix gives the artwork and slogan their own scene, independent of the highlights, and reserves room for the slogan at intermediate widths. Nine widths from 320 to 1920px passed checks for caption clipping, overlap with the introduction, horizontal page overflow and unwanted blur filters. The original hero backup remains in `.restoration/hero-responsive-20261029-050218/`.


### Desktop opening view

The home hero now reserves a compact horizontal highlight strip within the initial viewport on desktop screens (1024px and wider, with at least 540px height). The headline adapts to the remaining scene height; the original coffee artwork is retained with no added blur. This is scoped to Home, leaving About's larger highlight layout and the phone 2-by-2 grid intact. Very short windows retain natural scrolling rather than cropping content.

Backup: `.restoration/hero-first-screen-20261029-052245/`. Typecheck/build pass. Browser checks confirmed all four highlights, hero actions and slogan fit at 1024x540, 1024x600, 1280x600, 1280x720, 1366x768, 1440x540, 1440x900 and 1920x1080. Phone checks confirmed the 2-by-2 grid and no horizontal overflow. Results and the laptop preview are saved in `.restoration/first-screen-audit.json` and `.restoration/hero-highlights-first-screen.png`.

The desktop highlight strip has fully transparent items and no outer border. The original sharp hero photograph now extends behind the whole row instead of stopping above it; the lower black fade is removed on desktop. Titles scale to 26-38px and icons to 64px in normal desktop windows, with a compact treatment for short windows. Six desktop sizes from 1024x540 to 1920x1080 were checked for artwork coverage, transparent items, first-view visibility, button clearance and horizontal overflow. Typecheck and build pass. The pre-change backup is `.restoration/highlight-artwork-20261029-053806/`.

### Hero edge and menu search

The original hero artwork now renders immediately, without the translucent entrance animation, and its right edge blends into the existing background. No blur filter was added. Search opens a responsive native dialog with autofocus, live ranked menu matches, clear/close controls, arrow-key selection, Enter navigation, Escape/outside dismissal, a contained Tab sequence, and focus restoration. Ctrl/Cmd+K or `/` opens search; `/` leaves text fields alone. View all results opens a shareable `/menu?q=...` page with category filters, refinement and clear controls. Overlapping search/cart transitions retain the page scroll lock correctly.

Backup: `.restoration/search-and-hero-edge-20261029-054750/`. Typecheck/build and ten search-matching checks pass. Browser checks covered result navigation, full results, empty matches, clear, shortcuts, focus, dismissal and 320x568, 390x844, 820x1180 and desktop layouts. Preview images: `.restoration/hero-edge-fixed.png` and `.restoration/modern-search-preview.png`. No commerce API or database changes were required.

The five remaining legacy drink crops (Cold Brew, Espresso, Hazelnut Latte, Hot Latte and Hojicha Latte) are no longer displayed on the customer website. A neutral vector placeholder replaces those specific image URLs across menu cards, search, details and cart views. Drinks and their prices remain in the catalogue, and future replacement image URLs display normally. Original image files and database records are preserved. Source backup: `.restoration/low-resolution-photos-20261029-055755/`.

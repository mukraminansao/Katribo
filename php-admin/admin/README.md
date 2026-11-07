# Katribo Admin — saved orders and menu management

A PHP + CSS + JavaScript admin workspace based on the supplied dashboard reference, protected by server-side administrator authentication and connected to MySQL. No packages or build step required. This integration applies to the PHP/XAMPP shop; the separate React version is unchanged.

## Open it

1. Start **Apache and MySQL** in XAMPP.
2. Visit **http://localhost/Katribo/admin/**.
3. On your first visit, create the owner account with your name, email, and a password of at least 12 characters (at most 72 bytes).
4. Sign in using that account. Use the profile menu in the dashboard to **Sign out**.

The owner can create real team accounts under **Team & access**. Managers can edit the menu, stock and homepage favorites and process orders. Staff can view the menu, process orders and print prep slips. Everyone uses the same login page; no sample staff accounts or default passphrases are installed.

Open the PHP page through Apache, rather than double-clicking the file. Your existing administrator account is unchanged; no default administrator credentials are shipped.

The sign-in and setup pages share a full-page coffee photograph with a floating, warm charcoal form, brass accents, and 56px controls. The layout adapts to phones and tablets, with compact spacing on laptop screens. The October 29 login redesign passed 48 isolated HTTP authentication checks and browser checks at ten sizes from 320px to 1920px, including setup, password visibility, invalid credentials, and successful sign-in. The original view/styles and preview images are saved in `.restoration/admin-login-premium-20261029/`.

The dashboard hero uses the supplied six-drink lineup, with a wider serif welcome title, warm italic accent, and working Orders/Menu shortcuts. The cursive “Every flavor. A little joy.” slogan remains visible across desktop and phone layouts. The original files and responsive previews for the welcome typography update are saved in `.restoration/admin-hero-typography-20261029/`.

## Database setup and configuration

The local `katribo` database is initialized with the 26 existing menu items and no fabricated orders. On a fresh installation, run `C:\xampp\php\php.exe tools/setup-database.php` from the project root while MySQL is running. This creates the database/tables and imports the catalogue once. Repeating it does not overwrite live menu changes or order history.

The XAMPP connection defaults in `includes/database.php` are host `127.0.0.1`, port `3306`, database `katribo`, user `root`, and an empty password. These match this local XAMPP installation. Override them with server environment variables `KATRIBO_DB_HOST`, `KATRIBO_DB_PORT`, `KATRIBO_DB_NAME`, `KATRIBO_DB_USER`, and `KATRIBO_DB_PASSWORD` when needed. Remote hosting should use HTTPS and a dedicated database account restricted to this database. Database creation/migrations need schema privileges; ordinary runtime operations need only SELECT/INSERT/UPDATE.

Tables are defined in `database/schema.sql`: migration versions, menu categories, menu items, orders, immutable order lines, and order status history. All use InnoDB and utf8mb4. Times are stored in UTC and displayed in Asia/Manila. Guest customer summaries group orders by normalized mobile number; guests do not receive accounts.

Administrator sign-in still uses the existing private account file. Database installation does not replace or reset your administrator. Back up MySQL separately from that account file.

## Administrator access

- Visitors can still browse, use the cart, and check out without signing in. No customer authentication was added.
- `/admin/` redirects to sign-in unless a valid administrator session exists. The session endpoint also checks authentication on the server.
- First-time setup accepts only direct loopback requests using `localhost`, `127.0.0.1`, or `[::1]`. Setup closes as soon as the owner exists. There is no public admin registration or password-reset endpoint.
- Passwords use PHP `password_hash`/`password_verify`, never clear text. Account creation, sign-in, sign-out, and activity updates require CSRF tokens. The session ID changes at sign-in.
- Sessions expire after **30 minutes of inactivity** or **8 hours total**. Open dashboard tabs check expiry every minute; background checks do not extend an idle session. Clicking or typing in the dashboard renews activity at most once a minute.
- Session cookies are scoped to the admin area, are HttpOnly and SameSite=Lax, and use Secure when the request is HTTPS. Use HTTPS for remote hosting; the local HTTP setup is for XAMPP on your computer.
- Five failed attempts from one IP trigger a 15-minute window; account-based limiting also applies across IPs after 20 failures. Correct credentials do not bypass an active limit.

The owner and team password hashes, account settings and attempt counters are stored in `admin/private/auth-state.php`. File locking and atomic replacement protect concurrent writes. The file has an executable PHP guard, the directory denies Apache access using `.htaccess`, and runtime PHP data files are excluded by `admin/.gitignore`. Keep PHP execution and these Apache protections enabled, and do not expose backups or copies of this directory as static files. The local XAMPP Apache configuration supports `.htaccess` overrides.

Back up the private account file securely if you move this PHP project. For a different private storage location, set the server environment variable `KATRIBO_ADMIN_AUTH_FILE` to an absolute path in an existing directory that PHP can write. Do not commit account data. PHP's normal session directory is separate from the account file (`C:\xampp\tmp` in this XAMPP installation).

If the owner forgets their password, recovery currently requires access to the server files: stop Apache, move `auth-state.php` to a secure backup outside the web directory, restart Apache, and repeat localhost-only owner setup. This resets all admin accounts, including team members, and invalidates their sessions; the public catalogue is unaffected. Recreate any required team accounts afterward. Owners can reset team passwords through Team & access without resetting the account file. Do not use the file-reset procedure as a remote password-reset flow.

## What works

- Dashboard: statistics calculated from saved orders, a sales chart with date ranges and mouse/keyboard inspection, top sellers, recent orders, and quick actions. An empty database shows zero activity.
- Orders: responsive pickup cards, clickable status summaries, an Active filter, priority/newest/oldest sorting, and search by ID, reference, customer or phone (including local `09…` and international `+63…` formats). Search, status and sort survive refreshes and status changes; CSV exports the current results.
- Order workflow: Pending → Processing → Completed, with clear preparation and pickup actions in a larger detail dialog. Customer notes, contact details, item sizes/add-ons and payment preferences are grouped for quick reading. Cancelling requires explicit confirmation. Completed and Cancelled orders stay closed. Version checks prevent stale updates from overwriting newer changes; conflicts reload the latest details, and failed saves remain available for retry. Status history records who made each transition.
- Menu: styled item cards, ready-to-order/unpriced/hidden summaries, search/category filters, direct visibility switches, and a focused price editor. The larger item editor supports live name/price/photo previews, JPG/PNG/WebP uploads, existing-photo selection, descriptions, and the Non-Coffee filter. Search and filters survive saves and refreshes. Changes affect both public menus and server checkout calculations. Removal is soft deletion; old order lines retain their original names, prices, photos, size and add-ons.
- Categories: browse the seeded categories, including Pastries. Pastries have no drink size or add-on customization.
- Customers: guest summaries by mobile number and links to their orders.
- Analytics: completed-order sales value, bestsellers, and CSV export.
- Global search, pending-order notifications inside the dashboard, responsive navigation, and manual refresh in the profile menu. Data refreshes every 15 seconds while visible, without extending an idle login session.
- Owner setup, sign-in, authenticated profile, sign-out, login limiting, and session expiry.
- Sold out: keep an item visible with ordering disabled. This is independent of Hidden, which removes it from the public menu. The server rejects sold-out items even if a customer's page or cart was loaded before the stock change.
- Featured drinks: use **Feature on Home** on a menu card, then arrange selections under **Featured drinks** with the up/down controls. The customer homepage Favorites section follows that order. Hidden items are omitted; visible sold-out items retain their Sold out badge. Removing every selection hides the section. The migration preserves the original eight homepage favorites.
- New-order alerts: a visual banner and bell highlight appear for new Pending orders. Click **Sound off** to enable the optional chime, and click **Sound on** to mute it. A saved sound preference may require clicking **Enable sound** after a page reload because browsers require a user gesture. Alerts poll every 15 seconds while the workspace is open and signed in; background timers may be throttled by the browser. Existing orders do not trigger startup alerts, repeated refreshes do not replay them, and banners clear when those orders enter preparation. Background reads do not keep an idle session signed in or overwrite an open form.
- Prep slips: open an order, choose **Print prep slip**, and use the new page's Print button. It contains quantities, sizes, add-ons, customer name/phone and pickup notes, with a narrow 72mm layout for 80mm paper or ordinary browser printing. Cancelled/completed status is displayed clearly. Printer selection remains in the browser print dialog.
- Team accounts: only the owner can create or update Staff/Manager access, pause sign-in or reset a member's passphrase. Account and menu writes are checked on the server. Pausing access, changing account details/role or resetting a password revokes existing sessions; closed order history retains the acting account ID. The owner cannot be demoted or disabled from this screen.

The old `katribo.admin.preview.v1` browser records are ignored and are never imported as real orders or live menu edits. There is no reset-sample-data action. Saved orders and menu changes persist across browsers and reloads in MySQL.

Team credentials remain in the existing PHP-guarded private authentication store alongside the owner. The optional `users` map is backward compatible with an existing owner-only file; only password hashes are stored, and credential hashes/authentication versions are never included in the team API. Back up that private store securely. Schema migration 3 adds `is_sold_out`, `is_featured` and `featured_rank` without changing existing prices, photos, orders or the owner account. A pre-migration database backup and source backups are in the Apache-denied `.restoration/cafe-operations-20261029/` directory.

Menu photo uploads accept JPEG, PNG and WebP files up to 6 MB, with dimensions from 64 pixels per side to 16 megapixels (maximum 8000 pixels per side). PHP GD and Fileinfo must be enabled; EXIF is used when available to apply phone-photo orientation. Images are decoded, resized to at most 1600px on the longest side, and re-encoded as JPEGs with generated filenames and no original metadata. Uploads require administrator authentication and CSRF. Photos are written only on Save; failed menu writes roll back their new photo. Existing photos are retained when replaced or when an item is removed, preserving historical order images. Include `assets/img/uploads/` in backups and keep its `.htaccess` protections in place. The customer website bridge supports these uploaded image paths.

Legacy product photos in the admin now display the same 900–1000px artwork as the customer site through the read-only `menu-photo.php` endpoint. Cookies & Cream uses the customer's milkshake image alias. Cold Brew, Espresso, Hazelnut Latte, Hot Latte and Hojicha Latte use the same “Photo coming soon” placeholder as the customer menu; the original small crops are no longer shown. New uploads continue to display directly. Cards, editor previews, bestseller thumbnails and dashboard drink shortcuts use this shared photo resolution without changing stored menu/order image references. Edit controls and status labels are larger; cards, images, buttons and navigation have hover/focus feedback, with lift/zoom disabled for reduced-motion preferences.

Guest checkout validates all inputs and recalculates prices while locking the relevant menu rows. Order, line and initial-status writes commit together. An idempotency key prevents a lost response or simultaneous retries from creating duplicate orders. Changed details require a new key; replaying an accepted request returns its original receipt even if the menu price later changes. The checkout retains its cart on failure. Retry keys are kept in browser session storage without storing the customer details; a plain HTTP LAN browser without Web Crypto hashing has in-page retry protection only.

If MySQL is unavailable, admin displays an error or clearly marked last-loaded data; it never substitutes sample orders. Public browsing falls back to the initial catalogue with a connection warning, but checkout fails without a confirmation until storage returns. Online payments, email, and SMS are not implemented: orders are pickup requests, pending team review, with payment at pickup.

Promotions, Announcements, Media Library, Website Content, and Settings are marked **Next** and explain their planned status when opened.

The dashboard shows month-to-date activity against the full previous month; Analytics labels this explicitly. Sales mean completed-order value, not recorded payment collections, and exclude pending/processing/cancelled orders. Customer counts use distinct normalized mobile numbers, not names. Confirm the seeded design prices and descriptions before accepting customer orders.

## Files

- `index.php`: authenticated controller and catalogue bootstrap.
- `api.php`: authenticated reads and CSRF-protected order/menu writes.
- `login.php`, `setup.php`, `logout.php`, `session.php`: authentication entry points.
- `includes/auth.php`: account storage, password checks, session guard, CSRF, and attempt limits.
- `views/`: guarded dashboard and authentication templates; direct access is denied.
- `private/`: ignored runtime account and attempt data, protected by `.htaccess`.
- `assets/admin.css`: responsive dashboard styling, independent of the storefront styles.
- `assets/admin.js`: API reads/writes, refresh, routing, charts, forms, and exports. No sample order generation or admin localStorage persistence.
- `includes/menu-photos.php`: validated image processing and transactional photo/menu saves.
- `menu-photo.php`: constrained, cache-aware access to the customer site's canonical product artwork.
- `includes/team.php`: owner-only staff/manager account management and safe account listings.
- `assets/order-alerts.js`: deduplicated visual notifications and opt-in Web Audio chimes.
- `print-order.php`, `assets/print.css`, `assets/print.js`: authenticated preparation-slip preview and browser printing.
- `../assets/img/uploads/`: generated menu JPEGs, retained for order history.
- `assets/auth.css`, `assets/auth.js`: authentication page styling and password visibility toggle.
- `assets/session-guard.js`: checks expiry in open tabs and reports real user activity to the server.
- `assets/`: existing project images copied here so the preview is independent of the React folder. Product images and Inter fonts are read from the main shop's assets.
- `../includes/database.php`, `catalogue.php`, `orders.php`: connection, catalogue management, checkout transactions and order workflow.
- `../tools/setup-database.php`: CLI-only, repeatable schema/seed installation.

The existing Hugh Is Life font is used for the reference's script lettering. Its original personal-use license is included as `assets/LICENSE-HughIsLife.txt`; replace or appropriately license it before commercial use.

## Verification

- PHP syntax checked with XAMPP PHP 8.2.
- JavaScript syntax checked with Node.
- Catalogue/image/font references checked locally.
- Repeat the read-only dashboard template and asset checks with `C:\xampp\php\php.exe tools/check-admin.php` from the project root.
- Run `C:\xampp\php\php.exe tools/check-admin-auth.php` for 48 HTTP integration checks covering setup, CSRF, password validation, cookie renewal, protected access, sign-out/replay, idle/absolute expiry, login limiting, and corrupt-storage handling. The test creates a temporary PHP server, owner and sessions, then removes them. It never uses the real owner file. The CLI tools reject HTTP access.
- The setup page has been checked visually in a browser. No real owner was created during verification. Production HTTPS/Apache deployment is not configured by this change.
- `C:\xampp\php\php.exe tools/check-commerce.php` passed 87 HTTP/MySQL checks: real persistence, guest checkout, input validation, server pricing, idempotent and concurrent retries, CSRF/auth checks, version conflicts, order transitions, menu CRUD, historical price preservation, rollback, and outage/cart preservation. It creates and removes a fresh `katribo_test_<random>` database and a disposable administrator/session directory. It never writes to the real Katribo database or owner account.
- The October 29 Orders upgrade passed 44 additional browser/MySQL checks, including nine widths from 320px to 1920px, empty states, filtered CSV/formula escaping, local phone search, refresh/filter preservation, actual preparation/pickup/cancellation writes, conflict recovery, failed-save retry, and keyboard focus. Backups, previews, the repeatable `check-orders.cjs` script, and `orders-audit.json` are in `.restoration/admin-orders-upgrade-20261029/`. Browser test orders and accounts are confined to a temporary database removed at the end of each run.
- The live dashboard and menu screen were checked in the browser. A full guest add-to-cart → checkout → saved confirmation flow was also verified against an isolated test database. No test orders remain in the real database.
- The October 29 menu upgrade passed 49 browser/upload/checkout checks, including nine menu widths, three editor widths, local previews, all three photo formats, EXIF rotation, upload limits/authentication/CSRF, failed-upload cleanup, conflict recovery, visibility, quick pricing, retained order history, and actual storefront photo rendering. The 87 commerce checks, 48 authentication checks and 44 Orders checks also pass. Backups, preview images and the repeatable `check-menu.cjs` are in `.restoration/admin-menu-upgrade-20261029/`. Tests use disposable accounts/databases and remove only their own generated photos. The local storefront was restarted and Apache/storefront photo delivery was checked without changing live catalogue records.
- The follow-up photo/design refinement passed 85 checks: all 26 seeded photos match customer artwork byte for byte, no small crops are displayed, controls/labels meet their enlarged sizes at ten widths, hover/focus and reduced-motion behavior work, and the photo endpoint rejects invalid paths and supports conditional caching. The 49 menu/upload checks passed again. Backups, previews and `quality-audit.json` are in `.restoration/admin-menu-quality-20261029/`. Apache photo delivery and the refreshed live admin menu were also verified.
- The five operations features passed 86 dedicated checks covering Sold out UI/server enforcement and stale carts, audio opt-in/mute and duplicate alerts, editing-safe background refresh, print controls/privacy/escaping, actual Staff/Manager sign-in and permission boundaries, account suspension/password reset/session revocation, atomic featured ordering, customer homepage rendering and responsive layouts. The 48 authentication, 87 commerce, 49 menu and 44 Orders checks also passed. React typecheck and the production build passed; the React changes were reviewed for component structure, hooks, accessibility and TypeScript behavior. Repeatable fixtures, `operations-audit.json` and preview images are saved in `.restoration/cafe-operations-20261029/`. Live verification found one owner and zero real staff accounts; no real orders were created.

Implementation references: [PHP password hashing](https://www.php.net/manual/en/function.password-hash.php), [session security settings](https://www.php.net/manual/en/session.security.ini.php), and [session ID renewal](https://www.php.net/manual/en/function.session-regenerate-id.php).
Order persistence uses [PDO transactions](https://www.php.net/manual/en/pdo.transactions.php); schema changes are kept outside data transactions because MySQL DDL implicitly commits.

## Next steps

1. Add promotions, announcements, a media library, and website content management one module at a time. Individual menu photo uploads are already available.
2. Add optional customer notifications when required. Owner/Manager/Staff roles and team accounts are already implemented.
3. Add database-side report aggregation, pagination and retention rules as order volume grows; this first local version loads the full order list for its charts and filters.

Preserve historical order names and prices when menu items change. Validate all writes on the server; the browser preview is not a replacement for server validation or authorization.

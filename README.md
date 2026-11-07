# KATRIBO — Welcome to Our Backyard

**Live demo:** https://katribo-demo.onrender.com (free hosting: the first visit can take about a minute to wake up)

## Two ways it runs

- **Public demo (Render):** the website serves its built-in sample menu and checks every order on the server, but nothing is saved, charged or sent. This happens automatically on Render, or anywhere with `KATRIBO_DEMO=1`.
- **Connected to the café admin (XAMPP):** the menu and pickup orders come from the PHP + MySQL admin in [`php-admin/`](php-admin/). Staff manage the menu, orders, featured drinks and team accounts there. The website forwards `/api/catalogue` and `/api/place-order` to it through `php-backend.mjs` when `KATRIBO_BACKEND_URL` is set.

### Run the connected version locally

1. Copy `php-admin/` to `C:\xampp\htdocs\Katribo`, and put this website in `C:\xampp\htdocs\Katribo\katribo-react`.
2. Start Apache and MySQL in XAMPP, then run `C:\xampp\php\php.exe tools/setup-database.php` once from `C:\xampp\htdocs\Katribo`.
3. In `katribo-react`, run `npm ci --include=dev` and `npm run build:server`.
4. Double-click `Start-Katribo.cmd`. Create the owner account at http://localhost/Katribo/admin/ on first use.

See [`php-admin/LOCAL-WEBSITE.md`](php-admin/LOCAL-WEBSITE.md) and [`php-admin/admin/README.md`](php-admin/admin/README.md) for the full admin guide. Admin account data (`admin/private/*.php`) is never committed.

A premium, all-black coffee shop website: menu with category filters, drink details with sizes and add-ons, a persistent cart, a validated checkout, a gallery with a lightbox, and a contact page. On phones it works like an app, with a bottom tab bar and a sticky Add to Cart bar.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Netlify (static hosting + one serverless function)

## Run it locally

You need [Node.js 20+](https://nodejs.org).

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # production build → dist/
npm run preview    # serve the build locally
npm run check:images   # which drink photos still need high-res versions
```

## Deploy (GitHub + Netlify)

1. Create an empty GitHub repo (e.g. `katribo`) and push this folder:
   ```bash
   git init
   git add .
   git commit -m "KATRIBO website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/katribo.git
   git push -u origin main
   ```
2. On [netlify.com](https://app.netlify.com) → **Add new site → Import an existing project → GitHub** → pick the repo.
3. Netlify reads `netlify.toml` automatically: build command `npm run build`, publish folder `dist`. Click **Deploy**.
4. Every push to `main` redeploys the site.

## Deploy on Render (free)

The repo also runs as a Node web service (`server.mjs`, zero dependencies), so checkout works on Render too:

- **Build command:** `npm ci --include=dev && npm run build:server`
- **Start command:** `npm start`

`render.yaml` has these settings, so **New → Blueprint** on Render picks them up. Every push to `main` redeploys. On the free plan the site sleeps when idle and the first visit can take about a minute.

## Project structure

```
src/
  data/menu.ts        ← menu, prices, sizes, add-ons (edit here)
  data/site.ts        ← address, email, phone, hours, socials, map (edit here)
  pages/              ← Home, Menu, Drink, Cart, Checkout, About, Gallery, Contact
  components/         ← header, tab bar, footer, product card, icons, buttons
  lib/                ← router, cart store, helpers
  styles/index.css    ← design tokens (colours, type, buttons)
shared/order.ts       ← order validation (prices recalculated on the server)
netlify/functions/    ← POST /api/place-order
public/images/        ← drink photos + original café photos
```

## Honest placeholders

- **Menu and prices** are a design sample. Drinks without a confirmed price show "Price unavailable" and can't be added to the cart.
- **Business details** (address, email, phone, hours, socials, map) show as "to be confirmed" until set in `src/data/site.ts`.
- **Checkout is a demo.** The server validates the order and recalculates every price, but nothing is stored, charged or sent to the café.
- **Photos:** every drink and pastry uses a 900–1000px square photo; the hero is `public/images/hero-katribo.jpg` (1295 × 1214, with a square crop for phones). Run `npm run check:images` after adding new ones.
- **Pastries** (Cheesecake, Chocolate Cake) show "Price unavailable" until prices are set in `src/data/menu.ts`.

## Credits

Built by Mukramin Bariwa Ansao. Café photos © KATRIBO. Inter typeface by Rasmus Andersson (SIL OFL).

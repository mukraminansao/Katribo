# KATRIBO — Image replacement guide

Replace a file by saving the new image **with exactly the same filename, in the same folder**.
No code changes needed. URLs carry an automatic version stamp, so a new file shows up after a normal refresh.

## Folder structure (images only)

```
Katribo/
└── assets/
    └── img/
        ├── hero-iced-coffee.jpg          ← Home hero (REPLACE)
        ├── favicon.svg
        ├── drinks/                       ← product photos (REPLACE the 27 listed below)
        ├── shop/                         ← real café photos (keep)
        │   ├── katribo-interior-01.jpg   1536×2048  bar + windows + bay
        │   ├── katribo-interior-02.jpg   1536×2048  "KATRIBO / Welcome to our backyard" wall sign
        │   ├── katribo-staff.jpg         1536×2048  team behind the bar
        │   ├── katribo-bay-view.jpg      1536×460   crop of interior-01 (windows / bay)
        │   └── katribo-espresso-bar.jpg  1536×868   crop of interior-01 (espresso machine)
        └── reference/                    ← design references, never shown on the site
            ├── katribo-ui-reference.png
            ├── katribo-ui-reference-alt.png
            └── katribo-drinks-reference.png
```

## Visual guide
`assets/img/reference/katribo-asset-reference-v2.png` shows the intended look, lighting, cup placement and
background for every file below. It is a **guide only**:
- **Don't crop tiles out of it.** Each tile is only ~130×200 px.
- Its café tiles (interior, sign, staff, bay view, espresso bar) are re-renders. **The site keeps the original
  photos in `assets/img/shop/`.**
- The sheet labels the vanilla milkshake `yanilla-milkshake.jpg`. That's a typo; the file is `vanilla-milkshake.jpg`.

## Check your progress
Open **http://localhost/Katribo/tools/check-images.php** (or run `php tools/check-images.php`).
It lists every file with status **OK / LOW-RES / MISSING** against the sizes below.

## Current state (honest)
Every file in `drinks/` is a ~160 px tile cut from `katribo-drinks-reference.png`, enlarged 2× (Lanczos).
`hero-iced-coffee.jpg` is a 193×260 px crop of the UI mockup, enlarged 4×. **None of them are high-resolution.**

## 1. Hero — `assets/img/hero-iced-coffee.jpg`
| Spec | Value |
|---|---|
| Size | **1800 × 2400 px** (3:4 portrait). Minimum 1350 × 1800 |
| Format | JPG, quality ~82, target < 400 KB |
| Subject | One iced caramel-swirl coffee in a KATRIBO cup on a dark rock/surface |
| Background | Near-black (#080808–#151515), no props near the edges |
| Framing | Cup centred, rim ~12% from the top, base/rock in the bottom 20%. Edges fade out on the site, so keep 10% clear on each side |

## 2. Drink photos — `assets/img/drinks/` (27 files)
**One spec for all:** **1200 × 1500 px** (4:5 portrait), JPG quality ~82, target < 250 KB each.
- Same dark background, lighting and camera angle on every photo, so the grid looks consistent.
- Cup centred horizontally and roughly the same size in every frame (cup width ≈ 55–65% of the image).
- Top of the drink ~15% from the top edge, bottom of the cup ~85%.
- Cards crop to a square (1:1) and the gallery to a landscape tile, both focused at 35% from the top
  (`--drink-pos` in `style.css`). Keep everything important inside the middle 1200 × 1200 area.

| # | Filename (keep exactly) | Shown as |
|---|---|---|
| 1 | `americano.jpg` | Americano |
| 2 | `espresso.jpg` | Espresso |
| 3 | `cold-brew.jpg` | Cold Brew |
| 4 | `mocha.jpg` | Mocha |
| 5 | `iced-latte.jpg` | Iced Latte |
| 6 | `hot-latte.jpg` | Hot Latte |
| 7 | `spanish-latte.jpg` | Spanish Latte |
| 8 | `caramel-latte.jpg` | Caramel Latte |
| 9 | `vanilla-latte.jpg` | Vanilla Latte |
| 10 | `hazelnut-latte.jpg` | Hazelnut Latte |
| 11 | `matcha-latte.jpg` | Matcha Latte |
| 12 | `caramel-macchiato.jpg` | Caramel Macchiato (also Home "Featured" + gallery) |
| 13 | `brown-sugar-latte.jpg` | **Brown Sugar Macchiato** |
| 14 | `white-chocolate-mocha.jpg` | White Chocolate Mocha |
| 15 | `dark-mocha.jpg` | **Dark Mocha Macchiato** |
| 16 | `chocolate-milkshake.jpg` | Chocolate Milkshake |
| 17 | `vanilla-milkshake.jpg` | Vanilla Milkshake |
| 18 | `strawberry-milkshake.jpg` | Strawberry Milkshake |
| 19 | `matcha-milkshake.jpg` | Matcha Milkshake |
| 20 | `cookies-cream-milkshake.jpg` | **Cookies & Cream** (milkshake) |
| 21 | `mango-milkshake.jpg` | Mango Milkshake |
| 22 | `ube-milkshake.jpg` | Ube Milkshake |
| 23 | `caramel-milkshake.jpg` | Caramel Milkshake |
| 24 | `biscoff-latte.jpg` | Biscoff Latte |
| 25 | `hojicha-latte.jpg` | Hojicha Latte |
| 26 | `coffee-jelly-milkshake.jpg` | **Coffee Jelly** |
| 27 | `latte-art.jpg` | Gallery only ("Latte art"), hot latte seen from above |

Bold = the filename differs from the drink name. Keep the filename anyway.

### Not used on the site (no need to replace)
`cookies-cream.jpg`, `croissant.jpg`, `cookies.jpg`, `cheesecake.jpg`, `chocolate-cake.jpg`,
`muffin.jpg`, `coffee-beans.jpg`, `matcha-powder.jpg`, `chocolate.jpg`

## 3. Café photos — `assets/img/shop/`
These are KATRIBO's real photos and are already sharp enough. Replace only if you have
higher-resolution originals (same filenames; 2000 px or more on the long side).

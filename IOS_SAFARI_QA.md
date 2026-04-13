# iOS Safari QA (about 2 minutes)

Use this on a **real iPhone** after deploy. Playwright Mobile WebKit in CI is a **proxy only**; it does not reproduce Dynamic Island, safe-area quirks, or the collapsing URL bar.

**Before you start:** hard refresh or clear cache so updated `styles.css?v=` / `script.js?v=` load.

## Setup (developers, once per machine)

```bash
npm install
npx playwright install webkit
npm run test:e2e
```

Optional UI mode: `npm run test:e2e:ui`

### What automation already checks (Mobile WebKit, not iOS Safari)

`npm run test:e2e` runs **8** smoke tests at **iPhone 12** size: core layout, `--site-header-offset`, scrolled header class, bottom CTA + **body padding** when the bar shows, **hamburger → drawer → Contact** closes menu, **viewport-fit=cover**, hero **negative margin** under the fixed header (cream-band regression), and **#contact** anchor clearance. This is the closest automated stand-in we have; it is **not** a substitute for the device checklist below.

## Device checklist

### 1. Top of page

- Open the site home page (`/`). Meta viewport should include `viewport-fit=cover` (already in HTML).
- Confirm there is **no cream / off-white strip** between the fixed header and the orange hero (rubber-band overscroll briefly to check).

### 2. Scroll — header

- Scroll down past ~50px.
- Header should use the **solid scrolled** treatment on mobile (no obvious orange **bleeding through** the bar).

### 3. Past hero — bottom CTA

- Scroll until you are **below** the hero.
- The **mobile sticky CTA** bar should appear at the bottom.
- Scroll to the **footer**: last content should not sit **hidden** under the bar; spacing should look intentional, not a huge empty gap.

### 4. In-page links

- From the hero, tap **Book Me for Your Event** (or another link to `#contact`).
- The **Contact** section heading should land **below** the fixed header, not underneath it.

---

If something fails, note **iOS version**, **device model**, and whether it’s **portrait or landscape**, then compare with `npm run test:e2e` on desktop (catches broken layout/JS, not all Safari-only issues).

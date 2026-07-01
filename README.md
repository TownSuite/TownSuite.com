# TownSuite.com — 2026 Website

Marketing website for **TownSuite mERP®**, positioned as *"Canada's Operationally Sovereign Cloud for Municipalities."* TownSuite Municipal Software Inc. is a 100% Canadian‑owned, Canadian‑controlled private corporation (CCPC), founded in Gander, Newfoundland & Labrador in 1987, building one connected platform exclusively for Canadian municipalities.

**This folder is the site root** — every file here is served directly at `https://townsuite.com/` (e.g. `index.html` → `townsuite.com/index.html`). Pages link to each other with plain relative URLs (`href="about.html"`). Publish the contents of this folder as the web root; don't add files here that you don't want on the public site.

> History, wireframes, prior snapshots and the detailed engineering/deploy handoff live in the design project, not in this repo.

---

## 1. Site map

**Homepage** — `index.html` is a long‑scroll, 7‑chapter narrative:
`01 Intro → 02 Operationally Sovereign → 03 Modules → 04 TownSuite Intelligence → 05 Onboarding & Implementation → 06 Pricing → 07 Get started.`

**Module pages** (one connected platform; every module posts to Financial):

| Page | Module name (canonical) |
|---|---|
| `finance.html` | TownSuite Financial |
| `purchasing.html` | Purchasing & Inventory |
| `land.html` | Land Management |
| `maps.html` | Mapping |
| `hris.html` | People Management |
| `work-management.html` | Work Management |
| `asset-management.html` | Asset Management |
| `ebills.html` | eBills & ePayments |
| `point-of-sale.html` | Point of Sale |
| `epermitting.html` | ePermitting |
| `service-requests.html` | 311 Citizen Service Requests |
| `recreation.html` | Recreation & Facility Bookings |
| `intelligence.html` | TownSuite Intelligence |

**Narrative / evaluation pages:** `about.html`, `jobs.html` (Careers), `enhance.html` (module index), `big-picture.html` (85‑sec overview video), `procurement.html` (for procurement & IT), `faq.html`, `ai-assurance.html`, `accessibility.html`.

**Policy & system:** `privacy.html`, `cookies.html`, `404.html`, `500.html`, `311-embed.html` (the request form hosted inside the demo modal — `noindex`).

**Redirect stubs** (meta‑refresh + canonical; retired URLs kept for SEO equity, also mapped in `.htaccess`): `apps`, `challenge`, `cloud`, `contact`, `contact_map`, `edge`, `events`, `events-facilities`, `features`, `grid`, `home`, `partner-program`, `referrals`, `salesforce`, `status`, `try`, `widget`.

---

## 2. Design system

- **Voice / positioning:** operational sovereignty (data answers to Canadian law alone — distinct from mere data residency); Canadian‑owned & Canadian‑built since 1987; one connected platform, not a bundle. Hosting is *"Cirrus, Micrologic's cloud."*
- **Type:** self‑hosted **Dax** (`@font-face` in `styles.css`, `fonts/dax-regular.woff2`). No external font calls.
- **Color tokens** (in `styles.css`, light + dark via `data-theme`): primary blue `#00578E` / deep `#003C63`; accents orange `#E48D1A`, green `#2DA343`, red `#E03A3E`; the maple/emblem mark reuses these. Tints use `color-mix()`.
- **Theme:** light/dark toggle; persisted in `localStorage` under `ts-theme`.
- **Trademark symbol:** render every ® as `<span class="rtm">®</span>` (shared rule in `styles.css`) so it sits as a superscript. Plain‑text contexts that can't hold a span — `<title>`, `<meta>`, OG/Twitter, `aria-label`, JSON‑LD — keep a normal `®` glyph.
- **Chrome:** the top bar + footer markup is **duplicated per page** (each module/policy page carries its own inline `.pp-top` header and `.ts-footer`). Cross‑cutting footer/nav edits must be applied across all pages (script it).
- **Motion:** entrance/scroll reveals and the interactive diagrams are all gated behind `prefers-reduced-motion`.

---

## 3. Shared assets & scripts

- `styles.css` — global tokens, type, layout, footer, chat dock. Loaded by every page.
- `expanded.css`, `appshot.css` — homepage‑only (below‑the‑fold chapters; hero app‑shot mock).
- `site.js` — homepage engine: theme toggle, scroll journey/chapter rail, module wire‑map hooks, chat open, and the **book‑a‑demo modal**.
- `demo-modal.js` — the same demo modal for the lean/module/policy pages that don't load `site.js`. Guarded so it never double‑binds.
- `embed.js` — the live **"Ask TownSuite" / TownSuite Intelligence** chat dock. In production it loads from the chat instance and calls `data-api="https://tschat-prod.yqx.auto.k8s.townsuite.com"`.
- `modules-connect.js` — interactive module connection map on the homepage.
- `onboarding-flow.js`, `sovereign-tour.js`, `proto-launch.js`, `logo-anim.js` — homepage animations / the interactive portal demo.
- `311-embed.html` — the live 311 request widget, shown in an iframe inside the demo modal.
- SEO/infra: `.htaccess` (301 map, gzip/brotli, cache headers), `robots.txt`, `sitemap.xml`, `llms.txt`, `.well-known/`, `favicon.ico`, `emblem.svg`, `og-townsuite-merp.png`.

### "Book a demo" flow (important)
Every **"Book a demo"** CTA opens the in‑page request modal, which hosts `311-embed.html`. Triggers are delegated in both `site.js` and `demo-modal.js` and match `[data-demo-open]`. A button can **deep‑link to a specific 311 category** by giving it a value: `data-demo-open="Card Name"` (the card names live in the production 311 widget). Do **not** point demo CTAs at `mailto:` — email should only fire from an explicit, visible email‑address link.

---

## 4. Contact facts (keep consistent)

- Phone (display): **1.800.408.3313** · dialable `tel:18004083313`.
- Address: **216 Airport Blvd, Gander, NL Canada A1V 1L6**.
- Emails by context: `marketing@` (sales/demo), `privacy@` (privacy officer), `jobs@` (careers).
- Canadian spelling throughout (*datacentre, behaviour, optimised*).
- Legal line: *"TownSuite® and mERP® are registered trademarks of TownSuite Municipal Software Inc."*

---

## 5. Editing conventions

- Keep the per‑page footer/nav in sync — changes are usually applied across all `*.html` at once.
- Preserve `data-screen-label` on each `<body>`/section as the human page name (used by review tooling).
- Per‑page JSON‑LD (`Organization`, `SoftwareApplication`, `BreadcrumbList`, `FAQPage`) should mirror the visible copy — update both together.
- Don't hard‑delete public pages; retire via a redirect stub + `.htaccess` 301 (see `features.html`).

---

## 6. Launch checklist

- Live smoke‑test the **AI chat dock** and the **311 request form** against the production chat instance (they call external services and can't be exercised in a static preview).
- Confirm `.htaccess` (compression, caching, 301s) is honored by the production host.
- Optional build step: serve hero/team imagery as WebP/AVIF (currently JPEG).

*Last updated: July 2026.*

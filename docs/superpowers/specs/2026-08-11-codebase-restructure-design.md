# Codebase Restructure & Maintainability Pass — Design

Date: 2026-08-11
Status: Approved by user, ready for planning

## 1. Purpose

The Spark Point Infotech website works and looks correct today, but the source is organized as a small number of very large files:

- `index.html` — 1,399 lines, every page section inline in one file
- `src/main.js` — 973 lines, all JS (3D scenes, animations, forms, loading screen) in one file
- `src/style.css` — 194 lines, all component styles in one file
- `admin.html` — 1,076 lines, outside the Vite build entirely (CDN Tailwind, inline `<script>`/`<style>`)
- `server/app.js` — 502 lines, ~25 Express routes defined inline alongside app setup

This makes the codebase hard to navigate and risky to change: any edit to one section requires scrolling past unrelated code, and there's no clear place to add new code.

**Goal of this pass:** reorganize the code into small, single-purpose files with clear boundaries, with zero change to visible content, theme, copy, or existing animation timing. A secondary, explicitly-approved goal is to fix real performance waste (things running when they don't need to) without changing how anything looks or behaves. A third, explicitly-approved goal is to fix three specific backend hardening gaps found during review (§6a) — these touch edge-case/abuse behavior, not normal user-facing behavior.

**On adding a framework (React, etc.):** considered and explicitly rejected for this pass. This site is animation/3D-driven (GSAP + Three.js manipulate the DOM imperatively) and recently had significant SEO/AEO/GEO investment that depends on static, crawlable HTML — a framework migration (especially one needing SSR/SSG to preserve that SEO work) is a rewrite, not a restructure, and contradicts "don't change anything." Vanilla JS + Vite, cleanly modularized, meets the maintainability goal without that risk. Revisit only if the site grows genuinely app-like (logged-in portal, real-time dashboards, complex client state).

**Explicitly out of scope:** content/copy changes, color/theme/typography changes, new animations or retimed motion, new features, changes to API contracts, changes to database behavior.

## 2. Scope

Full-stack: main site frontend, admin panel, and backend.

1. Main site frontend: `index.html`, `src/main.js`, `src/style.css`
2. Admin panel: `admin.html` — brought into the same Vite build pipeline (currently uses Tailwind CDN and lives outside Vite entirely)
3. Backend: `server/app.js` (route/middleware split). `server/db.js` is explicitly left as-is (see §6).

`server/index.js` and `api/index.js` are not touched — both just import `app.js`'s default export, and that export keeps working identically.

## 3. "Smooth UI" — what it means for this pass

Clarified with the user: this pass targets **performance smoothness** (eliminating wasted CPU/battery — e.g. 3D scenes rendering while off-screen, unthrottled resize/scroll handlers) and **code structure**, not UI feel. No motion timing, easing, or visual/interaction redesign. This keeps the pass aligned with "don't change content, theme, or anything."

## 4. Design

### 4.1 Frontend markup: build-time HTML includes

Both `index.html` and `admin.html` are split into per-section partial files, reassembled at build time by a small custom Vite plugin (`<!--@include path-->` comment markers, resolved recursively via Vite's `transformIndexHtml` hook). No new npm dependency.

```
src/partials/
  head.html
  nav.html
  footer.html
  sections/
    loading-screen.html
    hero.html
    karaoke.html
    services.html
    industries.html
    process.html
    engagements.html
    about.html
    faq.html
    careers.html
    contact.html
  admin/
    <admin.html's sections, same treatment>
```

`index.html` and `admin.html` become short skeleton files containing `<!--@include ...-->` markers instead of inline markup. The plugin resolves these identically in `vite dev` and `vite build`, so the shipped HTML (`dist/index.html`) is byte-for-byte the same as today's output — no impact on SEO/AEO crawling, which was recently and deliberately optimized.

Rejected alternatives:
- **Established include plugin (e.g. `posthtml-include`)** — same effect, but adds a dependency and less transparency for a ~30-line problem. Not worth it here.
- **Runtime `fetch()`-based partial loading** — would remove content from the initial static HTML, directly undermining the site's recent SEO/AEO/GEO work. Rejected.

### 4.2 Frontend JS: `src/main.js` → `src/js/*`

```
src/js/
  three/
    iphone-model.js      (~400 lines — the 3D phone mesh builder)
    hero-scene.js
    cta-scene.js
  animations/
    karaoke.js
    timeline-scrubber.js
    cta-doors.js
    faq-accordion.js
  forms/
    contact-form.js
    talent-form.js
    submit-helper.js     (shared fetch/status-message logic, currently duplicated between the two forms)
  loading-screen.js
  admin/
    <admin.html's inline script, split by concern the same way>
src/main.js               (thin entry point: imports + DOMContentLoaded wiring only, ~40-60 lines)
```

Each module exports an `init...()` function; `main.js`'s only job is to call them in the right order on `DOMContentLoaded`.

Performance fixes bundled into this split (approved as in-scope "smoothness," not UI-feel changes):
- Hero and CTA Three.js render loops pause (`IntersectionObserver`) when their canvas is scrolled off-screen, instead of running `requestAnimationFrame` forever
- `resize` handler is debounced
- Karaoke `scroll` handler is batched to `requestAnimationFrame` instead of running on every scroll event
- `cta-scene.js` and `talent-form.js` (below-the-fold) load via dynamic `import()` so they're not in the initial JS payload

None of these change what the user sees or how animations look/time — only when work is allowed to happen.

### 4.3 CSS: `src/style.css` → `src/styles/*`

```
src/styles/
  main.css              (@tailwind directives + imports below)
  base.css
  components/
    glass.css
    buttons.css
    bento.css
    timeline.css
    faq.css
    cta-doors.css
    whatsapp-button.css
```

Implementation note (found during Task 5 of the frontend plan, not known at design time): `@import` must precede `@tailwind` directives in `main.css` (a CSS-spec constraint), and component files must be wrapped in `@layer utilities { }` to preserve the original file's cascade order — see the frontend plan's Task 5 for the corrected, verified version. This doesn't change the file layout above, only the exact contents of `main.css` and each component file.

Purely mechanical split — same selectors, same rules, same cascade order, just grouped by component instead of concatenated in one file.

### 4.4 Backend: `server/app.js` → routes/middleware split

```
server/
  app.js                 (thin: express() setup, middleware mounting, router mounting only)
  middleware/
    auth.js              (authMiddleware — updated per §6a fix #1, requires JWT_SECRET)
    rate-limit.js         (new — §6a fix #3, applied only to contact/talent/login routes)
  routes/
    health.js
    contact.js
    talent.js
    auth.js
    submissions.js
    export.js
  db.js                  (unchanged, aside from the startup warning in §6a fix #2)
```

`server/index.js` (local dev listener) and `api/index.js` (Vercel serverless entry) are untouched; both just `import app from './app.js'` / `'../server/app.js'`, and that default export's shape doesn't change.

**`server/db.js` is explicitly left as one file.** It already has a single responsibility (data access) behind a clean function API (`dbRun`, `dbAll`, `getAdminPassword`, `setAdminPassword`, `initDb`) used identically by all routes. It has three internal modes (Postgres / SQLite / JSON-file fallback for Vercel-without-DB). Splitting those into adapter files is a real refactor with behavior risk (DB connection/query logic) for a smaller maintainability payoff than the `app.js` split. Listed as a future suggestion (§6), not part of this pass.

## 5. Teaching approach

Per user preference, three things happen during implementation:
1. **Explain as I go** — short plain-English notes at each major step on *why* the code is organized that way (e.g. why routes are split from app setup, how the include plugin resolves markers).
2. **Written guide at the end** — a short `ARCHITECTURE.md` documenting the new folder structure, the patterns used, and where to add new code in the future.
3. **Code comments on non-obvious parts only** — e.g. the include-plugin's recursive resolution, the DB mode fallback logic. Not line-by-line narration.

## 6. Suggestions (not applied unless requested separately)

These were raised during design but are explicitly **not** part of this pass — they'd change behavior/accessibility, not just structure:

- `prefers-reduced-motion` fallback for the Three.js scenes and CTA-door transition — the project's own `design.md` calls for this but it isn't implemented today
- Accessibility: visible focus rings, `aria-expanded` on the FAQ accordion, proper label/error semantics on the contact/talent forms
- Splitting `server/db.js` into per-mode adapter files behind the same public API

## 6a. Hardening fixes (added to scope — user requested these be fixed)

Three concrete issues were found while reviewing `server/app.js` and `server/db.js` and the user asked to fix all of them as part of this pass. These are small, targeted, behavior-preserving-for-legitimate-use fixes — they change what happens in edge cases (missing config, abuse) not normal operation:

1. **Hardcoded JWT fallback secret** — [server/app.js:16](server/app.js#L16) falls back to a literal string if `JWT_SECRET` isn't set, which is a forgeable-admin-token risk in production if the env var is ever missing.
   - Fix: `middleware/auth.js` requires `JWT_SECRET` from the environment. In production (`NODE_ENV=production` or `process.env.VERCEL`), missing `JWT_SECRET` fails fast at startup with a clear error instead of silently using a guessable default. In local dev, if it's missing, generate a random per-process secret and log a one-line warning (so `npm run dev` still works out of the box, but nobody can rely on a fixed guessable value).
   - Add `JWT_SECRET` to `.env.example` with a comment.

2. **Non-durable fallback storage on Vercel** — when no `DATABASE_URL`/`POSTGRES_URL` is set, `server/db.js` writes submissions to `/tmp`, which Vercel does not guarantee persists between invocations. This fails silently today (writes appear to succeed, data can vanish).
   - Fix: at startup, if running on Vercel (`process.env.VERCEL`) with no `DATABASE_URL` configured, log a loud warning identifying the risk. No behavior change for anyone with `DATABASE_URL` set (which the project's Supabase migration implies is the intended production setup) — this only makes an already-fragile misconfiguration visible instead of silent.

3. **No rate limiting on public endpoints** — `POST /api/contact` and `POST /api/talent` (form spam risk) and `POST /api/auth/login` (brute-force risk on the admin password) have no request throttling.
   - Fix: add `express-rate-limit` (one new, widely-used dependency) as middleware on those three routes specifically — not applied globally, so normal admin dashboard usage (GETs, exports) is unaffected.

## 7. Success criteria

- `npm run build` and `npm run dev` both work exactly as before; `dist/index.html` and `dist/admin.html` are visually and behaviorally identical to today's build
- All existing routes/API contracts respond identically for legitimate requests (same URLs, same request/response shapes) — the only new response shape is a `429` from the three rate-limited routes under abuse, which didn't exist before
- All existing animations, 3D scenes, forms, and the FAQ accordion behave identically to a user
- No file in `src/js/`, `src/styles/`, `server/routes/` exceeds roughly 150-200 lines (the `iphone-model.js` 3D mesh builder is the expected exception, since it's one cohesive geometry-construction routine)
- A new contributor can find "where does the contact form submit handler live" or "where is the FAQ route defined" without grep — the folder name tells them
- With `JWT_SECRET` and `DATABASE_URL` set (as `.env.example` documents), server startup is silent; with either missing, a clear warning/error identifies exactly what's missing and why it matters

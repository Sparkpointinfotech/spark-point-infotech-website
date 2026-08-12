# Architecture

This documents how the codebase is organized and where to add new code. It's written for whoever touches this repo next — including future you.

## Frontend build

Vite builds two HTML entry points: `index.html` (main site) and `admin.html` (admin dashboard). Both use a small custom Vite plugin (`vite-plugin-html-includes.js`) that resolves `<!--@include some/file.html-->` comment markers by inlining the referenced file, recursively, at both `vite dev` and `vite build` time. This means the *shipped* HTML is always one fully-inlined file (important for SEO — crawlers see the same markup they always did), while the *source* is split into small per-section files under `src/partials/` (main site) and `src/partials/admin/` (admin).

To add a new page section: create `src/partials/sections/your-section.html` as a complete, self-contained fragment (its own opening/closing tag included), then add `<!--@include sections/your-section.html-->` to `index.html` where it should appear.

The include plugin has cycle detection (a partial that includes itself throws a clear error instead of hanging) and a dev-server watcher (editing a partial during `npm run dev` triggers a full reload, since partials aren't otherwise part of Vite's module graph).

## Frontend JavaScript

`src/main.js` is intentionally thin — it only imports `init...()` functions from `src/js/*` and calls them on `DOMContentLoaded`. All actual logic lives in focused modules:

- `src/js/three/` — the Three.js hero scene, CTA scene, and the shared 3D phone model they both build from (`iphone-model.js`). Both scenes pause their render loop via `IntersectionObserver` when their section scrolls out of view, and debounce their resize handlers.
- `src/js/animations/` — GSAP/scroll-driven effects (karaoke text, timeline scrubber, CTA doors, FAQ accordion). Karaoke's scroll handler is batched to one DOM update per animation frame.
- `src/js/forms/` — the contact and talent form submit handlers, sharing common fetch/status-message logic via `submit-helper.js`
- `src/js/admin/` — the admin dashboard's logic, split by concern (`auth.js`, `data.js`, `export.js`, `modals.js`, `utils.js`), sharing dashboard state via `state.js`, wired together by `dashboard.js`. Note `auth.js` and `data.js` import from each other (auth's `handleLogin` calls `loadAllSubmissions`; data's `loadAllSubmissions` calls `checkAuth`) — this is a safe circular import because neither side is touched at module-evaluation time, only inside functions that run later in response to user actions.
- `src/js/utils/` — small stateless helpers with no DOM/page-specific knowledge (e.g. `debounce.js`)

To add a new interactive behavior: create a new file in the most relevant folder above, export an `init...()` function, import and call it from `src/main.js` (or `dashboard.js` for admin-only behavior).

**A note on `admin.html`'s inline `onclick="..."` attributes:** they still work because `src/js/admin/dashboard.js` explicitly assigns the functions those attributes call onto `window` (classic non-module scripts do this automatically; ES modules don't). If you add a new inline handler in admin markup, its function needs the same `window.yourFunction = yourFunction;` treatment in `dashboard.js`.

**Below-the-fold code-splitting:** the CTA scene's module and the talent form's module are loaded via dynamic `import()` from `src/main.js` rather than a static import, since both are below the fold and don't need to be in the initial JS payload.

## CSS

`src/styles/main.css` (main site) and `src/styles/admin.css` (admin) each carry their own `@tailwind` directives — they're independent Tailwind builds, not because the design differs, but because `admin.html` and `index.html` are separate Vite entry points. Shared design tokens (`accent`, `accentGlow`, etc.) live once in `tailwind.config.js`. Admin-specific background colors that don't match the main site's exact shades are namespaced (`adminBgDark`, `adminSurfaceDark`, `adminSurfaceCard`) rather than overloading the main site's token names — this keeps each page's exact colors intact without one config silently overriding the other.

Component-specific CSS (things Tailwind's utility classes don't cover — glass-panel blur effects, the karaoke word-highlight transition, etc.) lives one file per component under `src/styles/components/`, imported from `main.css`. **Convention:** wrap a new component file's rules in `@layer utilities { }` so they share Tailwind's cascade layer (see the comment block at the top of `main.css` for the full explanation and the two documented exceptions).

## Backend

`server/app.js` only does Express app setup — CORS, body parsing, static file serving, the `/admin` redirect, and the legacy-URL-prefix normalizer (so `/contact` and `/api/contact` both work, which Vercel's routing relies on) — then mounts one router per concern from `server/routes/`:

- `health.js` — API root + health check
- `contact.js` / `talent.js` — the two public form-submission endpoints
- `auth.js` — login, token verification, password change
- `submissions.js` — admin CRUD over stored submissions
- `export.js` — CSV/JSON export endpoints

`server/middleware/auth.js` holds the JWT verification middleware and JWT secret resolution — required in production (fails fast at startup if missing), auto-generated with a warning in local dev, never a hardcoded fallback. `server/middleware/rate-limit.js` holds the two `express-rate-limit` instances applied to the contact, talent, and login routes.

`server/db.js` is deliberately left as one file — it's already a single-responsibility data-access layer (`dbRun`, `dbAll`, `getAdminPassword`, `setAdminPassword`, `initDb`) used identically by every route, with three internal modes (Postgres, SQLite, and a JSON-file fallback for Vercel-without-a-database). It now logs a startup warning if the risky fallback mode is active on Vercel with no database configured.

To add a new API endpoint: create (or add to) a file in `server/routes/`, export an Express `Router`, mount it in `server/app.js`. If it needs to be admin-only, add `authMiddleware` from `server/middleware/auth.js`. If it's a public endpoint that accepts user input, consider `publicFormLimiter` from `server/middleware/rate-limit.js`.

`server/index.js` (local dev) and `api/index.js` (Vercel serverless) both just import `server/app.js`'s default export — neither needs to change when routes are added or moved.

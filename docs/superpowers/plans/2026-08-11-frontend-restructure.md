# Frontend Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `index.html` (1,399 lines), `src/main.js` (973 lines), `src/style.css` (194 lines), and `admin.html` (1,076 lines, currently outside the build) into small, single-purpose files, with zero visible change to content, theme, or animation behavior — plus four targeted performance fixes (pause off-screen 3D rendering, debounce resize, batch scroll handling, code-split below-the-fold JS).

**Architecture:** A small custom Vite plugin resolves `<!--@include path-->` markers at build/dev time, so `index.html`/`admin.html` become short skeletons that assemble partial files from `src/partials/`. `src/main.js` becomes a thin entry point importing `init...()` functions from `src/js/*` modules. `admin.html` moves off CDN Tailwind onto the same compiled Tailwind pipeline as the main site, with its own scoped color tokens to avoid changing its look.

**Tech Stack:** Vite 5, vanilla JS (ES modules), Tailwind CSS, Three.js, GSAP + ScrollTrigger. No new runtime dependencies.

**Reference doc:** `docs/superpowers/specs/2026-08-11-codebase-restructure-design.md`

---

## Before you start

This plan moves existing, working code — it does not rewrite logic (except the 4 named performance fixes, which are called out explicitly wherever they apply). The verification strategy leans on **diffing built output against a baseline**, not just "looks right," so regressions are caught mechanically.

Work through tasks in order — each depends on the file layout the previous one created. Commit after each task.

---

### Task 0: Capture a baseline build for diffing

**Files:**
- Create (untracked, outside git): `/tmp/spi-baseline-dist/`

- [ ] **Step 1: Build the current site and stash a copy of the output**

```bash
npm run build
rm -rf /tmp/spi-baseline-dist
cp -r dist /tmp/spi-baseline-dist
```

Expected: `dist/index.html` and `dist/admin.html` exist inside `/tmp/spi-baseline-dist`.

This baseline is what every later "verify the build didn't change" step diffs against. It lives outside the repo (`/tmp`) so it's never accidentally committed.

---

### Task 1: Build the HTML-include Vite plugin

**Files:**
- Create: `vite-plugin-html-includes.js`
- Modify: `vite.config.js`

- [ ] **Step 1: Write the plugin**

```js
// vite-plugin-html-includes.js
import fs from 'node:fs';
import path from 'node:path';

const INCLUDE_RE = /<!--\s*@include\s+([^\s]+?)\s*-->/g;

/**
 * Resolves <!--@include some/file.html--> markers by inlining the referenced
 * file's contents, relative to `partialsRoot`. Runs recursively, so an
 * included partial may itself contain further @include markers.
 */
export default function htmlIncludes(partialsRoot = 'src/partials') {
  const root = path.resolve(process.cwd(), partialsRoot);

  function resolve(html) {
    return html.replace(INCLUDE_RE, (_match, includePath) => {
      const filePath = path.join(root, includePath);
      const partial = fs.readFileSync(filePath, 'utf-8');
      return resolve(partial);
    });
  }

  return {
    name: 'html-includes',
    transformIndexHtml(html) {
      return resolve(html);
    }
  };
}
```

- [ ] **Step 2: Wire it into `vite.config.js`**

Modify `vite.config.js` — add the import and register the plugin:

```js
import { defineConfig } from 'vite';
import htmlIncludes from './vite-plugin-html-includes.js';

export default defineConfig({
  plugins: [htmlIncludes()],
  server: {
```

(Keep everything else in `vite.config.js` — `server`, `build`, `esbuild` — exactly as it is today; only the `import` line and the new `plugins: [htmlIncludes()]` line are added.)

- [ ] **Step 3: Verify it's a no-op so far**

Neither `index.html` nor `admin.html` contains an `@include` marker yet, so this step should change nothing.

```bash
npm run build
diff -r /tmp/spi-baseline-dist dist
```

Expected: no output (empty diff).

- [ ] **Step 4: Commit**

```bash
git add vite-plugin-html-includes.js vite.config.js
git commit -m "build: add html-includes Vite plugin (unused until markup split)"
```

---

### Task 2: Split `index.html` into partials

**Files:**
- Create: `src/partials/head.html`, `src/partials/loading-screen.html`, `src/partials/background-layers.html`, `src/partials/nav.html`, `src/partials/sections/hero.html`, `src/partials/sections/karaoke.html`, `src/partials/sections/services.html`, `src/partials/sections/industries.html`, `src/partials/sections/process.html`, `src/partials/sections/engagements.html`, `src/partials/sections/about.html`, `src/partials/sections/faq.html`, `src/partials/sections/careers.html`, `src/partials/sections/contact.html`, `src/partials/footer.html`, `src/partials/whatsapp-button.html`
- Modify: `index.html`

`index.html` already has clear `<!-- ==== SECTION N ==== -->` comment markers around every logical chunk. Each partial below is extracted as a **complete, self-contained fragment** (including its own opening/closing tag), using the exact current line numbers as the source of truth — copying markup by hand risks typos, so this uses `sed` instead.

- [ ] **Step 1: Create the destination folders**

```bash
mkdir -p src/partials/sections
```

- [ ] **Step 2: Extract every partial with `sed`**

Run each line exactly as shown (source: today's `index.html`, before any edits):

```bash
sed -n '5,218p'   index.html > src/partials/head.html
sed -n '224,268p' index.html > src/partials/loading-screen.html
sed -n '270,272p' index.html > src/partials/background-layers.html
sed -n '274,302p' index.html > src/partials/nav.html
sed -n '304,377p' index.html > src/partials/sections/hero.html
sed -n '382,389p' index.html > src/partials/sections/karaoke.html
sed -n '391,621p' index.html > src/partials/sections/services.html
sed -n '623,692p' index.html > src/partials/sections/industries.html
sed -n '694,803p' index.html > src/partials/sections/process.html
sed -n '805,855p' index.html > src/partials/sections/engagements.html
sed -n '857,939p' index.html > src/partials/sections/about.html
sed -n '941,1110p' index.html > src/partials/sections/faq.html
sed -n '1112,1210p' index.html > src/partials/sections/careers.html
sed -n '1212,1322p' index.html > src/partials/sections/contact.html
sed -n '1324,1385p' index.html > src/partials/footer.html
sed -n '1389,1395p' index.html > src/partials/whatsapp-button.html
```

Expected: 16 new files, none empty. Sanity check line counts:

```bash
wc -l src/partials/head.html src/partials/loading-screen.html src/partials/background-layers.html src/partials/nav.html src/partials/sections/*.html src/partials/footer.html src/partials/whatsapp-button.html
```

Expected total across all 16 files: 1,367 lines (this is less than 1,399 because the section-comment lines, the `<main>` wrapper, and structural boilerplate stay in the skeleton, not the partials).

- [ ] **Step 2.5: Tell Tailwind to scan the new partial files**

Tailwind's JIT compiler only sees classes in files matched by `tailwind.config.js`'s `content` array — today that's `["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`. Once markup moves into `src/partials/`, none of those `.html` files are scanned, so their utility classes get silently dropped from the compiled CSS (a real, visible regression, not a whitespace nit).

In `tailwind.config.js`, change:
```js
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
```
to:
```js
  content: [
    "./index.html",
    "./src/partials/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
```

This glob is recursive, so it also covers `src/partials/admin/*.html` once Task 7 creates that folder — Task 7 does not need its own separate content-glob change.

- [ ] **Step 3: Replace `index.html` with the skeleton**

Overwrite `index.html` with:

```html
<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">

<head>
<!--@include head.html-->
</head>

<body
  class="bg-bgDark text-textMuted antialiased selection:bg-accent/30 selection:text-accent bg-noise relative min-h-screen font-sans">

  <!--@include loading-screen.html-->

  <!--@include background-layers.html-->

  <!--@include nav.html-->

  <!--@include sections/hero.html-->

  <!-- ==================== MAIN PAGE CONTENT ==================== -->
  <main class="relative z-20 bg-bgDark">

    <!--@include sections/karaoke.html-->

    <!--@include sections/services.html-->

    <!--@include sections/industries.html-->

    <!--@include sections/process.html-->

    <!--@include sections/engagements.html-->

    <!--@include sections/about.html-->

    <!--@include sections/faq.html-->

    <!--@include sections/careers.html-->

    <!--@include sections/contact.html-->

    <!--@include footer.html-->

  </main>

  <!--@include whatsapp-button.html-->

  <script type="module" src="/src/main.js"></script>
</body>

</html>
```

- [ ] **Step 4: Verify the build is byte-identical to baseline**

```bash
npm run build
diff /tmp/spi-baseline-dist/index.html dist/index.html
```

Expected: no output. If there's a diff, it's almost always a whitespace difference at an include boundary (blank line before/after a marker) — compare visually and adjust the partial's leading/trailing blank lines to match, then re-run the diff.

- [ ] **Step 5: Also confirm the dev server renders it**

```bash
npm run dev
```

Open `http://localhost:3000`, confirm the page looks identical to before (hero, all sections, footer, WhatsApp button). Stop the dev server (Ctrl+C) when done.

- [ ] **Step 6: Commit**

```bash
git add index.html src/partials
git commit -m "refactor: split index.html into per-section partials"
```

---

### Task 3: Split `src/main.js` into modules (pure move, no behavior change yet)

**Files:**
- Create: `src/js/loading-screen.js`, `src/js/three/iphone-model.js`, `src/js/three/hero-scene.js`, `src/js/three/cta-scene.js`, `src/js/animations/karaoke.js`, `src/js/animations/timeline-scrubber.js`, `src/js/animations/cta-doors.js`, `src/js/animations/faq-accordion.js`, `src/js/forms/submit-helper.js`, `src/js/forms/contact-form.js`, `src/js/forms/talent-form.js`
- Modify: `src/main.js`

This task is a **pure move** — every function's body is copied verbatim from today's `src/main.js`. The performance fixes (IntersectionObserver pause/resume, debounce, rAF batching, dynamic `import()`) are applied separately in Task 4, so this task's correctness can be verified on its own first.

**Why `createAuthenticIPhoneMesh` gets its own file:** both the hero scene and the CTA scene call it to build their 3D phone model, so it can't live inside either scene file — it needs to be a shared module both import from.

**Why the original `onWindowResize()` becomes two functions:** today, one function reaches into both the hero scene's and the CTA scene's camera/renderer variables. Once those scenes are separate files, that cross-file reaching-in is exactly the kind of coupling a good module boundary avoids — so each scene gets its own resize handler for its own camera/renderer. Both still listen for the same native `resize` event independently; the net effect on screen is identical.

- [ ] **Step 1: Create the folders**

```bash
mkdir -p src/js/three src/js/animations src/js/forms
```

- [ ] **Step 2: Create `src/js/loading-screen.js`**

```js
export function initLoadingScreen() {
  const loadingBar = document.getElementById('loading-bar');
  const loadingPercent = document.getElementById('loading-percent');
  const loadingScreen = document.getElementById('loading-screen');
  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 6) + 3;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      if (loadingBar) loadingBar.style.width = '100%';
      if (loadingPercent) loadingPercent.innerText = '100%';

      setTimeout(() => {
        if (loadingScreen) {
          loadingScreen.style.opacity = '0';
          loadingScreen.style.pointerEvents = 'none';
        }
      }, 500);
    } else {
      if (loadingBar) loadingBar.style.width = `${progress}%`;
      if (loadingPercent) loadingPercent.innerText = `${progress}%`;
    }
  }, 40);
}
```

(Verbatim copy of today's `src/main.js:11-36`, exported instead of module-private.)

- [ ] **Step 3: Create `src/js/three/iphone-model.js`**

Copy today's `src/main.js:41-414` verbatim (the `createRoundedCornerShape`, `createDynamicScreenTexture`, and `createAuthenticIPhoneMesh` functions), then add the import at the top and export only the one function other modules call:

```js
import * as THREE from 'three';

// ... createRoundedCornerShape, createDynamicScreenTexture, createAuthenticIPhoneMesh
// pasted verbatim from src/main.js:41-414 ...
```

At the function signature, change:
```js
function createAuthenticIPhoneMesh() {
```
to:
```js
export function createAuthenticIPhoneMesh() {
```

`createRoundedCornerShape` and `createDynamicScreenTexture` stay un-exported (`function`, not `export function`) — nothing outside this file calls them.

- [ ] **Step 4: Create `src/js/three/hero-scene.js`**

```js
import * as THREE from 'three';
import { gsap } from 'gsap';
import { createAuthenticIPhoneMesh } from './iphone-model.js';

let heroScene, heroCamera, heroRenderer, phoneGroup, ring1, ring2, particlesMesh;

export function initHeroThreeCanvas() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const isMobile = window.innerWidth < 768;
  const maxPixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5);

  heroScene = new THREE.Scene();
  heroScene.fog = new THREE.FogExp2(0x020202, 0.045);

  heroCamera = new THREE.PerspectiveCamera(26, window.innerWidth / window.innerHeight, 0.1, 100);
  heroCamera.position.set(0, 0, 15);

  heroRenderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  heroRenderer.setSize(window.innerWidth, window.innerHeight);
  heroRenderer.setPixelRatio(maxPixelRatio);
  if (!isMobile) {
    heroRenderer.shadowMap.enabled = true;
    heroRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  container.appendChild(heroRenderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  heroScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
  dirLight.position.set(5, 10, 7);
  if (!isMobile) dirLight.castShadow = true;
  heroScene.add(dirLight);

  const pointLight1 = new THREE.PointLight(0x8B5CF6, 3.5, 20);
  pointLight1.position.set(-4, 2, 4);
  heroScene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xA855F7, 3, 20);
  pointLight2.position.set(4, -2, 4);
  heroScene.add(pointLight2);

  const particleCount = isMobile ? 400 : 800;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    pPos[i] = (Math.random() - 0.5) * 30;
    pPos[i + 1] = (Math.random() - 0.5) * 30;
    pPos[i + 2] = (Math.random() - 0.5) * 20;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.04,
    color: 0xA855F7,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });
  particlesMesh = new THREE.Points(pGeo, pMat);
  heroScene.add(particlesMesh);

  phoneGroup = createAuthenticIPhoneMesh();
  heroScene.add(phoneGroup);

  const ringGeo1 = new THREE.TorusGeometry(4.2, 0.015, 16, 100);
  const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x8B5CF6, transparent: true, opacity: 0.4 });
  ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  ring1.rotation.x = Math.PI / 3;
  heroScene.add(ring1);

  const ringGeo2 = new THREE.TorusGeometry(4.8, 0.012, 16, 100);
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xA855F7, transparent: true, opacity: 0.3 });
  ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.y = Math.PI / 4;
  heroScene.add(ring2);

  phoneGroup.rotation.x = 0.12;
  phoneGroup.rotation.y = -0.18;

  window.addEventListener('resize', onHeroResize);

  const clock = new THREE.Clock();

  function animateHero() {
    requestAnimationFrame(animateHero);

    if (window.scrollY > window.innerHeight * 4.5) return;

    const elapsedTime = clock.getElapsedTime();

    if (particlesMesh) particlesMesh.rotation.y = elapsedTime * 0.03;
    if (ring1) ring1.rotation.z = elapsedTime * 0.15;
    if (ring2) ring2.rotation.x = elapsedTime * 0.12;

    if (heroRenderer && heroScene && heroCamera) {
      heroRenderer.render(heroScene, heroCamera);
    }
  }

  animateHero();
  setupHeroScrollAnimation();
}

function onHeroResize() {
  if (!heroCamera || !heroRenderer) return;
  heroCamera.aspect = window.innerWidth / window.innerHeight;
  heroCamera.updateProjectionMatrix();
  heroRenderer.setSize(window.innerWidth, window.innerHeight);
}

function setupHeroScrollAnimation() {
  const heroContent = document.getElementById('hero-content');
  const pop1 = document.getElementById('popover-1');
  const pop2 = document.getElementById('popover-2');
  const pop3 = document.getElementById('popover-3');

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero-section',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    }
  });

  if (heroContent) {
    tl.to(heroContent, { opacity: 0, y: -30, duration: 0.25 }, 0);
  }

  tl.to(phoneGroup.rotation, { x: 0.22, y: 0.58, z: -0.1, duration: 1 }, 0)
    .to(phoneGroup.position, { x: 1.4, y: 0, z: 1, duration: 1 }, 0)
    .to(heroCamera, { fov: 24, onUpdate: () => heroCamera.updateProjectionMatrix(), duration: 1 }, 0)
    .to(pop1, { opacity: 1, y: 0, duration: 0.3 }, 0.2)
    .to(pop1, { opacity: 0, y: -20, duration: 0.3 }, 1.1);

  tl.to(phoneGroup.rotation, { x: -0.18, y: Math.PI + 0.25, z: 0.12, duration: 1 }, 1.3)
    .to(phoneGroup.position, { x: -1.4, y: -0.2, z: 1.5, duration: 1 }, 1.3)
    .to(heroCamera, { fov: 23, onUpdate: () => heroCamera.updateProjectionMatrix(), duration: 1 }, 1.3)
    .to(pop2, { opacity: 1, y: 0, duration: 0.3 }, 1.5)
    .to(pop2, { opacity: 0, y: -20, duration: 0.3 }, 2.4);

  tl.to(phoneGroup.rotation, { x: 0.3, y: Math.PI * 2, z: 0, duration: 1.2 }, 2.6)
    .to(phoneGroup.position, { x: 0, y: 1.2, z: 3.5, duration: 1.2 }, 2.6)
    .to(heroCamera, { fov: 22, onUpdate: () => heroCamera.updateProjectionMatrix(), duration: 1.2 }, 2.6)
    .to(pop3, { opacity: 1, y: 0, duration: 0.3 }, 2.8)
    .to(pop3, { opacity: 0, y: -20, duration: 0.3 }, 3.7);
}
```

Note `onHeroResize` is **not debounced yet** and the render loop **still self-perpetuates unconditionally** — that's Task 4. This step is a pure move.

- [ ] **Step 5: Create `src/js/three/cta-scene.js`**

```js
import * as THREE from 'three';
import { createAuthenticIPhoneMesh } from './iphone-model.js';

let ctaScene, ctaCamera, ctaRenderer, ctaPhoneGroup;

export function initCtaThreeCanvas() {
  const container = document.getElementById('cta-canvas');
  if (!container) return;

  const isMobile = window.innerWidth < 768;
  const maxPixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5);

  ctaScene = new THREE.Scene();
  ctaCamera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);
  ctaCamera.position.set(0, 0, 12);

  ctaRenderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  ctaRenderer.setSize(window.innerWidth, window.innerHeight);
  ctaRenderer.setPixelRatio(maxPixelRatio);
  container.appendChild(ctaRenderer.domElement);

  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  ctaScene.add(amb);

  const pLight = new THREE.PointLight(0xA855F7, 4, 15);
  pLight.position.set(0, 0, 6);
  ctaScene.add(pLight);

  ctaPhoneGroup = createAuthenticIPhoneMesh();
  ctaPhoneGroup.scale.set(0.75, 0.75, 0.75);
  ctaScene.add(ctaPhoneGroup);

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.8;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.8;
  });

  window.addEventListener('resize', onCtaResize);

  const clock = new THREE.Clock();

  function animateCta() {
    requestAnimationFrame(animateCta);

    const ctaEl = document.getElementById('contact');
    if (ctaEl) {
      const rect = ctaEl.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight * 1.5) return;
    }

    const elapsedTime = clock.getElapsedTime();

    if (ctaPhoneGroup) {
      ctaPhoneGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.2;
      ctaPhoneGroup.rotation.y += (mouseX - ctaPhoneGroup.rotation.y) * 0.05;
      ctaPhoneGroup.rotation.x += (mouseY - ctaPhoneGroup.rotation.x) * 0.05;
    }

    if (ctaRenderer && ctaScene && ctaCamera) {
      ctaRenderer.render(ctaScene, ctaCamera);
    }
  }

  animateCta();
}

function onCtaResize() {
  if (!ctaCamera || !ctaRenderer) return;
  ctaCamera.aspect = window.innerWidth / window.innerHeight;
  ctaCamera.updateProjectionMatrix();
  ctaRenderer.setSize(window.innerWidth, window.innerHeight);
}
```

- [ ] **Step 6: Create `src/js/animations/karaoke.js`**

```js
export function initKaraokeText() {
  const container = document.getElementById('kakaoke-text');
  if (!container) return;

  const rawText = container.innerText.trim();
  const words = rawText.split(' ');

  container.innerHTML = words
    .map(word => `<span class="karaoke-word mr-2">${word}</span>`)
    .join('');

  const wordElements = container.querySelectorAll('.karaoke-word');

  window.addEventListener('scroll', () => {
    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    let progress = (windowHeight - rect.top) / (windowHeight + rect.height);
    progress = Math.max(0, Math.min(1, progress));

    const activeIndex = Math.floor(progress * wordElements.length * 1.4);

    wordElements.forEach((el, index) => {
      if (index <= activeIndex) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  });
}
```

(Verbatim from `src/main.js:647-677`. The rAF-batching fix is Task 4.)

- [ ] **Step 7: Create `src/js/animations/timeline-scrubber.js`**

```js
import { gsap } from 'gsap';

export function initTimelineScrubber() {
  const timelineFill = document.getElementById('timeline-fill');
  const steps = document.querySelectorAll('.timeline-step');

  if (!timelineFill) return;

  gsap.to(timelineFill, {
    height: '100%',
    ease: 'none',
    scrollTrigger: {
      trigger: '#process',
      start: 'top 60%',
      end: 'bottom 70%',
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        steps.forEach((step, idx) => {
          const stepThreshold = idx / (steps.length - 1);
          if (progress >= stepThreshold - 0.1) {
            step.classList.remove('opacity-20', 'blur-[4px]', 'scale-[0.98]');
            step.classList.add('timeline-step-active');
          } else {
            step.classList.add('opacity-20', 'blur-[4px]', 'scale-[0.98]');
            step.classList.remove('timeline-step-active');
          }
        });
      }
    }
  });
}
```

(Verbatim from `src/main.js:682-711`.)

- [ ] **Step 8: Create `src/js/animations/cta-doors.js`**

```js
import { gsap } from 'gsap';

export function initCtaDoors() {
  const doorLeft = document.getElementById('cta-door-left');
  const doorRight = document.getElementById('cta-door-right');
  const wrapper = document.getElementById('cta-door-wrapper');

  if (!doorLeft || !doorRight || !wrapper) return;

  gsap.timeline({
    scrollTrigger: {
      trigger: '#cta-door-wrapper',
      start: 'top top',
      end: '80% bottom',
      scrub: 0.5,
      invalidateOnRefresh: true
    }
  })
  .to(doorLeft, { xPercent: -100, ease: 'none' }, 0)
  .to(doorRight, { xPercent: 100, ease: 'none' }, 0);

  const contactLinks = document.querySelectorAll('a[href="#contact"]');
  contactLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetScroll = wrapper.getBoundingClientRect().top + window.scrollY + (window.innerHeight * 0.35);
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    });
  });
}
```

(Verbatim from `src/main.js:716-747`.)

- [ ] **Step 9: Create `src/js/animations/faq-accordion.js`**

```js
export function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    item.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}
```

(Verbatim from `src/main.js:752-764`.)

- [ ] **Step 10: Create `src/js/forms/submit-helper.js`**

The contact and talent forms have near-identical submit handlers (fetch, JSON-parse the response defensively, show a status message, reset the form, re-enable the button after 8s). This extracts that shared shape. **Important for exact fidelity:** the contact form uses three *different* fallback message strings depending on which branch is hit; the talent form happens to reuse the same string in all three. To avoid changing wording in any branch, all three fallbacks are passed in explicitly rather than assumed to be the same string.

```js
function getCleanErrorMessage(err, defaultMsg) {
  if (!err) return defaultMsg;
  const msg = typeof err === 'string' ? err : (err.message || '');
  if (!msg ||
      msg.includes('Unexpected token') ||
      msg.includes('is not valid JSON') ||
      msg.includes('JSON.parse') ||
      msg.includes('Failed to fetch') ||
      msg.includes('SyntaxError') ||
      msg.includes('500') ||
      msg.includes('404') ||
      msg.includes('<html') ||
      msg.includes('Internal Server')) {
    return defaultMsg;
  }
  return msg;
}

export async function submitForm({
  form,
  statusEl,
  endpoint,
  buildPayload,
  statusColorClass,
  sendingText,
  successFallbackMessage,
  errorFallbackMessage,
  catchFallbackMessage
}) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerText : '';

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = sendingText;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload())
    });

    let data = {};
    try {
      const rawText = await response.text();
      data = JSON.parse(rawText);
    } catch (e) {
      data = {};
    }

    let message;
    if (response.ok && data.success) {
      message = data.message || successFallbackMessage;
    } else if (data.message) {
      message = data.message;
    } else {
      message = getCleanErrorMessage(data.error, errorFallbackMessage);
    }

    if (statusEl) {
      statusEl.classList.remove('hidden', 'text-red-400');
      statusEl.classList.add(statusColorClass);
      statusEl.innerHTML = `&check; ${message}`;
    }
    form.reset();
  } catch (err) {
    console.error(`Form submission error (${endpoint}):`, err);
    if (statusEl) {
      statusEl.classList.remove('hidden', 'text-red-400');
      statusEl.classList.add(statusColorClass);
      statusEl.innerHTML = `&check; ${catchFallbackMessage}`;
    }
    form.reset();
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
    }
    if (statusEl) {
      setTimeout(() => {
        statusEl.classList.add('hidden');
      }, 8000);
    }
  }
}
```

Two intentional, zero-visible-effect simplifications versus the original inline handlers (call these out if anyone asks why the diff isn't 100% mechanical):
1. The `console.error` label text changed from `'Contact Form Submission Error:'` / `'Talent Form Submission Error:'` to a generic `Form submission error (${endpoint}):`. This only appears in the browser devtools console during `npm run dev` — `vite.config.js`'s `esbuild.drop: ['console', 'debugger']` strips all `console.*` calls from the production build, so this has zero effect on what ships.
2. `originalBtnText`'s fallback (`submitBtn ? submitBtn.innerText : '...'`) is simplified to `''`. In the original code this fallback value is never actually read — both places that use `originalBtnText` are themselves guarded by `if (submitBtn)`, so the fallback string is dead code whether it's `''` or something else.

- [ ] **Step 11: Create `src/js/forms/contact-form.js`**

```js
import { submitForm } from './submit-helper.js';

export function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('form-status');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitForm({
      form: contactForm,
      statusEl: contactStatus,
      endpoint: '/api/contact',
      statusColorClass: 'text-accent',
      sendingText: 'Sending enquiry...',
      successFallbackMessage: 'Thank you! Your enquiry has been received.',
      errorFallbackMessage: 'Thank you! Your enquiry has been received. We will get back to you shortly.',
      catchFallbackMessage: 'Thank you! Your enquiry has been received. We will reply within one business day.',
      buildPayload: () => ({
        name: document.getElementById('form-name')?.value || '',
        email: document.getElementById('form-email')?.value || '',
        phone: document.getElementById('form-phone')?.value || '',
        company: document.getElementById('form-company')?.value || '',
        service: document.getElementById('form-service')?.value || '',
        budget: document.getElementById('form-budget')?.value || '',
        message: document.getElementById('form-message')?.value || ''
      })
    });
  });
}
```

- [ ] **Step 12: Create `src/js/forms/talent-form.js`**

```js
import { submitForm } from './submit-helper.js';

export function initTalentForm() {
  const talentForm = document.getElementById('talent-form');
  const talentStatus = document.getElementById('talent-status');
  if (!talentForm) return;

  talentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitForm({
      form: talentForm,
      statusEl: talentStatus,
      endpoint: '/api/talent',
      statusColorClass: 'text-emerald-400',
      sendingText: 'Registering profile...',
      successFallbackMessage: 'Thank you! Your talent profile has been securely registered.',
      errorFallbackMessage: 'Thank you! Your talent profile has been securely registered.',
      catchFallbackMessage: 'Thank you! Your talent profile has been securely registered.',
      buildPayload: () => ({
        name: document.getElementById('talent-name')?.value || '',
        email: document.getElementById('talent-email')?.value || '',
        phone: document.getElementById('talent-phone')?.value || '',
        role: document.getElementById('talent-role')?.value || '',
        experience: document.getElementById('talent-exp')?.value || '',
        location: document.getElementById('talent-location')?.value || '',
        notice_period: document.getElementById('talent-notice')?.value || '',
        resume_url: document.getElementById('talent-resume')?.value || ''
      })
    });
  });
}
```

- [ ] **Step 13: Replace `src/main.js` with the thin entry point**

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './style.css';

import { initLoadingScreen } from './js/loading-screen.js';
import { initHeroThreeCanvas } from './js/three/hero-scene.js';
import { initCtaThreeCanvas } from './js/three/cta-scene.js';
import { initKaraokeText } from './js/animations/karaoke.js';
import { initTimelineScrubber } from './js/animations/timeline-scrubber.js';
import { initCtaDoors } from './js/animations/cta-doors.js';
import { initFaqAccordion } from './js/animations/faq-accordion.js';
import { initContactForm } from './js/forms/contact-form.js';
import { initTalentForm } from './js/forms/talent-form.js';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initHeroThreeCanvas();
  initCtaThreeCanvas();
  initKaraokeText();
  initTimelineScrubber();
  initCtaDoors();
  initFaqAccordion();
  initContactForm();
  initTalentForm();
});
```

(This still statically imports everything — matches today's behavior exactly. Task 4 converts `cta-scene.js` and `talent-form.js` to dynamic imports as the code-splitting performance fix.)

- [ ] **Step 14: Verify in the dev server**

```bash
npm run dev
```

Manually check on `http://localhost:3000`:
- Hero 3D phone renders and rotates as you scroll
- Karaoke text section highlights words as you scroll through it
- Process timeline fills as you scroll `#process`
- Clicking any "Start a project" / `#contact` link smooth-scrolls and the CTA doors open
- FAQ items expand/collapse on click
- Submitting the contact form (bottom of page) shows a status message and resets
- Submitting the talent/careers form shows a status message and resets

Stop the dev server when done.

- [ ] **Step 15: Verify the production build still matches baseline behaviorally**

```bash
npm run build
```

Expected: build succeeds with no errors. (The built JS bundle's exact bytes *will* differ from baseline now — that's expected, since the module graph changed — but there should be zero build errors or warnings about missing imports.)

- [ ] **Step 16: Commit**

```bash
git add src/main.js src/js
git commit -m "refactor: split src/main.js into per-concern modules"
```

---

### Task 4: Apply the four performance fixes

**Files:**
- Create: `src/js/utils/debounce.js`
- Modify: `src/js/three/hero-scene.js`, `src/js/three/cta-scene.js`, `src/js/animations/karaoke.js`, `src/main.js`

Each fix is independent; each changes *when* work happens, never *what* it looks like. All were pre-approved as in-scope "performance smoothness."

- [ ] **Step 1: Create the shared debounce utility**

```bash
mkdir -p src/js/utils
```

```js
// src/js/utils/debounce.js
export function debounce(fn, delayMs) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delayMs);
  };
}
```

- [ ] **Step 2: Fix 1 & 2 — hero scene: pause off-screen, debounce resize**

In `src/js/three/hero-scene.js`:

Add the import and a running-flag at the top:
```js
import * as THREE from 'three';
import { gsap } from 'gsap';
import { createAuthenticIPhoneMesh } from './iphone-model.js';
import { debounce } from '../utils/debounce.js';

let heroScene, heroCamera, heroRenderer, phoneGroup, ring1, ring2, particlesMesh;
let heroAnimating = false;
```

Replace the resize listener line:
```js
window.addEventListener('resize', onHeroResize);
```
with:
```js
window.addEventListener('resize', debounce(onHeroResize, 150));
```

Replace the whole `animateHero`/loop-start block:
```js
  function animateHero() {
    requestAnimationFrame(animateHero);

    if (window.scrollY > window.innerHeight * 4.5) return;

    const elapsedTime = clock.getElapsedTime();

    if (particlesMesh) particlesMesh.rotation.y = elapsedTime * 0.03;
    if (ring1) ring1.rotation.z = elapsedTime * 0.15;
    if (ring2) ring2.rotation.x = elapsedTime * 0.12;

    if (heroRenderer && heroScene && heroCamera) {
      heroRenderer.render(heroScene, heroCamera);
    }
  }

  animateHero();
  setupHeroScrollAnimation();
}
```
with:
```js
  function animateHero() {
    if (!heroAnimating) return;
    requestAnimationFrame(animateHero);

    const elapsedTime = clock.getElapsedTime();

    if (particlesMesh) particlesMesh.rotation.y = elapsedTime * 0.03;
    if (ring1) ring1.rotation.z = elapsedTime * 0.15;
    if (ring2) ring2.rotation.x = elapsedTime * 0.12;

    if (heroRenderer && heroScene && heroCamera) {
      heroRenderer.render(heroScene, heroCamera);
    }
  }

  function startHeroAnimation() {
    if (heroAnimating) return;
    heroAnimating = true;
    animateHero();
  }

  function stopHeroAnimation() {
    heroAnimating = false;
  }

  const heroSection = document.getElementById('hero-section');
  if (heroSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) startHeroAnimation();
        else stopHeroAnimation();
      });
    });
    observer.observe(heroSection);
  } else {
    startHeroAnimation();
  }

  setupHeroScrollAnimation();
}
```

**Behavior note (not a visual change, but worth knowing):** the original code kept scheduling `requestAnimationFrame` forever and only skipped the `render()` call once you'd scrolled past `4.5×` the viewport height. This version stops scheduling frames entirely once `#hero-section` (which is `280vh`/`420vh` tall) leaves the viewport, and resumes if you scroll back up into it. Visually these land in the same place — the hero canvas is `position: fixed` and only ever shows content during the hero section — but the exact scroll-pixel threshold where rendering pauses shifts slightly. This is the intended shape of "pause when off-screen."

- [ ] **Step 3: Fix 1 & 2 — CTA scene: pause off-screen, debounce resize**

In `src/js/three/cta-scene.js`, add the same imports/flag:
```js
import * as THREE from 'three';
import { createAuthenticIPhoneMesh } from './iphone-model.js';
import { debounce } from '../utils/debounce.js';

let ctaScene, ctaCamera, ctaRenderer, ctaPhoneGroup;
let ctaAnimating = false;
```

Replace the resize listener:
```js
window.addEventListener('resize', onCtaResize);
```
with:
```js
window.addEventListener('resize', debounce(onCtaResize, 150));
```

Replace the animation block:
```js
  function animateCta() {
    requestAnimationFrame(animateCta);

    const ctaEl = document.getElementById('contact');
    if (ctaEl) {
      const rect = ctaEl.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight * 1.5) return;
    }

    const elapsedTime = clock.getElapsedTime();

    if (ctaPhoneGroup) {
      ctaPhoneGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.2;
      ctaPhoneGroup.rotation.y += (mouseX - ctaPhoneGroup.rotation.y) * 0.05;
      ctaPhoneGroup.rotation.x += (mouseY - ctaPhoneGroup.rotation.x) * 0.05;
    }

    if (ctaRenderer && ctaScene && ctaCamera) {
      ctaRenderer.render(ctaScene, ctaCamera);
    }
  }

  animateCta();
}
```
with:
```js
  function animateCta() {
    if (!ctaAnimating) return;
    requestAnimationFrame(animateCta);

    const elapsedTime = clock.getElapsedTime();

    if (ctaPhoneGroup) {
      ctaPhoneGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.2;
      ctaPhoneGroup.rotation.y += (mouseX - ctaPhoneGroup.rotation.y) * 0.05;
      ctaPhoneGroup.rotation.x += (mouseY - ctaPhoneGroup.rotation.x) * 0.05;
    }

    if (ctaRenderer && ctaScene && ctaCamera) {
      ctaRenderer.render(ctaScene, ctaCamera);
    }
  }

  function startCtaAnimation() {
    if (ctaAnimating) return;
    ctaAnimating = true;
    animateCta();
  }

  function stopCtaAnimation() {
    ctaAnimating = false;
  }

  const ctaSection = document.getElementById('contact');
  if (ctaSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) startCtaAnimation();
        else stopCtaAnimation();
      });
    }, { rootMargin: '150% 0px 150% 0px' });
    observer.observe(ctaSection);
  } else {
    startCtaAnimation();
  }
}
```

This also removes a `document.getElementById('contact')` + `getBoundingClientRect()` call that used to run on *every single frame* — that's now a one-time `IntersectionObserver.observe()` call, which is strictly less work, not just equivalent.

- [ ] **Step 4: Fix 3 — batch the karaoke scroll handler to one update per frame**

In `src/js/animations/karaoke.js`, replace the whole function body from the `wordElements` line down:

```js
  const wordElements = container.querySelectorAll('.karaoke-word');

  window.addEventListener('scroll', () => {
    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    let progress = (windowHeight - rect.top) / (windowHeight + rect.height);
    progress = Math.max(0, Math.min(1, progress));

    const activeIndex = Math.floor(progress * wordElements.length * 1.4);

    wordElements.forEach((el, index) => {
      if (index <= activeIndex) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  });
}
```
with:
```js
  const wordElements = container.querySelectorAll('.karaoke-word');
  let ticking = false;

  function updateKaraoke() {
    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    let progress = (windowHeight - rect.top) / (windowHeight + rect.height);
    progress = Math.max(0, Math.min(1, progress));

    const activeIndex = Math.floor(progress * wordElements.length * 1.4);

    wordElements.forEach((el, index) => {
      if (index <= activeIndex) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateKaraoke);
      ticking = true;
    }
  });
}
```

The math is untouched — this only changes how often it runs (at most once per animation frame instead of once per raw `scroll` event, which can fire many times per frame).

- [ ] **Step 5: Fix 4 — code-split the below-the-fold modules**

In `src/main.js`, remove the static import of `initCtaThreeCanvas` and `initTalentForm`, and load them dynamically instead:

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './style.css';

import { initLoadingScreen } from './js/loading-screen.js';
import { initHeroThreeCanvas } from './js/three/hero-scene.js';
import { initKaraokeText } from './js/animations/karaoke.js';
import { initTimelineScrubber } from './js/animations/timeline-scrubber.js';
import { initCtaDoors } from './js/animations/cta-doors.js';
import { initFaqAccordion } from './js/animations/faq-accordion.js';
import { initContactForm } from './js/forms/contact-form.js';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initHeroThreeCanvas();
  initKaraokeText();
  initTimelineScrubber();
  initCtaDoors();
  initFaqAccordion();
  initContactForm();

  import('./js/three/cta-scene.js').then(({ initCtaThreeCanvas }) => initCtaThreeCanvas());
  import('./js/forms/talent-form.js').then(({ initTalentForm }) => initTalentForm());
});
```

- [ ] **Step 6: Verify in the dev server**

```bash
npm run dev
```

Repeat the same manual checklist as Task 3 Step 14 (hero rotates, karaoke highlights, timeline fills, CTA doors open, FAQ toggles, both forms submit). Additionally:
- Open browser devtools → Network tab, reload. Confirm you see separate small JS chunk requests for the CTA scene and talent form (proving the code-split worked) rather than one single monolithic bundle.
- Scroll down past the hero section, then open devtools → Performance or just watch CPU usage — it should drop once the hero is out of view (proving the pause behavior worked). Scroll back up — the phone should resume rotating immediately.

- [ ] **Step 7: Verify the production build**

```bash
npm run build
```

Expected: build succeeds, no errors.

- [ ] **Step 8: Commit**

```bash
git add src/js src/main.js
git commit -m "perf: pause off-screen 3D rendering, debounce resize, batch scroll, code-split below-the-fold JS"
```

---

### Task 5: Split `src/style.css` into `src/styles/*`

**Files:**
- Create: `src/styles/main.css`, `src/styles/base.css`, `src/styles/components/glass.css`, `src/styles/components/buttons.css`, `src/styles/components/karaoke.css`, `src/styles/components/bento.css`, `src/styles/components/timeline.css`, `src/styles/components/cta-doors.css`, `src/styles/components/beam.css`, `src/styles/components/faq.css`, `src/styles/components/whatsapp-button.css`, `src/styles/components/responsive-overrides.css`
- Modify: `src/main.js`
- Delete: `src/style.css`

Purely mechanical, same technique as Task 2 — `sed` extraction by line range from today's `src/style.css`, grouped by component. Two files (`bento.css`, `cta-doors.css`) pull from two non-adjacent ranges since their rules aren't contiguous in the original file; `sed` supports multiple ranges in one call.

- [ ] **Step 1: Create the folder**

```bash
mkdir -p src/styles/components
```

- [ ] **Step 2: Extract with `sed`**

```bash
sed -n '5,26p'    src/style.css > src/styles/base.css
sed -n '28,39p'   src/style.css > src/styles/components/glass.css
sed -n '41,53p'   src/style.css > src/styles/components/buttons.css
sed -n '55,66p'   src/style.css > src/styles/components/karaoke.css
sed -n '68,89p;141,149p'  src/style.css > src/styles/components/bento.css
sed -n '91,104p'  src/style.css > src/styles/components/timeline.css
sed -n '106,109p;151,160p' src/style.css > src/styles/components/cta-doors.css
sed -n '111,121p' src/style.css > src/styles/components/beam.css
sed -n '123,139p' src/style.css > src/styles/components/faq.css
sed -n '162,171p' src/style.css > src/styles/components/whatsapp-button.css
sed -n '173,193p' src/style.css > src/styles/components/responsive-overrides.css
```

- [ ] **Step 3: Create `src/styles/main.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './base.css';
@import './components/glass.css';
@import './components/buttons.css';
@import './components/karaoke.css';
@import './components/bento.css';
@import './components/timeline.css';
@import './components/cta-doors.css';
@import './components/beam.css';
@import './components/faq.css';
@import './components/whatsapp-button.css';
@import './components/responsive-overrides.css';
```

- [ ] **Step 4: Update the import in `src/main.js`**

Change:
```js
import './style.css';
```
to:
```js
import './styles/main.css';
```

- [ ] **Step 5: Delete the old file**

```bash
rm src/style.css
```

- [ ] **Step 6: Verify the built CSS is unchanged**

```bash
npm run build
```

Compare the compiled CSS output — since Tailwind/PostCSS may reformat whitespace even with zero source changes, do a *semantic* check, not a byte diff:

```bash
grep -c "glass-panel\|hero-glow\|btn-primary\|karaoke-word\|bento-card\|timeline-point\|cta-door-panel\|beam-live\|faq-answer\|floating-whatsapp" dist/assets/*.css
```

Expected: a non-zero count (all the custom class names still made it into the compiled stylesheet). Then load the built `dist/index.html` in a browser (`npm run preview`) and visually confirm nothing looks different — glass panels, buttons, FAQ accordion, WhatsApp button.

- [ ] **Step 7: Commit**

```bash
git add src/styles src/main.js
git rm src/style.css
git commit -m "refactor: split src/style.css into per-component files under src/styles/"
```

---

### Task 6: Migrate `admin.html` onto the Vite/Tailwind build pipeline

**Files:**
- Modify: `tailwind.config.js`, `admin.html`
- Create: `src/styles/admin.css`

`admin.html` currently loads Tailwind from a CDN `<script>` with its own inline `tailwind.config` object, plus an inline `<style>` block — entirely outside Vite. Its custom colors (`accent: '#8B5CF6'`, `accentGlow: '#A855F7'`) are **identical** to the main site's `tailwind.config.js`, but its background colors (`bgDark: '#05030a'`, `surfaceDark: '#0b0717'`, `surfaceCard: '#130d25'`) are **different, slightly more purple-tinted** shades than the main site's own `bgDark`/`surfaceDark` (`#020202`/`#0a0614`). Reusing the main site's token names for admin's colors would silently shift admin's exact color — a theme change, which is out of scope. So admin's distinct colors get their own token names (`adminBgDark`, `adminSurfaceDark`, `adminSurfaceCard`), added alongside the existing ones, and admin's HTML classes are updated to use them. `accent`/`accentGlow` are shared as-is since the values already match.

- [ ] **Step 1: Add admin's color tokens to `tailwind.config.js`**

In `tailwind.config.js`, inside `theme.extend.colors`, add three new keys alongside the existing ones:

```js
      colors: {
        bgDark: '#020202',
        surfaceDark: '#0a0614',
        surfaceBorder: 'rgba(255, 255, 255, 0.08)',
        accent: '#8B5CF6',      // Purple Brand Accent
        accentGlow: '#A855F7',  // Vibrant Purple Glow
        accentDark: '#7C3AED',  // Deep Purple
        textMuted: '#9CA3AF',
        adminBgDark: '#05030a',
        adminSurfaceDark: '#0b0717',
        adminSurfaceCard: '#130d25',
      },
```

Also add `"./admin.html"` to the `content` array so Tailwind's build-time scanner actually sees admin's classes (today it doesn't need to, because the CDN version scans the live DOM in the browser instead):

```js
  content: [
    "./index.html",
    "./admin.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
```

- [ ] **Step 2: Rename the three affected classes in `admin.html`**

Four occurrences, all in static `class="..."` attributes (confirmed by grep — none are constructed dynamically in the inline script's template strings):

| Line | Change |
|---|---|
| 68 | `bg-bgDark` → `bg-adminBgDark` |
| 72 | `bg-surfaceDark` → `bg-adminSurfaceDark` |
| 167 | `bg-surfaceDark` → `bg-adminSurfaceDark` |
| 257 | `bg-surfaceCard` → `bg-adminSurfaceCard` |
| 379 | `bg-surfaceDark` → `bg-adminSurfaceDark` |
| 407 | `bg-surfaceDark` → `bg-adminSurfaceDark` |

Use exact string replacement (each of these class attributes is unique enough in context — verify with `grep -n 'bg-surfaceDark\|bg-bgDark\|bg-surfaceCard' admin.html` before and after that the count drops from 6 to 0).

- [ ] **Step 3: Create `src/styles/admin.css`**

Carries the same `@tailwind` directives as the main site (admin is compiled independently since it's a separate HTML entry point in `vite.config.js`), plus admin's own inline `<style>` block content moved in verbatim (today's `admin.html:34-64`), with the hardcoded hex colors in the CSS left exactly as they are — they're plain CSS, not Tailwind classes, so they don't collide with anything:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #05030a;
  color: #f3f4f6;
  font-family: 'Inter', sans-serif;
}
.glass-card {
  background: rgba(15, 10, 30, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.glass-card-hover {
  transition: all 0.2s ease-in-out;
}
.glass-card-hover:hover {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 10px 30px -10px rgba(139, 92, 246, 0.2);
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #05030a;
}
::-webkit-scrollbar-thumb {
  background: #261942;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #8B5CF6;
}
```

- [ ] **Step 4: Replace admin.html's `<head>` CDN/config block**

Replace lines 12-65 of today's `admin.html` (the CDN `<script src="https://cdn.tailwindcss.com">`, the inline `tailwind.config` script, and the inline `<style>` block) with a single stylesheet link:

```html
  <link rel="stylesheet" href="/src/styles/admin.css">
```

Everything else in the `<head>` (meta tags, title, favicon, font preconnects/links — lines 5-11) stays exactly as-is.

- [ ] **Step 5: Verify visually**

```bash
npm run dev
```

Open `http://localhost:3000/admin.html`. Confirm: same near-black purple background, same glass-card login modal styling, same scrollbar appearance, same accent-purple buttons — nothing should look different from before this task. (You won't be able to log in without a running backend + valid credentials; that's fine, just confirm the *visual* styling of the login screen matches.)

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.js admin.html src/styles/admin.css
git commit -m "refactor: move admin.html off CDN Tailwind onto the Vite build pipeline"
```

---

### Task 7: Split `admin.html`'s markup into partials

**Files:**
- Create: `src/partials/admin/head.html`, `src/partials/admin/login-modal.html`, `src/partials/admin/dashboard-header.html`, `src/partials/admin/dashboard-toolbar.html`, `src/partials/admin/dashboard-tables.html`, `src/partials/admin/detail-modal.html`, `src/partials/admin/password-modal.html`
- Modify: `admin.html`

No `tailwind.config.js` change needed here — Task 2 already added `"./src/partials/**/*.html"` to the `content` array, and that glob is recursive, so it covers this folder too.

Same `sed`-extraction technique as Task 2, applied to `admin.html` **after** Task 6's head/class changes are in place. **Same trailing-newline convention as Task 2, deliberately:** each partial should end with no trailing newline (`sed` extraction naturally produces this). A trailing `\n` in a partial would inject an extra blank line at its `@include` site under the plugin's plain string-concatenation model — that's why Task 2's partials have "No newline at end of file" and this task's should too, not because it's an accident to tidy up.

- [ ] **Step 1: Create the folder**

```bash
mkdir -p src/partials/admin
```

- [ ] **Step 2: Extract with `sed`**

(Line numbers below reflect `admin.html` *after* Task 6 — re-run `grep -n '<div id="login-modal"\|<div id="dashboard-container"\|<header class="sticky\|<main class="max-w-7xl\|<!-- Contact Submissions Table\|</main>\|<!-- Submission Detail Modal\|<!-- Change Password Modal\|<script>' admin.html` first and adjust the ranges below if Task 6 shifted anything — the head-block replacement changes line numbers for everything after it.)

```bash
sed -n '/<!-- ==================== 1. LOGIN MODAL/,/^  <\/div>$/p' admin.html | head -37 > src/partials/admin/login-modal.html
```

Given how error-prone `sed` range hunting gets after a prior edit, do this extraction differently and more safely: open `admin.html` in the editor, and for each of the 6 remaining chunks below, select the exact block (including its start/end comment and wrapping tag) and cut it into the named partial file, using these **content anchors** (not line numbers, since Task 6 shifted them):

| Partial file | Starts at (inclusive) | Ends at (inclusive) |
|---|---|---|
| `login-modal.html` | `<!-- ==================== 1. LOGIN MODAL OVERLAY (SECURITY GUARD) ==================== -->` | The `</div>` that closes `id="login-modal"` |
| `dashboard-header.html` | `<!-- ==================== 2. MAIN ADMIN DASHBOARD CONTAINER ==================== -->` through the `<header class="sticky ...">...</header>` block | closing `</header>` |
| `dashboard-toolbar.html` | `<main class="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">` | end of the tabs/toolbar `</div>` block, immediately before `<!-- Contact Submissions Table -->` |
| `dashboard-tables.html` | `<!-- Contact Submissions Table -->` | `</main>` then the `</div>` that closes `id="dashboard-container"` |
| `detail-modal.html` | `<!-- Submission Detail Modal -->` | closing `</div>` of `id="detail-modal"` |
| `password-modal.html` | `<!-- Change Password Modal -->` | closing `</div>` of `id="password-modal"` |

Each partial is fully self-contained (includes its own opening/closing tags), same principle as Task 2. `dashboard-header.html` will contain both the container-open `<div id="dashboard-container" class="hidden">` comment and the `<header>...</header>` — its matching `</div>` close is in `dashboard-tables.html` at the very end, since the container wraps the header, the `<main>`, and nothing else.

- [ ] **Step 3: Replace `admin.html`'s body with the skeleton**

The body (between `<body ...>` and the `<script>` block) becomes:

```html
  <!--@include admin/login-modal.html-->

  <!--@include admin/dashboard-header.html-->

  <!--@include admin/dashboard-toolbar.html-->

  <!--@include admin/dashboard-tables.html-->

  <!--@include admin/detail-modal.html-->

  <!--@include admin/password-modal.html-->
```

(The `<body class="...">` opening tag, and everything from the `<script>` tag onward, stay in `admin.html` itself — only the body's *content* moves to partials.)

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Open `http://localhost:3000/admin.html`, confirm the login screen renders identically (same layout, same styling) to before this task.

- [ ] **Step 5: Commit**

```bash
git add admin.html src/partials/admin
git commit -m "refactor: split admin.html markup into partials"
```

---

### Task 8: Split `admin.html`'s inline script into modules

**Files:**
- Create: `src/js/admin/state.js`, `src/js/admin/auth.js`, `src/js/admin/data.js`, `src/js/admin/export.js`, `src/js/admin/modals.js`, `src/js/admin/utils.js`, `src/js/admin/dashboard.js`
- Modify: `admin.html`

**This is the one place in the whole plan where a plain "move the code" isn't quite enough**, and it's worth understanding why before making the change.

`admin.html`'s current inline `<script>` is a classic (non-module) script, so every function it declares becomes a property of `window` automatically — which is exactly what lets markup like `<button onclick="loadAllSubmissions()">` work: the browser looks up `loadAllSubmissions` on `window` when the button is clicked. An ES module (`<script type="module">`) behaves differently: everything declared inside it is scoped to that module, *not* attached to `window`. If the script were simply moved into a module as-is, every `onclick="..."` / `onsubmit="..."` / `onchange="..."` attribute in the HTML would break with a `ReferenceError: ... is not defined`, because those handler functions would no longer be global.

The fix is standard and low-risk: keep every function exactly as it is, and at the end of the entry module, explicitly assign the functions referenced by inline HTML attributes onto `window` (`window.loadAllSubmissions = loadAllSubmissions;` etc.). This changes *how the function becomes global*, not what it does. The alternative — rewriting every `onclick="..."` attribute into an `addEventListener` call — would also work, but touches far more of the HTML (higher risk, bigger diff) for no behavioral benefit, so it's not part of this plan.

19 functions are referenced by inline HTML attributes (confirmed by grep across both the static HTML and the dynamically-generated table-row template strings) and must be exported to `window`: `handleLogin`, `preventUndo`, `loadAllSubmissions`, `openChangePasswordModal`, `handleLogout`, `toggleAccessGuide`, `toggleSelectAll`, `switchTab`, `filterTable`, `deleteSelected`, `toggleExportMenu`, `exportData`, `toggleSelectRow`, `openDetailModal`, `deleteSubmission`, `closeModal`, `copyToClipboard`, `closePasswordModal`, `handleChangePassword`.

Everything else (`checkAuth`, `showLoginModal`, `hideLoginModal`, `getAuthHeaders`, `renderContactTable`, `renderTalentTable`, `generateCSV`, `downloadBlob`, `formatDate`, `escapeHtml`, `updateBatchButton`) is only ever called from other JS, never from an HTML attribute, so it stays module-private.

- [ ] **Step 1: Create the folder**

```bash
mkdir -p src/js/admin
```

**A note on file size:** `data.js` (Step 4 below) ends up around 230-250 lines — over this plan's usual ~150-200 line guideline. That's a deliberate exception, the same way `iphone-model.js` is: `loadAllSubmissions`, the two table renderers, filtering, selection, and delete all operate on the same `contactData`/`talentData`/`selectedIds` state, and splitting them further would mean spreading that shared mutable state across even more files for no real readability gain. One cohesive file beats a forced split here.

- [ ] **Step 2: Create `src/js/admin/state.js`**

The dashboard's data (`contactData`, `talentData`, `selectedIds`, `activeTab`) is read and written from several concerns (loading, rendering, filtering, exporting, the detail modal) — this is genuinely one shared piece of state, not something to force apart. A single exported object, mutated in place by whichever module needs to, keeps every other module's code identical to today's (they already just read/write these variables directly):

```js
export const state = {
  activeTab: 'contact',
  contactData: [],
  talentData: [],
  selectedIds: new Set(),
};
```

- [ ] **Step 3: Create `src/js/admin/auth.js`**

Copy verbatim from today's inline script: `preventUndo` (script lines 435-440), the `authToken` variable (442, renamed to a module-local `let`), `getAuthHeaders` (449-454), `checkAuth` (456-478), `showLoginModal`/`hideLoginModal` (480-488), `handleLogin` (490-533), `handleLogout` (535-540):

```js
export function preventUndo(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y')) {
    e.preventDefault();
    return false;
  }
}

let authToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token') || '';

export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

export async function checkAuth() {
  if (!authToken) {
    showLoginModal();
    return false;
  }
  try {
    const res = await fetch('/api/auth/verify', { headers: getAuthHeaders() });
    const json = await res.json();
    if (json.success && json.valid) {
      hideLoginModal();
      return true;
    } else {
      sessionStorage.removeItem('admin_token');
      localStorage.removeItem('admin_token');
      authToken = '';
      showLoginModal();
      return false;
    }
  } catch (err) {
    showLoginModal();
    return false;
  }
}

export function showLoginModal() {
  document.getElementById('login-modal').classList.remove('hidden');
  document.getElementById('dashboard-container').classList.add('hidden');
}

export function hideLoginModal() {
  document.getElementById('login-modal').classList.add('hidden');
  document.getElementById('dashboard-container').classList.remove('hidden');
}

export async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('admin-username').value.trim();
  const passwordInput = document.getElementById('admin-password').value;
  const errorDiv = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-btn');

  errorDiv.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Authenticating...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    });

    let json = {};
    try {
      const rawText = await res.text();
      json = JSON.parse(rawText);
    } catch (e) {
      json = {};
    }

    if (res.ok && json.success && json.token) {
      authToken = json.token;
      sessionStorage.setItem('admin_token', authToken);
      localStorage.setItem('admin_token', authToken);
      hideLoginModal();
      loadAllSubmissions();
    } else {
      errorDiv.innerText = json.error || 'Invalid admin username or password.';
      errorDiv.classList.remove('hidden');
    }
  } catch (err) {
    errorDiv.innerText = 'Invalid admin username or password.';
    errorDiv.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Authenticate & Unlock';
  }
}

export function handleLogout() {
  sessionStorage.removeItem('admin_token');
  localStorage.removeItem('admin_token');
  authToken = '';
  showLoginModal();
}
```

Note `handleLogin` calls `loadAllSubmissions()` — that's defined in `data.js` (Step 4). Add this import at the top of `auth.js`:

```js
import { loadAllSubmissions } from './data.js';
```

**This makes `auth.js` and `data.js` import from each other** (`data.js`, in Step 4, imports `checkAuth`/`getAuthHeaders` back from `auth.js`). That's a circular import, and it's safe here specifically because neither side touches the other's export at the top of the file — only inside function bodies (`handleLogin`, `loadAllSubmissions`) that run later, in response to a click, long after both modules have finished loading. ES modules resolve `import` bindings live, so by the time those functions actually run, both sides of the cycle are fully initialized. (The unsafe version of this problem is CommonJS `require()`, where a circular require can hand you a half-finished, undefined export — that's not how ES modules behave.) If a future change ever needs one of these functions at module-evaluation time (i.e., outside a function body), that's the point to break the cycle by moving the shared piece into its own module instead.

- [ ] **Step 4: Create `src/js/admin/data.js`**

Copy verbatim: `loadAllSubmissions` (542-594), `renderContactTable` (596-637), `renderTalentTable` (639-677), `switchTab` (679-701), `filterTable` (703-725), `toggleSelectRow` (727-734), `toggleSelectAll` (736-744), `updateBatchButton` (746-757), `deleteSubmission` (759-777), `deleteSelected` (779-799):

```js
import { state } from './state.js';
import { getAuthHeaders, checkAuth } from './auth.js';
import { formatDate, escapeHtml } from './utils.js';
import { closeModal } from './modals.js';

export async function loadAllSubmissions() {
  const isAuthed = await checkAuth();
  if (!isAuthed) return;

  const refreshIcon = document.getElementById('refresh-icon');
  if (refreshIcon) refreshIcon.classList.add('animate-spin');

  try {
    const [contactRes, talentRes, healthRes] = await Promise.all([
      fetch('/api/submissions/contact', { headers: getAuthHeaders() }),
      fetch('/api/submissions/talent', { headers: getAuthHeaders() }),
      fetch('/api/health')
    ]);

    if (contactRes.status === 401 || talentRes.status === 401) {
      sessionStorage.removeItem('admin_token');
      localStorage.removeItem('admin_token');
      document.getElementById('login-modal').classList.remove('hidden');
      document.getElementById('dashboard-container').classList.add('hidden');
      return;
    }

    const contactJson = await contactRes.json();
    const talentJson = await talentRes.json();
    const healthJson = await healthRes.json();

    state.contactData = contactJson.data || [];
    state.talentData = talentJson.data || [];

    document.getElementById('metric-contact-count').innerText = state.contactData.length;
    document.getElementById('metric-talent-count').innerText = state.talentData.length;
    document.getElementById('metric-total-count').innerText = state.contactData.length + state.talentData.length;
    document.getElementById('tab-contact-badge').innerText = state.contactData.length;
    document.getElementById('tab-talent-badge').innerText = state.talentData.length;

    if (healthJson.database) {
      document.getElementById('metric-db-engine').innerText = healthJson.database;
    }

    state.selectedIds.clear();
    updateBatchButton();
    filterTable();

    document.getElementById('status-indicator').className = "flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400";
    document.getElementById('status-text').innerText = "Live Backend Connected";
  } catch (err) {
    console.error('Error fetching submissions:', err);
    document.getElementById('status-indicator').className = "flex items-center space-x-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-mono text-red-400";
    document.getElementById('status-text').innerText = "Connection Error";
  } finally {
    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
  }
}

export function renderContactTable(items) {
  const tbody = document.getElementById('contact-table-body');
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-12 text-slate-500 font-mono">No contact submissions found in database.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const isChecked = state.selectedIds.has(item.id) ? 'checked' : '';
    return `
    <tr class="hover:bg-white/[0.02] transition-colors">
      <td class="py-3.5 px-4 text-center">
        <input type="checkbox" value="${item.id}" ${isChecked} onchange="toggleSelectRow(${item.id}, this)" class="rounded bg-black/50 border-white/20 text-accent focus:ring-accent">
      </td>
      <td class="py-3.5 px-4 font-mono text-accent font-bold">#${item.id}</td>
      <td class="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">${formatDate(item.created_at)}</td>
      <td class="py-3.5 px-4">
        <div class="font-semibold text-white">${escapeHtml(item.name)}</div>
        <div class="text-slate-400 font-mono text-[11px]">${escapeHtml(item.email)}</div>
        <div class="text-emerald-400 font-mono text-[11px]">${escapeHtml(item.phone)}</div>
      </td>
      <td class="py-3.5 px-4">${escapeHtml(item.company || 'N/A')}</td>
      <td class="py-3.5 px-4">
        <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
          ${escapeHtml(item.service || 'General')}
        </span>
      </td>
      <td class="py-3.5 px-4 font-mono text-emerald-300 font-semibold">${escapeHtml(item.budget || 'N/A')}</td>
      <td class="py-3.5 px-4 max-w-xs leading-relaxed text-slate-300 line-clamp-2" title="${escapeHtml(item.message)}">
        ${escapeHtml(item.message)}
      </td>
      <td class="py-3.5 px-4 text-right whitespace-nowrap">
        <button onclick="openDetailModal('contact', ${item.id})" class="text-accent hover:text-purple-300 font-mono text-[11px] hover:underline mr-3">
          View
        </button>
        <button onclick="deleteSubmission('contact', ${item.id})" class="text-red-400 hover:text-red-300 font-mono text-[11px] hover:underline">
          Delete
        </button>
      </td>
    </tr>
  `}).join('');
}

export function renderTalentTable(items) {
  const tbody = document.getElementById('talent-table-body');
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-12 text-slate-500 font-mono">No talent profiles registered in database.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const isChecked = state.selectedIds.has(item.id) ? 'checked' : '';
    return `
    <tr class="hover:bg-white/[0.02] transition-colors">
      <td class="py-3.5 px-4 text-center">
        <input type="checkbox" value="${item.id}" ${isChecked} onchange="toggleSelectRow(${item.id}, this)" class="rounded bg-black/50 border-white/20 text-emerald-500 focus:ring-emerald-500">
      </td>
      <td class="py-3.5 px-4 font-mono text-emerald-400 font-bold">#${item.id}</td>
      <td class="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">${formatDate(item.created_at)}</td>
      <td class="py-3.5 px-4">
        <div class="font-semibold text-white">${escapeHtml(item.name)}</div>
        <div class="text-slate-400 font-mono text-[11px]">${escapeHtml(item.email)}</div>
        <div class="text-emerald-400 font-mono text-[11px]">${escapeHtml(item.phone)}</div>
      </td>
      <td class="py-3.5 px-4 font-semibold text-purple-300">${escapeHtml(item.role)}</td>
      <td class="py-3.5 px-4 font-mono text-slate-300">${escapeHtml(item.experience || 'N/A')} Yrs</td>
      <td class="py-3.5 px-4">${escapeHtml(item.location || 'N/A')}</td>
      <td class="py-3.5 px-4 font-mono text-amber-300">${escapeHtml(item.notice_period || 'N/A')}</td>
      <td class="py-3.5 px-4 max-w-xs">
        ${item.resume_url ? `<a href="${escapeHtml(item.resume_url)}" target="_blank" rel="noopener noreferrer" class="text-accent underline font-mono text-[11px] truncate block">${escapeHtml(item.resume_url)}</a>` : '<span class="text-slate-500 font-mono">N/A</span>'}
      </td>
      <td class="py-3.5 px-4 text-right whitespace-nowrap">
        <button onclick="openDetailModal('talent', ${item.id})" class="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] hover:underline mr-3">
          View
        </button>
        <button onclick="deleteSubmission('talent', ${item.id})" class="text-red-400 hover:text-red-300 font-mono text-[11px] hover:underline">
          Delete
        </button>
      </td>
    </tr>
  `}).join('');
}

export function switchTab(tab) {
  state.activeTab = tab;
  state.selectedIds.clear();
  updateBatchButton();

  const contactBtn = document.getElementById('tab-contact-btn');
  const talentBtn = document.getElementById('tab-talent-btn');
  const contactContent = document.getElementById('contact-tab-content');
  const talentContent = document.getElementById('talent-tab-content');

  if (tab === 'contact') {
    contactBtn.className = 'px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all bg-accent text-white shadow-lg';
    talentBtn.className = 'px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all text-slate-400 hover:text-white';
    contactContent.classList.remove('hidden');
    talentContent.classList.add('hidden');
  } else {
    talentBtn.className = 'px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all bg-emerald-600 text-white shadow-lg';
    contactBtn.className = 'px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all text-slate-400 hover:text-white';
    talentContent.classList.remove('hidden');
    contactContent.classList.add('hidden');
  }
  filterTable();
}

export function filterTable() {
  const q = document.getElementById('search-input').value.toLowerCase().trim();
  if (state.activeTab === 'contact') {
    const filtered = state.contactData.filter(item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.company || '').toLowerCase().includes(q) ||
      (item.service || '').toLowerCase().includes(q) ||
      (item.message || '').toLowerCase().includes(q)
    );
    renderContactTable(filtered);
  } else {
    const filtered = state.talentData.filter(item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.role || '').toLowerCase().includes(q) ||
      (item.location || '').toLowerCase().includes(q)
    );
    renderTalentTable(filtered);
  }
}

export function toggleSelectRow(id, cb) {
  if (cb.checked) {
    state.selectedIds.add(id);
  } else {
    state.selectedIds.delete(id);
  }
  updateBatchButton();
}

export function toggleSelectAll(masterCb) {
  const currentList = state.activeTab === 'contact' ? state.contactData : state.talentData;
  state.selectedIds.clear();
  if (masterCb.checked) {
    currentList.forEach(item => state.selectedIds.add(item.id));
  }
  filterTable();
  updateBatchButton();
}

export function updateBatchButton() {
  const btn = document.getElementById('batch-delete-btn');
  const countSpan = document.getElementById('selected-count');
  if (state.selectedIds.size > 0) {
    btn.classList.remove('hidden');
    btn.classList.add('flex');
    countSpan.innerText = state.selectedIds.size;
  } else {
    btn.classList.add('hidden');
    btn.classList.remove('flex');
  }
}

export async function deleteSubmission(type, id) {
  if (!confirm(`Are you sure you want to delete submission #${id}?`)) return;

  try {
    const res = await fetch(`/api/submissions/${type}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (json.success) {
      closeModal();
      loadAllSubmissions();
    } else {
      alert('Error deleting submission: ' + json.error);
    }
  } catch (err) {
    alert('Network error deleting submission');
  }
}

export async function deleteSelected() {
  if (state.selectedIds.size === 0) return;
  if (!confirm(`Are you sure you want to delete ${state.selectedIds.size} selected submissions?`)) return;

  try {
    const ids = Array.from(state.selectedIds);
    const res = await fetch(`/api/submissions/${state.activeTab}/batch-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids })
    });
    const json = await res.json();
    if (json.success) {
      loadAllSubmissions();
    } else {
      alert('Error batch deleting: ' + json.error);
    }
  } catch (err) {
    alert('Network error during batch delete');
  }
}
```

Note every reference to the old bare `contactData`/`talentData`/`selectedIds`/`activeTab` variables became `state.contactData` / `state.talentData` / `state.selectedIds` / `state.activeTab` — that's the one systematic rename this split requires, and it's why `state.js` exists.

- [ ] **Step 5: Create `src/js/admin/export.js`**

Copy verbatim: `toggleExportMenu` (806-809), `exportData` (819-852), `generateCSV` (854-868), `downloadBlob` (870-879), and the outside-click-closes-dropdown listener (811-817):

```js
import { state } from './state.js';

export function toggleExportMenu() {
  const menu = document.getElementById('export-dropdown');
  menu.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('export-dropdown');
  const btn = e.target.closest('button[onclick="toggleExportMenu()"]');
  if (!btn && dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

export function exportData(format, allTabs) {
  document.getElementById('export-dropdown').classList.add('hidden');

  let exportPayload = [];
  let filenamePrefix = '';

  if (allTabs) {
    filenamePrefix = 'spark_point_all_submissions';
    exportPayload = {
      contact_submissions: state.contactData,
      talent_submissions: state.talentData
    };
  } else {
    filenamePrefix = `spark_point_${state.activeTab}_submissions`;
    exportPayload = state.activeTab === 'contact' ? state.contactData : state.talentData;
  }

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.json`);
  } else if (format === 'csv') {
    if (allTabs) {
      const contactCsv = generateCSV(state.contactData);
      const talentCsv = generateCSV(state.talentData);
      downloadBlob(new Blob([contactCsv], { type: 'text/csv' }), `spark_point_contact_enquiries_${new Date().toISOString().split('T')[0]}.csv`);
      setTimeout(() => {
        downloadBlob(new Blob([talentCsv], { type: 'text/csv' }), `spark_point_talent_profiles_${new Date().toISOString().split('T')[0]}.csv`);
      }, 300);
    } else {
      const csvText = generateCSV(exportPayload);
      downloadBlob(new Blob([csvText], { type: 'text/csv' }), `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
    }
  }
}

function generateCSV(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
```

- [ ] **Step 6: Create `src/js/admin/utils.js`**

Copy verbatim: `formatDate` (1056-1060), `escapeHtml` (1062-1070), `copyToClipboard` (1051-1054), `toggleAccessGuide` (801-804):

```js
export function toggleAccessGuide() {
  const drawer = document.getElementById('access-guide-drawer');
  drawer.classList.toggle('hidden');
}

export function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  alert('Copied to clipboard: ' + text);
}

export function formatDate(str) {
  if (!str) return 'N/A';
  const d = new Date(str);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

- [ ] **Step 7: Create `src/js/admin/modals.js`**

Copy verbatim: `openDetailModal` (881-1007), `closeModal` (1009-1011), `openChangePasswordModal` (1013-1015), `closePasswordModal` (1017-1019), `handleChangePassword` (1021-1049):

```js
import { state } from './state.js';
import { getAuthHeaders } from './auth.js';
import { escapeHtml } from './utils.js';

export function openDetailModal(type, id) {
  const dataList = type === 'contact' ? state.contactData : state.talentData;
  const item = dataList.find(d => d.id === id);
  if (!item) return;

  const modal = document.getElementById('detail-modal');
  const tag = document.getElementById('modal-type-tag');
  const modalId = document.getElementById('modal-id');
  const body = document.getElementById('modal-body-content');
  const deleteBtn = document.getElementById('modal-delete-btn');

  modalId.innerText = `#${item.id}`;
  deleteBtn.setAttribute('onclick', `deleteSubmission('${type}', ${item.id})`);

  if (type === 'contact') {
    tag.className = 'text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/20 text-accent border border-accent/30';
    tag.innerText = 'Project Enquiry';

    body.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Full Name</span>
          <span class="text-sm font-semibold text-white">${escapeHtml(item.name)}</span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Submission Date</span>
          <span class="text-xs font-mono text-purple-300">${formatDate(item.created_at)}</span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Email Address</span>
          <span class="text-xs font-mono text-accent font-semibold flex items-center space-x-2">
            <span>${escapeHtml(item.email)}</span>
            <button onclick="copyToClipboard('${escapeHtml(item.email)}')" class="hover:text-white text-[10px]">📋 Copy</button>
          </span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Phone / WhatsApp</span>
          <span class="text-xs font-mono text-emerald-400 font-semibold flex items-center space-x-2">
            <span>${escapeHtml(item.phone)}</span>
            <button onclick="copyToClipboard('${escapeHtml(item.phone)}')" class="hover:text-white text-[10px]">📋 Copy</button>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Company / Website</span>
          <span class="text-xs font-semibold text-white">${escapeHtml(item.company || 'N/A')}</span>
        </div>
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Service Requested</span>
          <span class="text-xs font-semibold text-purple-300">${escapeHtml(item.service || 'General')}</span>
        </div>
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Budget</span>
          <span class="text-xs font-mono font-bold text-emerald-300">${escapeHtml(item.budget || 'N/A')}</span>
        </div>
      </div>

      <div class="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/10">
        <span class="text-slate-400 font-mono text-[10px] uppercase block">Project Overview / Message</span>
        <div class="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap pt-1 font-sans">${escapeHtml(item.message)}</div>
      </div>
    `;
  } else {
    tag.className = 'text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    tag.innerText = 'Talent Profile';

    body.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Candidate Name</span>
          <span class="text-sm font-semibold text-white">${escapeHtml(item.name)}</span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Registration Date</span>
          <span class="text-xs font-mono text-purple-300">${formatDate(item.created_at)}</span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Email Address</span>
          <span class="text-xs font-mono text-accent font-semibold flex items-center space-x-2">
            <span>${escapeHtml(item.email)}</span>
            <button onclick="copyToClipboard('${escapeHtml(item.email)}')" class="hover:text-white text-[10px]">📋 Copy</button>
          </span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Phone / WhatsApp</span>
          <span class="text-xs font-mono text-emerald-400 font-semibold flex items-center space-x-2">
            <span>${escapeHtml(item.phone)}</span>
            <button onclick="copyToClipboard('${escapeHtml(item.phone)}')" class="hover:text-white text-[10px]">📋 Copy</button>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Primary Expertise</span>
          <span class="text-xs font-semibold text-purple-300">${escapeHtml(item.role)}</span>
        </div>
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Experience</span>
          <span class="text-xs font-mono text-white">${escapeHtml(item.experience || 'N/A')} Yrs</span>
        </div>
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Location</span>
          <span class="text-xs font-semibold text-slate-200">${escapeHtml(item.location || 'N/A')}</span>
        </div>
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Notice Period</span>
          <span class="text-xs font-mono text-amber-300 font-semibold">${escapeHtml(item.notice_period || 'N/A')}</span>
        </div>
      </div>

      <div class="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/10">
        <span class="text-slate-400 font-mono text-[10px] uppercase block">Resume / Portfolio / GitHub</span>
        ${item.resume_url ? `
          <div class="flex items-center justify-between pt-1">
            <a href="${escapeHtml(item.resume_url)}" target="_blank" rel="noopener noreferrer" class="text-accent underline font-mono text-xs break-all">${escapeHtml(item.resume_url)}</a>
            <button onclick="copyToClipboard('${escapeHtml(item.resume_url)}')" class="hover:text-white text-[10px] font-mono shrink-0 ml-2">📋 Copy Link</button>
          </div>
        ` : '<span class="text-slate-500 font-mono text-xs block pt-1">No link provided</span>'}
      </div>
    `;
  }

  modal.classList.remove('hidden');
}

export function closeModal() {
  document.getElementById('detail-modal').classList.add('hidden');
}

export function openChangePasswordModal() {
  document.getElementById('password-modal').classList.remove('hidden');
}

export function closePasswordModal() {
  document.getElementById('password-modal').classList.add('hidden');
}

export async function handleChangePassword(e) {
  e.preventDefault();
  const curr = document.getElementById('current-pass-input').value;
  const newP = document.getElementById('new-pass-input').value;
  const msgDiv = document.getElementById('pass-msg');

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword: curr, newPassword: newP })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      msgDiv.className = 'text-xs font-mono p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      msgDiv.innerText = 'Password updated successfully!';
      msgDiv.classList.remove('hidden');
      setTimeout(() => closePasswordModal(), 1500);
    } else {
      msgDiv.className = 'text-xs font-mono p-2.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30';
      msgDiv.innerText = json.error || 'Failed to update password.';
      msgDiv.classList.remove('hidden');
    }
  } catch (err) {
    msgDiv.className = 'text-xs font-mono p-2.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30';
    msgDiv.innerText = 'Network error updating password.';
    msgDiv.classList.remove('hidden');
  }
}
```

Add the missing `formatDate` import at the top alongside the others:
```js
import { formatDate, escapeHtml } from './utils.js';
```

- [ ] **Step 8: Create `src/js/admin/dashboard.js`** — the entry point

```js
import { checkAuth } from './auth.js';
import * as auth from './auth.js';
import * as data from './data.js';
import * as exportModule from './export.js';
import * as modals from './modals.js';
import { toggleAccessGuide, copyToClipboard } from './utils.js';

// ES modules don't leak declarations onto `window` the way classic scripts
// do, but this page's HTML still calls these functions via inline
// onclick/onsubmit/onchange attributes — so they're exported explicitly.
window.handleLogin = auth.handleLogin;
window.preventUndo = auth.preventUndo;
window.handleLogout = auth.handleLogout;
window.loadAllSubmissions = data.loadAllSubmissions;
window.switchTab = data.switchTab;
window.filterTable = data.filterTable;
window.deleteSelected = data.deleteSelected;
window.toggleSelectAll = data.toggleSelectAll;
window.toggleSelectRow = data.toggleSelectRow;
window.deleteSubmission = data.deleteSubmission;
window.toggleExportMenu = exportModule.toggleExportMenu;
window.exportData = exportModule.exportData;
window.openDetailModal = modals.openDetailModal;
window.closeModal = modals.closeModal;
window.openChangePasswordModal = modals.openChangePasswordModal;
window.closePasswordModal = modals.closePasswordModal;
window.handleChangePassword = modals.handleChangePassword;
window.toggleAccessGuide = toggleAccessGuide;
window.copyToClipboard = copyToClipboard;

document.addEventListener('DOMContentLoaded', checkAuth);
```

- [ ] **Step 9: Replace the inline `<script>` block in `admin.html`**

Replace the entire `<script>...</script>` block (today's lines 434-1073) with:

```html
  <script type="module" src="/src/js/admin/dashboard.js"></script>
```

- [ ] **Step 10: Verify end-to-end**

```bash
npm run dev
```

You need a working backend for this (`npm run server` in another terminal, or `npm run dev` already runs both per `package.json`'s `dev` script). Open `http://localhost:3000/admin.html` and walk through:
- Log in with valid admin credentials → dashboard should load and show submission counts
- Switch between the "Project Enquiries" and "Talent Profiles" tabs
- Type in the search box → table rows filter live
- Click "View" on a row → detail modal opens with correct data
- Click a "Copy" button in the modal → clipboard copy + alert fires
- Close the modal
- Select a row's checkbox → "Delete Selected" button appears with correct count
- Click "Export Data" → dropdown opens, click "Export CSV (Current View)" → file downloads
- Click "Vercel Cloud Setup Guide" → drawer expands
- Open the password-change modal, cancel out of it
- Log out → returns to login screen
- Log back in

- [ ] **Step 11: Commit**

```bash
git add admin.html src/js/admin
git commit -m "refactor: split admin.html's inline script into modules"
```

---

### Task 9: Write the architecture guide

**Files:**
- Create: `ARCHITECTURE.md`

- [ ] **Step 1: Write it**

```markdown
# Architecture

This documents how the codebase is organized and where to add new code. It's written for whoever touches this repo next — including future you.

## Frontend build

Vite builds two HTML entry points: `index.html` (main site) and `admin.html` (admin dashboard). Both use a small custom Vite plugin (`vite-plugin-html-includes.js`) that resolves `<!--@include some/file.html-->` comment markers by inlining the referenced file, recursively, at both `vite dev` and `vite build` time. This means the *shipped* HTML is always one fully-inlined file (important for SEO — crawlers see the same markup they always did), while the *source* is split into small per-section files under `src/partials/`.

To add a new page section: create `src/partials/sections/your-section.html` as a complete, self-contained fragment (its own opening/closing tag included), then add `<!--@include sections/your-section.html-->` to `index.html` where it should appear.

## Frontend JavaScript

`src/main.js` is intentionally thin — it only imports `init...()` functions from `src/js/*` and calls them on `DOMContentLoaded`. All actual logic lives in focused modules:

- `src/js/three/` — the Three.js hero scene, CTA scene, and the shared 3D phone model they both build from (`iphone-model.js`)
- `src/js/animations/` — GSAP/scroll-driven effects (karaoke text, timeline scrubber, CTA doors, FAQ accordion)
- `src/js/forms/` — the contact and talent form submit handlers, sharing common fetch/status-message logic via `submit-helper.js`
- `src/js/admin/` — the admin dashboard's logic, split by concern (`auth.js`, `data.js`, `export.js`, `modals.js`, `utils.js`), sharing dashboard state via `state.js`, wired together by `dashboard.js`
- `src/js/utils/` — small stateless helpers with no DOM/page-specific knowledge (e.g. `debounce.js`)

To add a new interactive behavior: create a new file in the most relevant folder above, export an `init...()` function, import and call it from `src/main.js` (or `dashboard.js` for admin-only behavior).

**A note on `admin.html`'s inline `onclick="..."` attributes:** they still work because `src/js/admin/dashboard.js` explicitly assigns the functions those attributes call onto `window` (classic non-module scripts do this automatically; ES modules don't). If you add a new inline handler in admin markup, its function needs the same `window.yourFunction = yourFunction;` treatment in `dashboard.js`.

## CSS

`src/styles/main.css` (main site) and `src/styles/admin.css` (admin) each carry their own `@tailwind` directives — they're independent Tailwind builds, not because the design differs, but because `admin.html` and `index.html` are separate Vite entry points. Shared design tokens (`accent`, `accentGlow`, etc.) live once in `tailwind.config.js`. Admin-specific background colors that don't match the main site's exact shades are namespaced (`adminBgDark`, `adminSurfaceDark`, `adminSurfaceCard`) rather than overloading the main site's token names — this keeps each page's exact colors intact without one config silently overriding the other.

Component-specific CSS (things Tailwind's utility classes don't cover — glass-panel blur effects, the karaoke word-highlight transition, etc.) lives one file per component under `src/styles/components/`, imported from `main.css`.

## Performance choices worth knowing about

The hero and CTA Three.js scenes each use an `IntersectionObserver` on their relevant section (`#hero-section`, `#contact`) to stop their `requestAnimationFrame` loop entirely when that section is scrolled out of view, and resume it when scrolled back in. Both scenes' `resize` handlers are debounced. The CTA scene's module and the talent form's module are loaded via dynamic `import()` from `src/main.js` rather than a static import, since both are below the fold and don't need to be in the initial JS payload.

## Backend

See the "Backend" section below (added when the backend restructure runs) — or if you're reading this before that plan has run, check `server/app.js` directly for now.
```

- [ ] **Step 2: Commit**

```bash
git add ARCHITECTURE.md
git commit -m "docs: add ARCHITECTURE.md covering the frontend restructure"
```

---

### Task 10: Final full-site verification and cleanup

**Files:** none (verification only)

- [ ] **Step 1: Full production build**

```bash
npm run build
npm run preview
```

Open the preview URL, click through every nav link, scroll the entire page top to bottom, submit both forms (contact + talent — use throwaway test data), open `/admin.html` and log in.

- [ ] **Step 2: Confirm no console errors**

Open browser devtools console while doing the above. Expected: no red errors. (Warnings are fine if they existed before this refactor — check by comparing against `git stash` + rebuild if anything looks new and suspicious.)

- [ ] **Step 3: Clean up the baseline snapshot**

```bash
rm -rf /tmp/spi-baseline-dist
```

- [ ] **Step 4: Final commit if anything was left uncommitted**

```bash
git status
```

Expected: clean working tree (everything committed task-by-task already). If anything's outstanding, commit it now.

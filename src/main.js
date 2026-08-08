import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './style.css';

gsap.registerPlugin(ScrollTrigger);

// Configure GSAP ticker for 60 FPS performance optimization
gsap.ticker.fps(60);

// ==========================================
// 1. INITIALIZER LOADING SCREEN
// ==========================================
function initLoadingScreen() {
  const loadingBar = document.getElementById('loading-bar');
  const loadingPercent = document.getElementById('loading-percent');
  const loadingScreen = document.getElementById('loading-screen');
  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 8) + 5;
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
      }, 400);
    } else {
      if (loadingBar) loadingBar.style.width = `${progress}%`;
      if (loadingPercent) loadingPercent.innerText = `${progress}%`;
    }
  }, 35);
}

// ==========================================
// 2. ROUNDED CORNER SHAPE GENERATOR
// ==========================================
function createRoundedCornerShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

// Optimized Screen Texture (512 x 1024 for 75% memory reduction & 60 FPS smoothness)
function createDynamicScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  function renderTexture() {
    // Background
    ctx.fillStyle = '#06030d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // iOS Status Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText('9:41', 30, 32);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(450, 21, 25, 13);
    ctx.fillRect(452, 23, 18, 9);
    ctx.fillRect(476, 25, 2, 5);

    // Header Gradient
    const grad = ctx.createLinearGradient(0, 50, 0, 160);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    grad.addColorStop(1, 'rgba(10, 6, 20, 0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 50, canvas.width, 110);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.fillText('Spark Point Infotech', 30, 92);

    ctx.fillStyle = '#A855F7';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('SOFTWARE DEVELOPMENT COMPANY', 30, 118);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('India • Germany • Netherlands', 30, 140);

    // Hero Card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(20, 170, 472, 190, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('• WRITTEN SPECIFICATION LOCK', 40, 200);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 21px Inter, sans-serif';
    ctx.fillText('Software built to written spec', 40, 232);

    ctx.fillStyle = '#EAEAEA';
    ctx.font = '15px Inter, sans-serif';
    ctx.fillText('Every project starts with a written scope,', 40, 262);
    ctx.fillText('a fixed price and a dated schedule.', 40, 285);

    // Badges
    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.beginPath();
    ctx.roundRect(40, 308, 190, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#A855F7';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('FIXED GUARANTEE', 55, 328);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.beginPath();
    ctx.roundRect(240, 308, 230, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('• SUB-2s LOAD TIME', 255, 328);

    // Services List
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(20, 375, 472, 300, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText('Five Core Services', 40, 408);

    const services = [
      { name: 'Website development', detail: 'Sub-2s load time, SEO & CMS' },
      { name: 'Custom web applications', detail: 'Portals, dashboards & role permissions' },
      { name: 'Mobile app development', detail: 'iOS & Android single codebase' },
      { name: 'UI/UX design', detail: 'Figma component design tokens' },
      { name: 'Maintenance & support', detail: 'Security patching & monitoring' }
    ];

    services.forEach((s, idx) => {
      const y = 438 + idx * 47;
      ctx.fillStyle = idx % 2 === 0 ? '#8B5CF6' : '#A855F7';
      ctx.beginPath();
      ctx.arc(48, y + 6, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(s.name, 65, y + 10);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(s.detail, 65, y + 26);
    });

    // Console Log
    ctx.fillStyle = 'rgba(10, 6, 20, 0.85)';
    ctx.beginPath();
    ctx.roundRect(20, 690, 472, 280, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.stroke();

    ctx.fillStyle = '#A855F7';
    ctx.font = '13px monospace';
    ctx.fillText('const project = await SparkPoint.start({', 40, 720);
    ctx.fillText('  scope: "Written Specification",', 40, 745);
    ctx.fillText('  pricing: "Fixed Guarantee",', 40, 770);
    ctx.fillText('  schedule: "Dated Milestone Delivery"', 40, 795);
    ctx.fillText('});', 40, 820);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('> BUILD STATUS: 100% VERIFIED', 40, 885);
    ctx.fillText('> REPOSITORY TRANSFER: DAY ONE READY', 40, 910);

    // iOS Home Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(186, 1005, 140, 5, 2.5);
    ctx.fill();
  }

  renderTexture();
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return { texture, canvas, renderTexture };
}

// Authentic iPhone Mesh with Optimized Geometry & Performance
function createAuthenticIPhoneMesh() {
  const phoneGroup = new THREE.Group();

  const width = 3.2;
  const height = 6.6;
  const depth = 0.32;
  const radius = 0.55;

  // 1. Titanium Frame Body
  const bodyShape = createRoundedCornerShape(width, height, radius);
  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 3
  };
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
  bodyGeo.center();

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x1f1533,
    metalness: 0.9,
    roughness: 0.2
  });

  const bodyMesh = new THREE.Mesh(bodyGeo, titaniumMat);
  phoneGroup.add(bodyMesh);

  // 2. Antenna Bands
  const bandMat = new THREE.MeshBasicMaterial({ color: 0x4a3b6e });
  const bandGeo = new THREE.BoxGeometry(width + 0.14, 0.03, depth + 0.14);
  
  const bandTop = new THREE.Mesh(bandGeo, bandMat);
  bandTop.position.set(0, 2.2, 0);
  phoneGroup.add(bandTop);

  const bandBottom = new THREE.Mesh(bandGeo, bandMat);
  bandBottom.position.set(0, -2.2, 0);
  phoneGroup.add(bandBottom);

  // 3. Front Display Screen & Bezel with CURVED EDGES
  const screenBezelShape = createRoundedCornerShape(width - 0.08, height - 0.08, radius - 0.04);
  const screenBezelGeo = new THREE.ShapeGeometry(screenBezelShape);
  const screenBezelMat = new THREE.MeshBasicMaterial({ color: 0x05030a });
  const screenBezelMesh = new THREE.Mesh(screenBezelGeo, screenBezelMat);
  screenBezelMesh.position.set(0, 0, depth / 2 + 0.065);
  phoneGroup.add(screenBezelMesh);

  // Dynamic Screen Mesh
  const { texture: screenTexture } = createDynamicScreenTexture();
  const screenShape = createRoundedCornerShape(width - 0.22, height - 0.22, radius - 0.11);
  const screenGeo = new THREE.ShapeGeometry(screenShape);

  const pos = screenGeo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ux = (pos.getX(i) + (width - 0.22) / 2) / (width - 0.22);
    const uy = (pos.getY(i) + (height - 0.22) / 2) / (height - 0.22);
    uvs[i * 2] = ux;
    uvs[i * 2 + 1] = uy;
  }
  screenGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0, 0, depth / 2 + 0.068);
  phoneGroup.add(screenMesh);

  // 4. Dynamic Island Notch
  const islandShape = createRoundedCornerShape(0.75, 0.22, 0.11);
  const islandGeo = new THREE.ShapeGeometry(islandShape);
  const islandMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const islandMesh = new THREE.Mesh(islandGeo, islandMat);
  islandMesh.position.set(0, 2.85, depth / 2 + 0.071);
  phoneGroup.add(islandMesh);

  const cameraDotGeo = new THREE.CircleGeometry(0.04, 12);
  const cameraDotMat = new THREE.MeshBasicMaterial({ color: 0x111122 });
  const cameraDot = new THREE.Mesh(cameraDotGeo, cameraDotMat);
  cameraDot.position.set(-0.2, 2.85, depth / 2 + 0.073);
  phoneGroup.add(cameraDot);

  // 5. Rear Camera Bump
  const bumpWidth = 1.35;
  const bumpHeight = 1.35;
  const bumpShape = createRoundedCornerShape(bumpWidth, bumpHeight, 0.3);
  const bumpExtrude = {
    steps: 1,
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2
  };
  const bumpGeo = new THREE.ExtrudeGeometry(bumpShape, bumpExtrude);
  const bumpMat = new THREE.MeshStandardMaterial({
    color: 0x1d1433,
    metalness: 0.8,
    roughness: 0.25
  });
  const bumpMesh = new THREE.Mesh(bumpGeo, bumpMat);
  bumpMesh.position.set(-0.75, 2.05, -depth / 2 - 0.06);
  phoneGroup.add(bumpMesh);

  function createCameraLens(x, y) {
    const lensGroup = new THREE.Group();

    const ringGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 20);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, metalness: 0.95, roughness: 0.1 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    lensGroup.add(ringMesh);

    const glassGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.085, 20);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x050510, roughness: 0.05, metalness: 0.2 });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.rotation.x = Math.PI / 2;
    lensGroup.add(glassMesh);

    lensGroup.position.set(x, y, -depth / 2 - 0.12);
    return lensGroup;
  }

  phoneGroup.add(createCameraLens(-1.05, 2.35));
  phoneGroup.add(createCameraLens(-1.05, 1.75));
  phoneGroup.add(createCameraLens(-0.45, 2.05));

  const flashGeo = new THREE.CircleGeometry(0.08, 12);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xfff0cc });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  flashMesh.position.set(-0.45, 2.42, -depth / 2 - 0.11);
  flashMesh.rotation.y = Math.PI;
  phoneGroup.add(flashMesh);

  // 6. Outer Glow Sprite
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 64;
  glowCanvas.height = 64;
  const gCtx = glowCanvas.getContext('2d');
  const radGrad = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  radGrad.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
  radGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
  gCtx.fillStyle = radGrad;
  gCtx.fillRect(0, 0, 64, 64);

  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x8B5CF6,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(7.5, 10.5, 1);
  sprite.position.set(0, 0, -0.2);
  phoneGroup.add(sprite);

  phoneGroup.scale.set(0.72, 0.72, 0.72);

  return phoneGroup;
}

// ==========================================
// 3. MAIN HERO THREE.JS SCENE (Butter-Smooth 60 FPS)
// ==========================================
let heroScene, heroCamera, heroRenderer, phoneGroup, ring1, ring2, particlesMesh;

function initHeroThreeCanvas() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const maxPixelRatio = Math.min(window.devicePixelRatio, 1.25);

  heroScene = new THREE.Scene();
  heroScene.fog = new THREE.FogExp2(0x020202, 0.045);

  heroCamera = new THREE.PerspectiveCamera(26, window.innerWidth / window.innerHeight, 0.1, 100);
  heroCamera.position.set(0, 0, 15);

  // High performance WebGL renderer with real-time shadow map disabled for 60 FPS
  heroRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  heroRenderer.setSize(window.innerWidth, window.innerHeight);
  heroRenderer.setPixelRatio(maxPixelRatio);
  heroRenderer.shadowMap.enabled = false; // Disabled real-time shadow map to eliminate GPU lag!
  container.appendChild(heroRenderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  heroScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 7);
  heroScene.add(dirLight);

  const pointLight1 = new THREE.PointLight(0x8B5CF6, 3, 20);
  pointLight1.position.set(-4, 2, 4);
  heroScene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xA855F7, 2.5, 20);
  pointLight2.position.set(4, -2, 4);
  heroScene.add(pointLight2);

  // Optimized Particle Count
  const particleCount = 500;
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
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  particlesMesh = new THREE.Points(pGeo, pMat);
  heroScene.add(particlesMesh);

  // iPhone 3D Instance
  phoneGroup = createAuthenticIPhoneMesh();
  heroScene.add(phoneGroup);

  // Tech Rings
  const ringGeo1 = new THREE.TorusGeometry(4.2, 0.015, 12, 60);
  const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x8B5CF6, transparent: true, opacity: 0.4 });
  ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  ring1.rotation.x = Math.PI / 3;
  heroScene.add(ring1);

  const ringGeo2 = new THREE.TorusGeometry(4.8, 0.012, 12, 60);
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xA855F7, transparent: true, opacity: 0.3 });
  ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.y = Math.PI / 4;
  heroScene.add(ring2);

  phoneGroup.rotation.x = 0.12;
  phoneGroup.rotation.y = -0.18;

  window.addEventListener('resize', onWindowResize, { passive: true });

  let clock = new THREE.Clock();

  function animateHero() {
    requestAnimationFrame(animateHero);

    // Pause WebGL rendering when hero section is out of viewport (after 4.2x viewport scroll)
    if (window.scrollY > window.innerHeight * 4.2) return;

    const elapsedTime = clock.getElapsedTime();

    if (particlesMesh) particlesMesh.rotation.y = elapsedTime * 0.03;
    if (ring1) ring1.rotation.z = elapsedTime * 0.12;
    if (ring2) ring2.rotation.x = elapsedTime * 0.1;

    if (heroRenderer && heroScene && heroCamera) {
      heroRenderer.render(heroScene, heroCamera);
    }
  }

  animateHero();
  setupHeroScrollAnimation();
}

function onWindowResize() {
  if (!heroCamera || !heroRenderer) return;
  heroCamera.aspect = window.innerWidth / window.innerHeight;
  heroCamera.updateProjectionMatrix();
  heroRenderer.setSize(window.innerWidth, window.innerHeight);

  if (ctaCamera && ctaRenderer) {
    ctaCamera.aspect = window.innerWidth / window.innerHeight;
    ctaCamera.updateProjectionMatrix();
    ctaRenderer.setSize(window.innerWidth, window.innerHeight);
  }
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
      scrub: 0.5, // Reduced scrub lag from 1 to 0.5 for instant responsive feel
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

// ==========================================
// 4. SECONDARY CTA THREE.JS CANVAS
// ==========================================
let ctaScene, ctaCamera, ctaRenderer, ctaPhoneGroup;

function initCtaThreeCanvas() {
  const container = document.getElementById('cta-canvas');
  if (!container) return;

  const maxPixelRatio = Math.min(window.devicePixelRatio, 1.25);

  ctaScene = new THREE.Scene();
  ctaCamera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);
  ctaCamera.position.set(0, 0, 12);

  ctaRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  ctaRenderer.setSize(window.innerWidth, window.innerHeight);
  ctaRenderer.setPixelRatio(maxPixelRatio);
  container.appendChild(ctaRenderer.domElement);

  const amb = new THREE.AmbientLight(0xffffff, 0.7);
  ctaScene.add(amb);

  const pLight = new THREE.PointLight(0xA855F7, 3.5, 15);
  pLight.position.set(0, 0, 6);
  ctaScene.add(pLight);

  ctaPhoneGroup = createAuthenticIPhoneMesh();
  ctaPhoneGroup.scale.set(0.75, 0.75, 0.75);
  ctaScene.add(ctaPhoneGroup);

  let mouseX = 0, mouseY = 0;
  let mouseTicking = false;

  window.addEventListener('mousemove', (e) => {
    if (!mouseTicking) {
      requestAnimationFrame(() => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 0.8;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 0.8;
        mouseTicking = false;
      });
      mouseTicking = true;
    }
  }, { passive: true });

  let clock = new THREE.Clock();

  function animateCta() {
    requestAnimationFrame(animateCta);

    // Suppress WebGL rendering when CTA section is far out of viewport
    const ctaEl = document.getElementById('contact');
    if (ctaEl) {
      const rect = ctaEl.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight * 1.5) return;
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

// ==========================================
// 5. KARAOKE SCROLL TEXT EFFECT (Throttled & Reflow-Free)
// ==========================================
function initKaraokeText() {
  const container = document.getElementById('kakaoke-text');
  if (!container) return;

  const rawText = container.innerText.trim();
  const words = rawText.split(' ');

  container.innerHTML = words
    .map(word => `<span class="karaoke-word mr-2">${word}</span>`)
    .join('');

  const wordElements = container.querySelectorAll('.karaoke-word');
  let ticking = false;

  function updateKaraokeProgress() {
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
      requestAnimationFrame(updateKaraokeProgress);
      ticking = true;
    }
  }, { passive: true });
}

// ==========================================
// 6. CHRONOMETRIC TIMELINE SCRUBBER
// ==========================================
function initTimelineScrubber() {
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
      scrub: 0.3,
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

// ==========================================
// 7. CTA SPLIT DOORS TRANSITION & START PROJECT FUNCTIONALITY
// ==========================================
function initCtaDoors() {
  const doorLeft = document.getElementById('cta-door-left');
  const doorRight = document.getElementById('cta-door-right');
  const wrapper = document.getElementById('cta-door-wrapper');

  if (!doorLeft || !doorRight || !wrapper) return;

  gsap.timeline({
    scrollTrigger: {
      trigger: '#cta-door-wrapper',
      start: 'top top',
      end: '80% bottom',
      scrub: 0.4,
      invalidateOnRefresh: true
    }
  })
  .to(doorLeft, { xPercent: -100, ease: 'none' }, 0)
  .to(doorRight, { xPercent: 100, ease: 'none' }, 0);

  const contactLinks = document.querySelectorAll('a[href="#contact"]');
  contactLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetScroll = wrapper.offsetTop + (wrapper.offsetHeight * 0.45);
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    });
  });
}

// ==========================================
// 8. FAQ ACCORDION
// ==========================================
function initFaqAccordion() {
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

// ==========================================
// 9. FORMS HANDLER (Contact & Careers)
// ==========================================
function initForms() {
  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (contactStatus) {
        contactStatus.classList.remove('hidden');
        contactForm.reset();
        setTimeout(() => {
          contactStatus.classList.add('hidden');
        }, 5000);
      }
    });
  }

  const talentForm = document.getElementById('talent-form');
  const talentStatus = document.getElementById('talent-status');

  if (talentForm) {
    talentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (talentStatus) {
        talentStatus.classList.remove('hidden');
        talentForm.reset();
        setTimeout(() => {
          talentStatus.classList.add('hidden');
        }, 5000);
      }
    });
  }
}

// ==========================================
// DOM CONTENT LOADED INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initHeroThreeCanvas();
  initCtaThreeCanvas();
  initKaraokeText();
  initTimelineScrubber();
  initCtaDoors();
  initFaqAccordion();
  initForms();
});

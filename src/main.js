import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './style.css';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. INITIALIZER LOADING SCREEN
// ==========================================
function initLoadingScreen() {
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

// Dynamic 2K Canvas Texture for Screen Display
function createDynamicScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  function renderTexture() {
    // Background
    ctx.fillStyle = '#06030d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // iOS Status Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText('9:41', 60, 65);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(900, 42, 50, 26);
    ctx.fillRect(905, 47, 36, 16);
    ctx.fillRect(952, 50, 4, 10);

    // Header Gradient
    const grad = ctx.createLinearGradient(0, 100, 0, 320);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    grad.addColorStop(1, 'rgba(10, 6, 20, 0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 100, canvas.width, 220);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 52px Inter, sans-serif';
    ctx.fillText('Spark Point Infotech', 60, 185);

    ctx.fillStyle = '#A855F7';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('SOFTWARE DEVELOPMENT COMPANY', 60, 235);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '26px Inter, sans-serif';
    ctx.fillText('India • Germany • Netherlands', 60, 280);

    // Hero Card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(40, 340, 944, 380, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('• WRITTEN SPECIFICATION LOCK', 80, 400);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.fillText('Software built to written spec', 80, 465);

    ctx.fillStyle = '#EAEAEA';
    ctx.font = '30px Inter, sans-serif';
    ctx.fillText('Every project starts with a written scope,', 80, 525);
    ctx.fillText('a fixed price and a dated schedule.', 80, 570);

    // Badges
    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.beginPath();
    ctx.roundRect(80, 615, 380, 65, 16);
    ctx.fill();
    ctx.fillStyle = '#A855F7';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('FIXED GUARANTEE', 110, 656);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.beginPath();
    ctx.roundRect(480, 615, 460, 65, 16);
    ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('• SUB-2s LOAD TIME', 510, 656);

    // Services List
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(40, 750, 944, 600, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText('Five Core Services', 80, 815);

    const services = [
      { name: 'Website development', detail: 'Sub-2s load time, SEO & CMS' },
      { name: 'Custom web applications', detail: 'Portals, dashboards & role permissions' },
      { name: 'Mobile app development', detail: 'iOS & Android single codebase' },
      { name: 'UI/UX design', detail: 'Figma component design tokens' },
      { name: 'Maintenance & support', detail: 'Security patching & monitoring' }
    ];

    services.forEach((s, idx) => {
      const y = 875 + idx * 95;
      ctx.fillStyle = idx % 2 === 0 ? '#8B5CF6' : '#A855F7';
      ctx.beginPath();
      ctx.arc(95, y + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px Inter, sans-serif';
      ctx.fillText(s.name, 130, y + 20);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '24px Inter, sans-serif';
      ctx.fillText(s.detail, 130, y + 52);
    });

    // Console Log
    ctx.fillStyle = 'rgba(10, 6, 20, 0.85)';
    ctx.beginPath();
    ctx.roundRect(40, 1380, 944, 560, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.stroke();

    ctx.fillStyle = '#A855F7';
    ctx.font = '26px monospace';
    ctx.fillText('const project = await SparkPoint.start({', 80, 1440);
    ctx.fillText('  scope: "Written Specification",', 80, 1490);
    ctx.fillText('  pricing: "Fixed Guarantee",', 80, 1540);
    ctx.fillText('  schedule: "Dated Milestone Delivery"', 80, 1590);
    ctx.fillText('});', 80, 1640);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('> BUILD STATUS: 100% VERIFIED', 80, 1770);
    ctx.fillText('> REPOSITORY TRANSFER: DAY ONE READY', 80, 1820);

    // iOS Home Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(372, 2010, 280, 10, 5);
    ctx.fill();
  }

  renderTexture();
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return { texture, canvas, renderTexture };
}

// Authentic iPhone Mesh with CURVED SCREEN MESH
function createAuthenticIPhoneMesh() {
  const phoneGroup = new THREE.Group();
  phoneGroup.style = { willChange: 'transform' };

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
    bevelThickness: 0.07,
    bevelSize: 0.07,
    bevelSegments: 5
  };
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
  bodyGeo.center();

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x1f1533,
    metalness: 0.95,
    roughness: 0.18,
    envMapIntensity: 2.0
  });

  const bodyMesh = new THREE.Mesh(bodyGeo, titaniumMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  phoneGroup.add(bodyMesh);

  // 2. Antenna Bands
  const bandMat = new THREE.MeshBasicMaterial({ color: 0x4a3b6e });
  const bandGeo = new THREE.BoxGeometry(width + 0.16, 0.03, depth + 0.16);
  
  const bandTop = new THREE.Mesh(bandGeo, bandMat);
  bandTop.position.set(0, 2.2, 0);
  phoneGroup.add(bandTop);

  const bandBottom = new THREE.Mesh(bandGeo, bandMat);
  bandBottom.position.set(0, -2.2, 0);
  phoneGroup.add(bandBottom);

  // 3. Front Display Screen & Bezel with CURVED EDGES
  const screenBezelShape = createRoundedCornerShape(width - 0.08, height - 0.08, radius - 0.04);
  const screenBezelGeo = new THREE.ShapeGeometry(screenBezelShape);
  const screenBezelMat = new THREE.MeshStandardMaterial({ color: 0x05030a, roughness: 0.1 });
  const screenBezelMesh = new THREE.Mesh(screenBezelGeo, screenBezelMat);
  screenBezelMesh.position.set(0, 0, depth / 2 + 0.072);
  phoneGroup.add(screenBezelMesh);

  // Dynamic Screen Mesh with Exact Rounded Curved Corners
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
  screenMesh.position.set(0, 0, depth / 2 + 0.075);
  phoneGroup.add(screenMesh);

  // 4. Dynamic Island Notch
  const islandShape = createRoundedCornerShape(0.75, 0.22, 0.11);
  const islandGeo = new THREE.ShapeGeometry(islandShape);
  const islandMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const islandMesh = new THREE.Mesh(islandGeo, islandMat);
  islandMesh.position.set(0, 2.85, depth / 2 + 0.078);
  phoneGroup.add(islandMesh);

  const cameraDotGeo = new THREE.CircleGeometry(0.04, 16);
  const cameraDotMat = new THREE.MeshBasicMaterial({ color: 0x111122 });
  const cameraDot = new THREE.Mesh(cameraDotGeo, cameraDotMat);
  cameraDot.position.set(-0.2, 2.85, depth / 2 + 0.08);
  phoneGroup.add(cameraDot);

  // 5. Rear Camera Bump
  const bumpWidth = 1.35;
  const bumpHeight = 1.35;
  const bumpShape = createRoundedCornerShape(bumpWidth, bumpHeight, 0.3);
  const bumpExtrude = {
    steps: 1,
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3
  };
  const bumpGeo = new THREE.ExtrudeGeometry(bumpShape, bumpExtrude);
  const bumpMat = new THREE.MeshStandardMaterial({
    color: 0x1d1433,
    metalness: 0.8,
    roughness: 0.25
  });
  const bumpMesh = new THREE.Mesh(bumpGeo, bumpMat);
  bumpMesh.position.set(-0.75, 2.05, -depth / 2 - 0.08);
  phoneGroup.add(bumpMesh);

  function createCameraLens(x, y) {
    const lensGroup = new THREE.Group();

    const ringGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, metalness: 0.95, roughness: 0.1 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    lensGroup.add(ringMesh);

    const glassGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.085, 32);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x050510, roughness: 0.05, metalness: 0.2 });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.rotation.x = Math.PI / 2;
    lensGroup.add(glassMesh);

    const optGeo = new THREE.CircleGeometry(0.12, 16);
    const optMat = new THREE.MeshBasicMaterial({ color: 0xA855F7, transparent: true, opacity: 0.6 });
    const optMesh = new THREE.Mesh(optGeo, optMat);
    optMesh.position.set(0, 0, -0.045);
    optMesh.rotation.y = Math.PI;
    lensGroup.add(optMesh);

    lensGroup.position.set(x, y, -depth / 2 - 0.16);
    return lensGroup;
  }

  phoneGroup.add(createCameraLens(-1.05, 2.35));
  phoneGroup.add(createCameraLens(-1.05, 1.75));
  phoneGroup.add(createCameraLens(-0.45, 2.05));

  const flashGeo = new THREE.CircleGeometry(0.08, 16);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xfff0cc });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  flashMesh.position.set(-0.45, 2.42, -depth / 2 - 0.145);
  flashMesh.rotation.y = Math.PI;
  phoneGroup.add(flashMesh);

  const lidarGeo = new THREE.CircleGeometry(0.06, 16);
  const lidarMat = new THREE.MeshBasicMaterial({ color: 0x111118 });
  const lidarMesh = new THREE.Mesh(lidarGeo, lidarMat);
  lidarMesh.position.set(-0.45, 1.68, -depth / 2 - 0.145);
  lidarMesh.rotation.y = Math.PI;
  phoneGroup.add(lidarMesh);

  // 6. Buttons
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x4a3b6e, metalness: 0.9, roughness: 0.2 });

  const volUpGeo = new THREE.BoxGeometry(0.06, 0.45, 0.08);
  const volUp = new THREE.Mesh(volUpGeo, buttonMat);
  volUp.position.set(-width / 2 - 0.05, 1.2, 0);
  phoneGroup.add(volUp);

  const volDown = new THREE.Mesh(volUpGeo, buttonMat);
  volDown.position.set(-width / 2 - 0.05, 0.6, 0);
  phoneGroup.add(volDown);

  const actionGeo = new THREE.BoxGeometry(0.06, 0.25, 0.08);
  const actionBtn = new THREE.Mesh(actionGeo, buttonMat);
  actionBtn.position.set(-width / 2 - 0.05, 1.7, 0);
  phoneGroup.add(actionBtn);

  const powerGeo = new THREE.BoxGeometry(0.06, 0.7, 0.08);
  const powerBtn = new THREE.Mesh(powerGeo, buttonMat);
  powerBtn.position.set(width / 2 + 0.05, 1.0, 0);
  phoneGroup.add(powerBtn);

  // Outer Glow Sprite
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 128;
  glowCanvas.height = 128;
  const gCtx = glowCanvas.getContext('2d');
  const radGrad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  radGrad.addColorStop(0, 'rgba(168, 85, 247, 0.7)');
  radGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
  gCtx.fillStyle = radGrad;
  gCtx.fillRect(0, 0, 128, 128);

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

  return phoneGroup;
}

// ==========================================
// 3. MAIN HERO THREE.JS SCENE
// ==========================================
let heroScene, heroCamera, heroRenderer, phoneGroup, ring1, ring2, particlesMesh;

function initHeroThreeCanvas() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  heroScene = new THREE.Scene();
  heroScene.fog = new THREE.FogExp2(0x020202, 0.045);

  heroCamera = new THREE.PerspectiveCamera(26, window.innerWidth / window.innerHeight, 0.1, 100);
  heroCamera.position.set(0, 0, 15);

  heroRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  heroRenderer.setSize(window.innerWidth, window.innerHeight);
  heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  heroRenderer.shadowMap.enabled = true;
  heroRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(heroRenderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  heroScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  heroScene.add(dirLight);

  const pointLight1 = new THREE.PointLight(0x8B5CF6, 3.5, 20);
  pointLight1.position.set(-4, 2, 4);
  heroScene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xA855F7, 3, 20);
  pointLight2.position.set(4, -2, 4);
  heroScene.add(pointLight2);

  // Floating Particle Atmosphere
  const particleCount = 1200;
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

  // iPhone 3D Instance
  phoneGroup = createAuthenticIPhoneMesh();
  heroScene.add(phoneGroup);

  // Tech Rings
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

  window.addEventListener('resize', onWindowResize);

  let clock = new THREE.Clock();

  function animateHero() {
    requestAnimationFrame(animateHero);
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

  tl.to(phoneGroup.rotation, { x: 0.22, y: 0.58, z: -0.1, duration: 1 }, 0)
    .to(phoneGroup.position, { x: 1.4, y: 0, z: 1, duration: 1 }, 0)
    .to(heroCamera, { fov: 24, onUpdate: () => heroCamera.updateProjectionMatrix(), duration: 1 }, 0)
    .to(pop1, { opacity: 1, y: 0, duration: 0.4 }, 0.3)
    .to(pop1, { opacity: 0, y: -20, duration: 0.3 }, 0.9);

  tl.to(phoneGroup.rotation, { x: -0.18, y: Math.PI + 0.25, z: 0.12, duration: 1 }, 1)
    .to(phoneGroup.position, { x: -1.4, y: -0.2, z: 1.5, duration: 1 }, 1)
    .to(heroCamera, { fov: 23, onUpdate: () => heroCamera.updateProjectionMatrix(), duration: 1 }, 1)
    .to(pop2, { opacity: 1, y: 0, duration: 0.4 }, 1.3)
    .to(pop2, { opacity: 0, y: -20, duration: 0.3 }, 1.9);

  tl.to(phoneGroup.rotation, { x: 0.3, y: Math.PI * 2, z: 0, duration: 1.2 }, 2)
    .to(phoneGroup.position, { x: 0, y: 1.2, z: 3.5, duration: 1.2 }, 2)
    .to(heroCamera, { fov: 22, onUpdate: () => heroCamera.updateProjectionMatrix(), duration: 1.2 }, 2)
    .to(pop3, { opacity: 1, y: 0, duration: 0.4 }, 2.2)
    .to(pop3, { opacity: 0, y: -20, duration: 0.3 }, 3.0);
}

// ==========================================
// 4. SECONDARY CTA THREE.JS CANVAS
// ==========================================
let ctaScene, ctaCamera, ctaRenderer, ctaPhoneGroup;

function initCtaThreeCanvas() {
  const container = document.getElementById('cta-canvas');
  if (!container) return;

  ctaScene = new THREE.Scene();
  ctaCamera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);
  ctaCamera.position.set(0, 0, 12);

  ctaRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  ctaRenderer.setSize(window.innerWidth, window.innerHeight);
  ctaRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

  let clock = new THREE.Clock();

  function animateCta() {
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

  animateCta();
}

// ==========================================
// 5. KARAOKE SCROLL TEXT EFFECT
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

// ==========================================
// 7. CTA SPLIT DOORS TRANSITION
// ==========================================
function initCtaDoors() {
  const doorLeft = document.getElementById('cta-door-left');
  const doorRight = document.getElementById('cta-door-right');

  if (!doorLeft || !doorRight) return;

  gsap.timeline({
    scrollTrigger: {
      trigger: '#cta-door-wrapper',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    }
  })
  .to(doorLeft, { xPercent: -105, ease: 'power2.inOut' }, 0)
  .to(doorRight, { xPercent: 105, ease: 'power2.inOut' }, 0);
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

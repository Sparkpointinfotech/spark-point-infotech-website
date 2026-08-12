import * as THREE from 'three';
import { gsap } from 'gsap';
import { createAuthenticIPhoneMesh } from './iphone-model.js';
import { debounce } from '../utils/debounce.js';

let heroScene, heroCamera, heroRenderer, phoneGroup, ring1, ring2, particlesMesh;
let heroAnimating = false;

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

  // Floating Particle Atmosphere (Reduced count for mobile FPS)
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

  window.addEventListener('resize', debounce(onHeroResize, 150));

  const clock = new THREE.Clock();

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

  // Fade out main hero title/tagline text when user starts scrolling to avoid overlapping with side popovers
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

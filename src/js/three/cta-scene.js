import * as THREE from 'three';
import { createAuthenticIPhoneMesh } from './iphone-model.js';
import { debounce } from '../utils/debounce.js';

let ctaScene, ctaCamera, ctaRenderer, ctaPhoneGroup;
let ctaAnimating = false;

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

  window.addEventListener('resize', debounce(onCtaResize, 150));

  const clock = new THREE.Clock();

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

function onCtaResize() {
  if (!ctaCamera || !ctaRenderer) return;
  ctaCamera.aspect = window.innerWidth / window.innerHeight;
  ctaCamera.updateProjectionMatrix();
  ctaRenderer.setSize(window.innerWidth, window.innerHeight);
}

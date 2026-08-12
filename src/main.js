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

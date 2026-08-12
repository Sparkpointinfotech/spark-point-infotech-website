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

  // Fix: When clicking "Start a project" or any #contact link, smoothly scroll to the open contact form
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

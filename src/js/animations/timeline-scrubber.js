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

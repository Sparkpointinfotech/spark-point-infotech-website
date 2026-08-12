export function initKaraokeText() {
  const container = document.getElementById('kakaoke-text');
  if (!container) return;

  const rawText = container.innerText.trim();
  const words = rawText.split(' ');

  container.innerHTML = words
    .map(word => `<span class="karaoke-word mr-2">${word}</span>`)
    .join('');

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

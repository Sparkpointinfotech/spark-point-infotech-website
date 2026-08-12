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

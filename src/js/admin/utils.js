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

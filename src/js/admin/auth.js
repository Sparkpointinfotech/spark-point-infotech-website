import { loadAllSubmissions } from './data.js';

export function preventUndo(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y')) {
    e.preventDefault();
    return false;
  }
}

let authToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token') || '';

export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

export async function checkAuth() {
  if (!authToken) {
    showLoginModal();
    return false;
  }
  try {
    const res = await fetch('/api/auth/verify', { headers: getAuthHeaders() });
    const json = await res.json();
    if (json.success && json.valid) {
      hideLoginModal();
      return true;
    } else {
      sessionStorage.removeItem('admin_token');
      localStorage.removeItem('admin_token');
      authToken = '';
      showLoginModal();
      return false;
    }
  } catch (err) {
    showLoginModal();
    return false;
  }
}

export function showLoginModal() {
  document.getElementById('login-modal').classList.remove('hidden');
  document.getElementById('dashboard-container').classList.add('hidden');
}

export function hideLoginModal() {
  document.getElementById('login-modal').classList.add('hidden');
  document.getElementById('dashboard-container').classList.remove('hidden');
}

export async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('admin-username').value.trim();
  const passwordInput = document.getElementById('admin-password').value;
  const errorDiv = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-btn');

  errorDiv.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Authenticating...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    });

    let json = {};
    try {
      const rawText = await res.text();
      json = JSON.parse(rawText);
    } catch (e) {
      json = {};
    }

    if (res.ok && json.success && json.token) {
      authToken = json.token;
      sessionStorage.setItem('admin_token', authToken);
      localStorage.setItem('admin_token', authToken);
      hideLoginModal();
      loadAllSubmissions();
    } else {
      errorDiv.innerText = json.error || 'Invalid admin username or password.';
      errorDiv.classList.remove('hidden');
    }
  } catch (err) {
    errorDiv.innerText = 'Invalid admin username or password.';
    errorDiv.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Authenticate & Unlock';
  }
}

export function handleLogout() {
  sessionStorage.removeItem('admin_token');
  localStorage.removeItem('admin_token');
  authToken = '';
  showLoginModal();
}

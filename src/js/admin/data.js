import { state } from './state.js';
import { getAuthHeaders, checkAuth } from './auth.js';
import { formatDate, escapeHtml, isSafeUrl } from './utils.js';
import { closeModal } from './modals.js';

export async function loadAllSubmissions() {
  const isAuthed = await checkAuth();
  if (!isAuthed) return;

  const refreshIcon = document.getElementById('refresh-icon');
  if (refreshIcon) refreshIcon.classList.add('animate-spin');

  try {
    const [contactRes, talentRes, healthRes] = await Promise.all([
      fetch('/api/submissions/contact', { headers: getAuthHeaders() }),
      fetch('/api/submissions/talent', { headers: getAuthHeaders() }),
      fetch('/api/health')
    ]);

    if (contactRes.status === 401 || talentRes.status === 401) {
      sessionStorage.removeItem('admin_token');
      localStorage.removeItem('admin_token');
      document.getElementById('login-modal').classList.remove('hidden');
      document.getElementById('dashboard-container').classList.add('hidden');
      return;
    }

    const contactJson = await contactRes.json();
    const talentJson = await talentRes.json();
    const healthJson = await healthRes.json();

    state.contactData = contactJson.data || [];
    state.talentData = talentJson.data || [];

    document.getElementById('metric-contact-count').innerText = state.contactData.length;
    document.getElementById('metric-talent-count').innerText = state.talentData.length;
    document.getElementById('metric-total-count').innerText = state.contactData.length + state.talentData.length;
    document.getElementById('tab-contact-badge').innerText = state.contactData.length;
    document.getElementById('tab-talent-badge').innerText = state.talentData.length;

    if (healthJson.database) {
      document.getElementById('metric-db-engine').innerText = healthJson.database;
    }

    state.selectedIds.clear();
    updateBatchButton();
    filterTable();

    document.getElementById('status-indicator').className = "flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400";
    document.getElementById('status-text').innerText = "Live Backend Connected";
  } catch (err) {
    console.error('Error fetching submissions:', err);
    document.getElementById('status-indicator').className = "flex items-center space-x-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-mono text-red-400";
    document.getElementById('status-text').innerText = "Connection Error";
  } finally {
    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
  }
}

export function renderContactTable(items) {
  const tbody = document.getElementById('contact-table-body');
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-12 text-slate-500 font-mono">No contact submissions found in database.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const isChecked = state.selectedIds.has(item.id) ? 'checked' : '';
    return `
    <tr class="hover:bg-white/[0.02] transition-colors">
      <td class="py-3.5 px-4 text-center">
        <input type="checkbox" value="${item.id}" ${isChecked} onchange="toggleSelectRow(${item.id}, this)" class="rounded bg-black/50 border-white/20 text-accent focus:ring-accent">
      </td>
      <td class="py-3.5 px-4 font-mono text-accent font-bold">#${item.id}</td>
      <td class="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">${formatDate(item.created_at)}</td>
      <td class="py-3.5 px-4">
        <div class="font-semibold text-white">${escapeHtml(item.name)}</div>
        <div class="text-slate-400 font-mono text-[11px]">${escapeHtml(item.email)}</div>
        <div class="text-emerald-400 font-mono text-[11px]">${escapeHtml(item.phone)}</div>
      </td>
      <td class="py-3.5 px-4">${escapeHtml(item.company || 'N/A')}</td>
      <td class="py-3.5 px-4">
        <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
          ${escapeHtml(item.service || 'General')}
        </span>
      </td>
      <td class="py-3.5 px-4 font-mono text-emerald-300 font-semibold">${escapeHtml(item.budget || 'N/A')}</td>
      <td class="py-3.5 px-4 max-w-xs leading-relaxed text-slate-300 line-clamp-2" title="${escapeHtml(item.message)}">
        ${escapeHtml(item.message)}
      </td>
      <td class="py-3.5 px-4 text-right whitespace-nowrap">
        <button onclick="openDetailModal('contact', ${item.id})" class="text-accent hover:text-purple-300 font-mono text-[11px] hover:underline mr-3">
          View
        </button>
        <button onclick="deleteSubmission('contact', ${item.id})" class="text-red-400 hover:text-red-300 font-mono text-[11px] hover:underline">
          Delete
        </button>
      </td>
    </tr>
  `}).join('');
}

export function renderTalentTable(items) {
  const tbody = document.getElementById('talent-table-body');
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-12 text-slate-500 font-mono">No talent profiles registered in database.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const isChecked = state.selectedIds.has(item.id) ? 'checked' : '';
    return `
    <tr class="hover:bg-white/[0.02] transition-colors">
      <td class="py-3.5 px-4 text-center">
        <input type="checkbox" value="${item.id}" ${isChecked} onchange="toggleSelectRow(${item.id}, this)" class="rounded bg-black/50 border-white/20 text-emerald-500 focus:ring-emerald-500">
      </td>
      <td class="py-3.5 px-4 font-mono text-emerald-400 font-bold">#${item.id}</td>
      <td class="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">${formatDate(item.created_at)}</td>
      <td class="py-3.5 px-4">
        <div class="font-semibold text-white">${escapeHtml(item.name)}</div>
        <div class="text-slate-400 font-mono text-[11px]">${escapeHtml(item.email)}</div>
        <div class="text-emerald-400 font-mono text-[11px]">${escapeHtml(item.phone)}</div>
      </td>
      <td class="py-3.5 px-4 font-semibold text-purple-300">${escapeHtml(item.role)}</td>
      <td class="py-3.5 px-4 font-mono text-slate-300">${escapeHtml(item.experience || 'N/A')} Yrs</td>
      <td class="py-3.5 px-4">${escapeHtml(item.location || 'N/A')}</td>
      <td class="py-3.5 px-4 font-mono text-amber-300">${escapeHtml(item.notice_period || 'N/A')}</td>
      <td class="py-3.5 px-4 max-w-xs">
        ${item.resume_url ? (isSafeUrl(item.resume_url) ? `<a href="${escapeHtml(item.resume_url)}" target="_blank" rel="noopener noreferrer" class="text-accent underline font-mono text-[11px] truncate block">${escapeHtml(item.resume_url)}</a>` : '<span class="text-red-400 font-mono text-[11px]">Blocked (unsafe URL)</span>') : '<span class="text-slate-500 font-mono">N/A</span>'}
      </td>
      <td class="py-3.5 px-4 text-right whitespace-nowrap">
        <button onclick="openDetailModal('talent', ${item.id})" class="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] hover:underline mr-3">
          View
        </button>
        <button onclick="deleteSubmission('talent', ${item.id})" class="text-red-400 hover:text-red-300 font-mono text-[11px] hover:underline">
          Delete
        </button>
      </td>
    </tr>
  `}).join('');
}

export function switchTab(tab) {
  state.activeTab = tab;
  state.selectedIds.clear();
  updateBatchButton();

  const contactBtn = document.getElementById('tab-contact-btn');
  const talentBtn = document.getElementById('tab-talent-btn');
  const contactContent = document.getElementById('contact-tab-content');
  const talentContent = document.getElementById('talent-tab-content');

  if (tab === 'contact') {
    contactBtn.className = 'px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all bg-accent text-white shadow-lg';
    talentBtn.className = 'px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all text-slate-400 hover:text-white';
    contactContent.classList.remove('hidden');
    talentContent.classList.add('hidden');
  } else {
    talentBtn.className = 'px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all bg-emerald-600 text-white shadow-lg';
    contactBtn.className = 'px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all text-slate-400 hover:text-white';
    talentContent.classList.remove('hidden');
    contactContent.classList.add('hidden');
  }
  filterTable();
}

export function filterTable() {
  const q = document.getElementById('search-input').value.toLowerCase().trim();
  if (state.activeTab === 'contact') {
    const filtered = state.contactData.filter(item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.company || '').toLowerCase().includes(q) ||
      (item.service || '').toLowerCase().includes(q) ||
      (item.message || '').toLowerCase().includes(q)
    );
    renderContactTable(filtered);
  } else {
    const filtered = state.talentData.filter(item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.role || '').toLowerCase().includes(q) ||
      (item.location || '').toLowerCase().includes(q)
    );
    renderTalentTable(filtered);
  }
}

export function toggleSelectRow(id, cb) {
  if (cb.checked) {
    state.selectedIds.add(id);
  } else {
    state.selectedIds.delete(id);
  }
  updateBatchButton();
}

export function toggleSelectAll(masterCb) {
  const currentList = state.activeTab === 'contact' ? state.contactData : state.talentData;
  state.selectedIds.clear();
  if (masterCb.checked) {
    currentList.forEach(item => state.selectedIds.add(item.id));
  }
  filterTable();
  updateBatchButton();
}

export function updateBatchButton() {
  const btn = document.getElementById('batch-delete-btn');
  const countSpan = document.getElementById('selected-count');
  if (state.selectedIds.size > 0) {
    btn.classList.remove('hidden');
    btn.classList.add('flex');
    countSpan.innerText = state.selectedIds.size;
  } else {
    btn.classList.add('hidden');
    btn.classList.remove('flex');
  }
}

export async function deleteSubmission(type, id) {
  if (!confirm(`Are you sure you want to delete submission #${id}?`)) return;

  try {
    const res = await fetch(`/api/submissions/${type}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (json.success) {
      closeModal();
      loadAllSubmissions();
    } else {
      alert('Error deleting submission: ' + json.error);
    }
  } catch (err) {
    alert('Network error deleting submission');
  }
}

export async function deleteSelected() {
  if (state.selectedIds.size === 0) return;
  if (!confirm(`Are you sure you want to delete ${state.selectedIds.size} selected submissions?`)) return;

  try {
    const ids = Array.from(state.selectedIds);
    const res = await fetch(`/api/submissions/${state.activeTab}/batch-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids })
    });
    const json = await res.json();
    if (json.success) {
      loadAllSubmissions();
    } else {
      alert('Error batch deleting: ' + json.error);
    }
  } catch (err) {
    alert('Network error during batch delete');
  }
}

import { state } from './state.js';
import { getAuthHeaders } from './auth.js';
import { formatDate, escapeHtml } from './utils.js';

export function openDetailModal(type, id) {
  const dataList = type === 'contact' ? state.contactData : state.talentData;
  const item = dataList.find(d => d.id === id);
  if (!item) return;

  const modal = document.getElementById('detail-modal');
  const tag = document.getElementById('modal-type-tag');
  const modalId = document.getElementById('modal-id');
  const body = document.getElementById('modal-body-content');
  const deleteBtn = document.getElementById('modal-delete-btn');

  modalId.innerText = `#${item.id}`;
  deleteBtn.setAttribute('onclick', `deleteSubmission('${type}', ${item.id})`);

  if (type === 'contact') {
    tag.className = 'text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/20 text-accent border border-accent/30';
    tag.innerText = 'Project Enquiry';

    body.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Full Name</span>
          <span class="text-sm font-semibold text-white">${escapeHtml(item.name)}</span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Submission Date</span>
          <span class="text-xs font-mono text-purple-300">${formatDate(item.created_at)}</span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Email Address</span>
          <span class="text-xs font-mono text-accent font-semibold flex items-center space-x-2">
            <span>${escapeHtml(item.email)}</span>
            <button onclick="copyToClipboard('${escapeHtml(item.email)}')" class="hover:text-white text-[10px]">📋 Copy</button>
          </span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Phone / WhatsApp</span>
          <span class="text-xs font-mono text-emerald-400 font-semibold flex items-center space-x-2">
            <span>${escapeHtml(item.phone)}</span>
            <button onclick="copyToClipboard('${escapeHtml(item.phone)}')" class="hover:text-white text-[10px]">📋 Copy</button>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Company / Website</span>
          <span class="text-xs font-semibold text-white">${escapeHtml(item.company || 'N/A')}</span>
        </div>
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Service Requested</span>
          <span class="text-xs font-semibold text-purple-300">${escapeHtml(item.service || 'General')}</span>
        </div>
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Budget</span>
          <span class="text-xs font-mono font-bold text-emerald-300">${escapeHtml(item.budget || 'N/A')}</span>
        </div>
      </div>

      <div class="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/10">
        <span class="text-slate-400 font-mono text-[10px] uppercase block">Project Overview / Message</span>
        <div class="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap pt-1 font-sans">${escapeHtml(item.message)}</div>
      </div>
    `;
  } else {
    tag.className = 'text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    tag.innerText = 'Talent Profile';

    body.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Candidate Name</span>
          <span class="text-sm font-semibold text-white">${escapeHtml(item.name)}</span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Registration Date</span>
          <span class="text-xs font-mono text-purple-300">${formatDate(item.created_at)}</span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Email Address</span>
          <span class="text-xs font-mono text-accent font-semibold flex items-center space-x-2">
            <span>${escapeHtml(item.email)}</span>
            <button onclick="copyToClipboard('${escapeHtml(item.email)}')" class="hover:text-white text-[10px]">📋 Copy</button>
          </span>
        </div>
        <div>
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Phone / WhatsApp</span>
          <span class="text-xs font-mono text-emerald-400 font-semibold flex items-center space-x-2">
            <span>${escapeHtml(item.phone)}</span>
            <button onclick="copyToClipboard('${escapeHtml(item.phone)}')" class="hover:text-white text-[10px]">📋 Copy</button>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Primary Expertise</span>
          <span class="text-xs font-semibold text-purple-300">${escapeHtml(item.role)}</span>
        </div>
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Experience</span>
          <span class="text-xs font-mono text-white">${escapeHtml(item.experience || 'N/A')} Yrs</span>
        </div>
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Location</span>
          <span class="text-xs font-semibold text-slate-200">${escapeHtml(item.location || 'N/A')}</span>
        </div>
        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
          <span class="text-slate-400 font-mono text-[10px] uppercase block">Notice Period</span>
          <span class="text-xs font-mono text-amber-300 font-semibold">${escapeHtml(item.notice_period || 'N/A')}</span>
        </div>
      </div>

      <div class="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/10">
        <span class="text-slate-400 font-mono text-[10px] uppercase block">Resume / Portfolio / GitHub</span>
        ${item.resume_url ? `
          <div class="flex items-center justify-between pt-1">
            <a href="${escapeHtml(item.resume_url)}" target="_blank" rel="noopener noreferrer" class="text-accent underline font-mono text-xs break-all">${escapeHtml(item.resume_url)}</a>
            <button onclick="copyToClipboard('${escapeHtml(item.resume_url)}')" class="hover:text-white text-[10px] font-mono shrink-0 ml-2">📋 Copy Link</button>
          </div>
        ` : '<span class="text-slate-500 font-mono text-xs block pt-1">No link provided</span>'}
      </div>
    `;
  }

  modal.classList.remove('hidden');
}

export function closeModal() {
  document.getElementById('detail-modal').classList.add('hidden');
}

export function openChangePasswordModal() {
  document.getElementById('password-modal').classList.remove('hidden');
}

export function closePasswordModal() {
  document.getElementById('password-modal').classList.add('hidden');
}

export async function handleChangePassword(e) {
  e.preventDefault();
  const curr = document.getElementById('current-pass-input').value;
  const newP = document.getElementById('new-pass-input').value;
  const msgDiv = document.getElementById('pass-msg');

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword: curr, newPassword: newP })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      msgDiv.className = 'text-xs font-mono p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      msgDiv.innerText = 'Password updated successfully!';
      msgDiv.classList.remove('hidden');
      setTimeout(() => closePasswordModal(), 1500);
    } else {
      msgDiv.className = 'text-xs font-mono p-2.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30';
      msgDiv.innerText = json.error || 'Failed to update password.';
      msgDiv.classList.remove('hidden');
    }
  } catch (err) {
    msgDiv.className = 'text-xs font-mono p-2.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30';
    msgDiv.innerText = 'Network error updating password.';
    msgDiv.classList.remove('hidden');
  }
}

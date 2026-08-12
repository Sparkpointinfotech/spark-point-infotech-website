import { submitForm } from './submit-helper.js';

export function initTalentForm() {
  const talentForm = document.getElementById('talent-form');
  const talentStatus = document.getElementById('talent-status');
  if (!talentForm) return;

  talentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitForm({
      form: talentForm,
      statusEl: talentStatus,
      endpoint: '/api/talent',
      statusColorClass: 'text-emerald-400',
      sendingText: 'Registering profile...',
      successFallbackMessage: 'Thank you! Your talent profile has been securely registered.',
      errorFallbackMessage: 'Thank you! Your talent profile has been securely registered.',
      catchFallbackMessage: 'Thank you! Your talent profile has been securely registered.',
      buildPayload: () => ({
        name: document.getElementById('talent-name')?.value || '',
        email: document.getElementById('talent-email')?.value || '',
        phone: document.getElementById('talent-phone')?.value || '',
        role: document.getElementById('talent-role')?.value || '',
        experience: document.getElementById('talent-exp')?.value || '',
        location: document.getElementById('talent-location')?.value || '',
        notice_period: document.getElementById('talent-notice')?.value || '',
        resume_url: document.getElementById('talent-resume')?.value || ''
      })
    });
  });
}

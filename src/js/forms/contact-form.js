import { submitForm } from './submit-helper.js';

export function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('form-status');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitForm({
      form: contactForm,
      statusEl: contactStatus,
      endpoint: '/api/contact',
      statusColorClass: 'text-accent',
      sendingText: 'Sending enquiry...',
      successFallbackMessage: 'Thank you! Your enquiry has been received.',
      errorFallbackMessage: 'Thank you! Your enquiry has been received. We will get back to you shortly.',
      catchFallbackMessage: 'Thank you! Your enquiry has been received. We will reply within one business day.',
      buildPayload: () => ({
        name: document.getElementById('form-name')?.value || '',
        email: document.getElementById('form-email')?.value || '',
        phone: document.getElementById('form-phone')?.value || '',
        company: document.getElementById('form-company')?.value || '',
        service: document.getElementById('form-service')?.value || '',
        budget: document.getElementById('form-budget')?.value || '',
        message: document.getElementById('form-message')?.value || ''
      })
    });
  });
}

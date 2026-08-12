function getCleanErrorMessage(err, defaultMsg) {
  if (!err) return defaultMsg;
  const msg = typeof err === 'string' ? err : (err.message || '');
  if (!msg ||
      msg.includes('Unexpected token') ||
      msg.includes('is not valid JSON') ||
      msg.includes('JSON.parse') ||
      msg.includes('Failed to fetch') ||
      msg.includes('SyntaxError') ||
      msg.includes('500') ||
      msg.includes('404') ||
      msg.includes('<html') ||
      msg.includes('Internal Server')) {
    return defaultMsg;
  }
  return msg;
}

export async function submitForm({
  form,
  statusEl,
  endpoint,
  buildPayload,
  statusColorClass,
  sendingText,
  successFallbackMessage,
  errorFallbackMessage,
  catchFallbackMessage
}) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerText : '';

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = sendingText;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload())
    });

    let data = {};
    try {
      const rawText = await response.text();
      data = JSON.parse(rawText);
    } catch (e) {
      data = {};
    }

    let message;
    if (response.ok && data.success) {
      message = data.message || successFallbackMessage;
    } else if (data.message) {
      message = data.message;
    } else {
      message = getCleanErrorMessage(data.error, errorFallbackMessage);
    }

    if (statusEl) {
      statusEl.classList.remove('hidden', 'text-red-400');
      statusEl.classList.add(statusColorClass);
      statusEl.innerHTML = `&check; ${message}`;
    }
    form.reset();
  } catch (err) {
    console.error(`Form submission error (${endpoint}):`, err);
    if (statusEl) {
      statusEl.classList.remove('hidden', 'text-red-400');
      statusEl.classList.add(statusColorClass);
      statusEl.innerHTML = `&check; ${catchFallbackMessage}`;
    }
    form.reset();
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
    }
    if (statusEl) {
      setTimeout(() => {
        statusEl.classList.add('hidden');
      }, 8000);
    }
  }
}

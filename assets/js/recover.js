import { loadConfig, apiUrl, setSupportLinks, formatDateBR, copyText, whatsappUrl } from './common.js';

const CONFIG = await loadConfig();
setSupportLinks(CONFIG);

const params = new URLSearchParams(window.location.search);
const token = params.get('token') || '';

const card = document.getElementById('recoverCard');
const title = document.getElementById('recoverTitle');
const text = document.getElementById('recoverText');
const form = document.getElementById('recoverForm');
const submitBtn = document.getElementById('recoverSubmit');
const message = document.getElementById('recoverMessage');

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch])); }
function escapeAttr(value) { return escapeHtml(value); }

function showMessage(text, isError = false) {
  message.hidden = false;
  message.innerHTML = isError ? `<span class="error-text">${escapeHtml(text)}</span>` : escapeHtml(text);
}

function onlyDigits(value) { return String(value || '').replace(/\D+/g, ''); }

async function requestRecovery(event) {
  event.preventDefault();
  const email = String(document.getElementById('recoverEmail').value || '').trim().toLowerCase();
  const cpf = onlyDigits(document.getElementById('recoverCpf').value);
  if (!email || !cpf) { showMessage('Preencha e-mail e CPF para continuar.', true); return; }
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  try {
    const resp = await fetch(apiUrl(CONFIG, '/license/recover/request'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, documento: cpf }),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.ok === false) throw new Error(json.error || 'Não foi possível enviar o link de recuperação.');
    form.hidden = true;
    showMessage(json.message || 'Se os dados baterem com um cadastro, você vai receber um e-mail com o link de recuperação em instantes.');
  } catch (err) {
    showMessage(err instanceof Error ? err.message : 'Não foi possível enviar o link de recuperação. Tente novamente.', true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar link de recuperação';
  }
}

function renderLicenses(data) {
  const licencas = Array.isArray(data.licencas) ? data.licencas : [];
  title.textContent = 'Sua licença';
  text.textContent = `Aqui está a licença cadastrada para ${data.cliente?.nome || 'você'}.`;
  const blocos = licencas.map(l => `
    <div class="license-box">
      <div class="data-grid">
        <div><small>Plano</small><strong>${escapeHtml(l.plano || '—')}</strong></div>
        <div><small>Status</small><strong>${escapeHtml(l.status || '—')}</strong></div>
        <div><small>Validade</small><strong>${formatDateBR(l.expiresAt)}</strong></div>
      </div>
      <div class="license-code" data-license-code>${escapeHtml(l.licenseKey)}</div>
      <button class="btn btn-primary full" data-copy-license type="button">Copiar licença</button>
    </div>`).join('');
  card.innerHTML = `
    <img src="assets/img/tere-studio-logo.png" alt="Terê Studio" class="success-logo" />
    <span class="eyebrow">Suporte oficial</span>
    <h1>Sua licença</h1>
    <p>Aqui está a licença cadastrada para ${escapeHtml(data.cliente?.nome || 'você')}.</p>
    <div class="security-alert">${escapeHtml(data.avisoSeguranca || CONFIG.securityNotice)}</div>
    ${blocos}
    <div class="success-actions">
      <a class="btn btn-primary" href="${escapeAttr(data.downloadUrl || CONFIG.downloadUrl)}">Baixar o Terê Studio</a>
      <a class="btn btn-secondary" href="${escapeAttr(whatsappUrl(data.supportUrl || CONFIG.supportWhatsappUrl, CONFIG.supportWhatsappText))}">Falar com suporte</a>
    </div>`;
  card.querySelectorAll('[data-copy-license]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.previousElementSibling?.textContent || '';
      const ok = await copyText(code);
      btn.textContent = ok ? 'Licença copiada' : 'Copie manualmente';
    });
  });
}

async function confirmRecovery() {
  title.textContent = 'Confirmando link...';
  text.textContent = 'Só um instante enquanto conferimos seu link de recuperação.';
  form.hidden = true;
  try {
    const resp = await fetch(apiUrl(CONFIG, '/license/recover/confirm'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.ok === false) throw new Error(json.error || 'Este link de recuperação expirou ou já foi usado.');
    renderLicenses(json);
  } catch (err) {
    title.textContent = 'Não foi possível confirmar';
    text.textContent = '';
    showMessage(err instanceof Error ? err.message : 'Este link de recuperação expirou ou já foi usado. Peça um novo.', true);
  }
}

if (token) {
  confirmRecovery();
} else {
  form.addEventListener('submit', requestRecovery);
}

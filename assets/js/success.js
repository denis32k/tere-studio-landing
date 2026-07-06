import { loadConfig, apiUrl, setSupportLinks, formatDateBR, copyText } from './common.js';

const CONFIG = await loadConfig();
setSupportLinks(CONFIG);
const params = new URLSearchParams(window.location.search);
const orderId = params.get('pedido') || params.get('orderId') || params.get('order') || '';
const card = document.getElementById('successCard');
const statusBox = document.getElementById('statusBox');

function renderBase(title, text, detail = '') {
  card.querySelector('h1').textContent = title;
  card.querySelector('p').textContent = text;
  statusBox.innerHTML = detail || 'Conferindo informações.';
}

async function reveal(token) {
  const resp = await fetch(apiUrl(CONFIG, '/checkout/success/reveal'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || json.ok === false) throw new Error(json.error || 'Não foi possível exibir a licença.');
  renderLicense(json);
}

function renderLicense(data) {
  card.querySelector('h1').textContent = 'Parabéns pela compra!';
  card.querySelector('p').textContent = 'Seu Terê Studio já está pronto para ativação.';
  statusBox.outerHTML = `
    <div class="license-box">
      <div class="data-grid">
        <div><small>Cliente</small><strong>${escapeHtml(data.cliente?.nome || '—')}</strong></div>
        <div><small>Plano</small><strong>${escapeHtml(data.plano?.nome || '—')}</strong></div>
        <div><small>Duração</small><strong>${escapeHtml(data.ciclo?.label || '—')}</strong></div>
        <div><small>Validade</small><strong>${formatDateBR(data.validade)}</strong></div>
      </div>
      <div class="security-alert">${escapeHtml(data.avisoSeguranca || CONFIG.securityNotice)}</div>
      <div class="license-code" id="licenseCode">${escapeHtml(data.licenseKey)}</div>
      <button class="btn btn-primary full" id="copyLicense" type="button">Copiar licença</button>
      <div class="status-box">
        <strong>Como ativar:</strong>
        <ol>${(data.instrucoes || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
      </div>
      <div class="success-actions">
        <a class="btn btn-primary" href="${escapeAttr(data.downloadUrl || CONFIG.downloadUrl)}">Baixar o Terê Studio</a>
        <a class="btn btn-secondary" href="${escapeAttr(data.supportUrl || CONFIG.supportWhatsappUrl)}">Falar com suporte</a>
      </div>
    </div>`;
  document.getElementById('copyLicense')?.addEventListener('click', async () => {
    const ok = await copyText(data.licenseKey);
    document.getElementById('copyLicense').textContent = ok ? 'Licença copiada' : 'Copie manualmente';
  });
}

async function checkStatus() {
  if (!orderId) {
    renderBase('Pedido não encontrado', 'Não encontramos o número do pedido nesta página.', '<span class="error-text">Abra o link de sucesso enviado após a compra ou fale com o suporte.</span>');
    return;
  }
  try {
    const resp = await fetch(apiUrl(CONFIG, `/checkout/orders/${encodeURIComponent(orderId)}/status`), { cache: 'no-store' });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.ok === false) throw new Error(json.error || 'Não foi possível consultar o pedido.');
    if (json.licenseAlreadyShown) {
      renderBase('Licença já exibida', 'Por segurança, esta licença não aparece novamente nesta página.', 'Fale com o suporte para recuperar ou regularizar o acesso.');
      return;
    }
    if (json.successToken) {
      await reveal(json.successToken);
      return;
    }
    if (json.status === 'paid' && json.licenseReady) {
      renderBase('Licença pronta', 'Estamos preparando a visualização segura da licença.', 'Atualize a página se a licença não aparecer em alguns segundos.');
      return;
    }
    if (json.status === 'cancelled') {
      renderBase('Pagamento não aprovado', 'Não conseguimos confirmar sua compra.', '<span class="error-text">Confira o pagamento ou fale com o suporte.</span>');
      return;
    }
    renderBase('Aguardando confirmação', 'Seu pagamento ainda está sendo confirmado.', 'Assim que o provedor confirmar, a licença será gerada automaticamente.');
    window.setTimeout(checkStatus, 4500);
  } catch (err) {
    renderBase('Não foi possível consultar a compra', err instanceof Error ? err.message : 'Tente novamente ou fale com o suporte.', '<span class="error-text">A licença não foi exibida.</span>');
  }
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch])); }
function escapeAttr(value) { return escapeHtml(value); }
checkStatus();

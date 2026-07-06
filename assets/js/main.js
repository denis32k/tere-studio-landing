import { loadConfig, apiUrl, setSupportLinks, whatsappUrl } from './common.js';

let CONFIG = await loadConfig();
setSupportLinks(CONFIG);

for (const el of document.querySelectorAll('[data-config]')) {
  const key = el.dataset.config;
  if (CONFIG[key]) el.textContent = CONFIG[key];
}

async function loadPlans() {
  try {
    const resp = await fetch(apiUrl(CONFIG, '/checkout/plans'), { cache: 'no-store' });
    const json = await resp.json();
    if (resp.ok && json.ok && Array.isArray(json.planos) && json.planos.length) return json.planos;
  } catch {}
  try {
    const resp = await fetch('content/plans.json', { cache: 'no-store' });
    if (resp.ok) return await resp.json();
  } catch {}
  return [];
}

function defaultCycles(plan) {
  if (plan.supportOnly || plan.id === 'personalizado') return [];
  const monthlyPrice = plan.preco || 'Sob consulta';
  return [
    { id: 'mensal', label: '1 mês', months: 1, preco: monthlyPrice },
    { id: 'semestral', label: '6 meses', months: 6, preco: plan.precoSemestral || 'Sob consulta' },
    { id: 'anual', label: '1 ano', months: 12, preco: plan.precoAnual || 'Sob consulta' },
  ];
}
function planCycles(plan) {
  const cycles = Array.isArray(plan.billingCycles) ? plan.billingCycles : Array.isArray(plan.ciclos) ? plan.ciclos : [];
  return cycles.length ? cycles : defaultCycles(plan);
}
function renderPlan(plan) {
  const features = Array.isArray(plan.features) ? plan.features : [];
  const supportOnly = plan.supportOnly || plan.id === 'personalizado';
  const cycles = planCycles(plan);
  const priceText = cycles[0]?.preco || plan.preco || 'Sob consulta';
  return `
    <article class="plan-card ${plan.featured ? 'featured' : ''}">
      ${plan.featured ? '<span class="plan-badge">Mais escolhido</span>' : ''}
      <h3>${escapeHtml(plan.nome || '')}</h3>
      <div class="plan-price"><small>a partir de</small>${escapeHtml(priceText)}</div>
      <p>${escapeHtml(plan.descricao || '')}</p>
      ${plan.destaque ? `<p><strong>${escapeHtml(plan.destaque)}</strong></p>` : ''}
      <ul>${features.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      ${supportOnly ? '' : `<div class="billing-cycle-list" aria-label="Períodos disponíveis">${cycles.map(cycle => `
        <button class="cycle-option ${cycle.featured ? 'cycle-featured' : ''}" type="button" data-buy-plan="${escapeAttr(plan.id)}" data-cycle-id="${escapeAttr(cycle.id || 'mensal')}" data-support-only="0">
          <span>${escapeHtml(cycle.label || '1 mês')}</span>
          <strong>${escapeHtml(cycle.preco || 'Sob consulta')}</strong>
        </button>`).join('')}</div>`}
      <button class="btn btn-primary" type="button" data-buy-plan="${escapeAttr(plan.id)}" data-cycle-id="${escapeAttr(cycles[0]?.id || 'mensal')}" data-support-only="${supportOnly ? '1' : '0'}">${escapeHtml(supportOnly ? 'Falar com suporte' : 'Selecionar plano')}</button>
    </article>`;
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
}
function escapeAttr(value) { return escapeHtml(value); }

const plans = await loadPlans();
const grid = document.getElementById('plansGrid');
if (grid) grid.innerHTML = plans.map(renderPlan).join('');

const checkoutSection = document.getElementById('checkout');
const form = document.getElementById('checkoutForm');
const message = document.getElementById('checkoutMessage');
const planInfo = document.getElementById('checkoutPlanInfo');
const summaryTitle = document.getElementById('checkoutSummaryTitle');
const summaryText = document.getElementById('checkoutSummaryText');
const summaryPrice = document.getElementById('checkoutSummaryPrice');
const summaryCycle = document.getElementById('checkoutSummaryCycle');
const summaryFeatures = document.getElementById('checkoutSummaryFeatures');
let selectedPlan = null;
let selectedCycle = null;

function showCheckout(plan, cycle) {
  selectedPlan = plan;
  selectedCycle = cycle;
  form.planId.value = selectedPlan.id;
  if (form.cycleId) form.cycleId.value = selectedCycle.id || 'mensal';
  summaryTitle.textContent = selectedPlan.nome || 'Plano selecionado';
  summaryText.textContent = selectedPlan.destaque || selectedPlan.descricao || 'Plano Terê Studio';
  summaryPrice.textContent = selectedCycle.preco || selectedPlan.preco || 'Sob consulta';
  summaryCycle.textContent = selectedCycle.label || '1 mês';
  planInfo.textContent = `Plano ${selectedPlan.nome} · ${selectedCycle.label || '1 mês'}${selectedCycle.preco ? ' · ' + selectedCycle.preco : ''}. Você será enviado ao Mercado Pago.`;
  const features = Array.isArray(selectedPlan.features) ? selectedPlan.features : [];
  summaryFeatures.innerHTML = features.slice(0, 6).map(item => `<span>${escapeHtml(item)}</span>`).join('');
  message.textContent = '';
  checkoutSection.hidden = false;
  checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => form.nome?.focus({ preventScroll: true }), 350);
}

document.addEventListener('click', ev => {
  const btn = ev.target.closest('[data-buy-plan]');
  if (!btn) return;
  const plan = plans.find(p => String(p.id) === String(btn.dataset.buyPlan));
  if (!plan) return;
  const cycle = planCycles(plan).find(c => String(c.id) === String(btn.dataset.cycleId)) || planCycles(plan)[0] || { id: 'mensal', label: '1 mês', months: 1 };
  if (btn.dataset.supportOnly === '1' || plan.supportOnly) {
    window.location.href = whatsappUrl(CONFIG.supportWhatsappUrl, `${CONFIG.purchaseWhatsappText || 'Olá! Quero contratar o Terê Studio.'}\nPlano: ${plan.nome}`);
    return;
  }
  showCheckout(plan, cycle);
});

form?.addEventListener('submit', async ev => {
  ev.preventDefault();
  if (!selectedPlan) return;
  const fd = new FormData(form);
  const payload = {
    planId: fd.get('planId'),
    billingCycle: fd.get('cycleId') || selectedCycle?.id || 'mensal',
    cycleId: fd.get('cycleId') || selectedCycle?.id || 'mensal',
    durationMonths: Number(selectedCycle?.months || 1),
    cliente: {
      nome: fd.get('nome'),
      loja: fd.get('loja'),
      whatsapp: fd.get('whatsapp'),
      email: fd.get('email'),
      cpf: fd.get('cpf'),
      documento: fd.get('cpf')
    }
  };
  message.textContent = 'Criando pedido seguro no servidor...';
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const resp = await fetch(apiUrl(CONFIG, '/checkout/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.ok === false) throw new Error(json.error || 'Não foi possível iniciar a compra.');
    if (json.checkoutMode === 'configure_payment_provider') {
      message.textContent = 'O Mercado Pago ainda não foi configurado no servidor. Abrindo suporte para finalizar manualmente.';
      window.location.href = whatsappUrl(CONFIG.supportWhatsappUrl, `${CONFIG.purchaseWhatsappText || 'Olá! Quero contratar o Terê Studio.'}\nPlano: ${selectedPlan.nome}\nDuração: ${selectedCycle?.label || '1 mês'}\nPedido: ${json.orderId}`);
      return;
    }
    message.textContent = 'Redirecionando para o Mercado Pago...';
    window.location.href = json.checkoutUrl || json.successUrl || 'sucesso.html?pedido=' + encodeURIComponent(json.orderId);
  } catch (err) {
    message.textContent = err instanceof Error ? err.message : 'Não foi possível iniciar a compra.';
  } finally {
    submit.disabled = false;
  }
});

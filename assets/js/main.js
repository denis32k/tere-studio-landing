import { loadConfig, apiUrl, setSupportLinks, whatsappUrl } from './common.js';

let CONFIG = await loadConfig();
setSupportLinks(CONFIG);

for (const el of document.querySelectorAll('[data-config]')) {
  const key = el.dataset.config;
  if (CONFIG[key]) el.textContent = CONFIG[key];
}

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuToggle?.addEventListener('click', () => {
  const opened = nav?.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
});
nav?.addEventListener('click', ev => {
  if (ev.target.closest('a')) {
    nav.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }
});

const BILLING_LABELS = {
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual'
};
const BILLING_DEFAULTS = {
  mensal: { id: 'mensal', label: 'Mensal', months: 1, sort: 1 },
  semestral: { id: 'semestral', label: 'Semestral', months: 6, sort: 2, installments: 6 },
  anual: { id: 'anual', label: 'Anual', months: 12, sort: 3, installments: 12 }
};
let selectedBillingCycleId = 'mensal';
let plans = [];

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

function normalizeCycleId(value = '') {
  const raw = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const aliases = {
    month: 'mensal', monthly: 'mensal', mes: 'mensal', '1mes': 'mensal', '1_mes': 'mensal', mensal: 'mensal',
    six_months: 'semestral', semestre: 'semestral', semiannual: 'semestral', semestral: 'semestral', '6meses': 'semestral', '6_meses': 'semestral',
    year: 'anual', annual: 'anual', yearly: 'anual', ano: 'anual', '1ano': 'anual', '1_ano': 'anual', anual: 'anual'
  };
  return aliases[raw] || raw || 'mensal';
}

function parseMoney(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = String(value).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const number = Number(raw);
  return Number.isFinite(number) ? number : 0;
}

function formatMoneyBR(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function defaultCycles(plan) {
  if (plan.supportOnly || plan.id === 'personalizado') return [];
  const monthlyAmount = parseMoney(plan.priceAmount ?? plan.valor ?? plan.amount ?? plan.preco);
  const monthlyText = plan.preco || (monthlyAmount ? formatMoneyBR(monthlyAmount) : 'Sob consulta');
  const semestralAmount = parseMoney(plan.precoSemestral ?? plan.semestral ?? plan.valorSemestral ?? plan.priceAmountSemestral);
  const anualAmount = parseMoney(plan.precoAnual ?? plan.anual ?? plan.valorAnual ?? plan.priceAmountAnual);
  return [
    { ...BILLING_DEFAULTS.mensal, preco: monthlyText, priceAmount: monthlyAmount },
    { ...BILLING_DEFAULTS.semestral, preco: semestralAmount ? formatMoneyBR(semestralAmount) : 'Sob consulta', priceAmount: semestralAmount, installments: 6 },
    { ...BILLING_DEFAULTS.anual, preco: anualAmount ? formatMoneyBR(anualAmount) : 'Sob consulta', priceAmount: anualAmount, installments: 12 },
  ];
}

function planCycles(plan) {
  const rawCycles = Array.isArray(plan.billingCycles) ? plan.billingCycles : Array.isArray(plan.ciclos) ? plan.ciclos : [];
  const cycles = rawCycles.length ? rawCycles : defaultCycles(plan);
  return cycles.map(cycle => {
    const id = normalizeCycleId(cycle.id || cycle.cycleId || cycle.codigo || cycle.label);
    const base = BILLING_DEFAULTS[id] || BILLING_DEFAULTS.mensal;
    const amount = parseMoney(cycle.priceAmount ?? cycle.valor ?? cycle.amount ?? cycle.preco ?? cycle.price);
    return {
      ...base,
      ...cycle,
      id,
      label: cycle.label || cycle.nome || base.label || BILLING_LABELS[id] || id,
      months: Number(cycle.months || cycle.meses || base.months || 1),
      preco: String(cycle.preco || cycle.price || cycle.valorLabel || '').trim() || (amount ? formatMoneyBR(amount) : 'Sob consulta'),
      priceAmount: amount,
      installments: Number(cycle.installments || cycle.parcelas || cycle.maxInstallments || cycle.maxParcelas || base.installments || 1),
      sort: Number(cycle.sort || base.sort || 99),
      featured: Boolean(cycle.featured || cycle.destaque)
    };
  }).sort((a, b) => a.sort - b.sort);
}

function selectedCycleFor(plan) {
  const cycles = planCycles(plan);
  return cycles.find(c => c.id === selectedBillingCycleId) || cycles[0] || { ...BILLING_DEFAULTS.mensal, preco: plan.preco || 'Sob consulta' };
}

function priceTextFor(plan, cycle) {
  return cycle?.preco || plan.preco || 'Sob consulta';
}

function installmentTextFor(cycle) {
  if (!cycle || cycle.id === 'mensal') return '';
  if (cycle.installmentText || cycle.parcelamento || cycle.parcelado) return cycle.installmentText || cycle.parcelamento || cycle.parcelado;
  const amount = Number(cycle.priceAmount || 0);
  const count = Number(cycle.installments || (cycle.id === 'anual' ? 12 : 6));
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(count) || count <= 1) return cycle.installmentsLabel || `${count}x sem juros`;
  return `${count}x de ${formatMoneyBR(amount / count)} sem juros`;
}

function cycleSubtitleFor(cycle) {
  if (!cycle) return '';
  if (cycle.id === 'mensal') return 'Pagamento mensal para começar com baixo investimento.';
  if (cycle.id === 'semestral') return 'Plano de 6 meses, com opção de parcelar sem juros no cartão.';
  if (cycle.id === 'anual') return 'Plano de 1 ano, com opção de parcelar sem juros no cartão.';
  return cycle.label || '';
}

function totalTextFor(cycle) {
  if (!cycle || cycle.id === 'mensal') return '';
  const amount = Number(cycle.priceAmount || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Valor total definido pelo servidor de licenças.';
  return `Total: ${formatMoneyBR(amount)}`;
}

function renderPlan(plan) {
  const features = Array.isArray(plan.features) ? plan.features : [];
  const supportOnly = plan.supportOnly || plan.id === 'personalizado';
  const cycles = planCycles(plan);
  const cycle = supportOnly ? null : selectedCycleFor(plan);
  const priceText = supportOnly ? (plan.preco || 'Sob consulta') : priceTextFor(plan, cycle);
  const installmentText = supportOnly ? '' : installmentTextFor(cycle);
  const totalText = supportOnly ? '' : totalTextFor(cycle);
  const buttonLabel = plan.buttonLabel || (supportOnly ? 'Falar com suporte' : 'Começar agora');
  return `
    <article class="plan-card ${plan.featured ? 'featured' : ''}">
      ${plan.featured ? '<span class="plan-badge">Mais escolhido</span>' : ''}
      <h3>${escapeHtml(plan.nome || '')}</h3>
      ${supportOnly ? '' : `<span class="plan-cycle-pill">${escapeHtml(BILLING_LABELS[cycle?.id] || cycle?.label || 'Plano')}</span>`}
      <div class="plan-price">
        <small>${supportOnly ? 'sob medida' : cycle?.id === 'mensal' ? 'mensalidade' : 'valor do período'}</small>
        <span class="price-main">${escapeHtml(priceText)}</span>
        ${supportOnly ? '' : `<span class="price-subtitle">${escapeHtml(cycleSubtitleFor(cycle))}</span>`}
      </div>
      ${installmentText ? `<div class="installment-line">${escapeHtml(installmentText)}</div>` : ''}
      ${totalText ? `<div class="total-line">${escapeHtml(totalText)}</div>` : ''}
      <p>${escapeHtml(plan.descricao || '')}</p>
      ${plan.destaque ? `<p><strong>${escapeHtml(plan.destaque)}</strong></p>` : ''}
      <ul>${features.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <button class="btn btn-primary" type="button" data-buy-plan="${escapeAttr(plan.id)}" data-cycle-id="${escapeAttr(cycle?.id || 'mensal')}" data-support-only="${supportOnly ? '1' : '0'}">${escapeHtml(buttonLabel)}</button>
    </article>`;
}

function renderPlansEmpty() {
  return `<div class="plans-empty">
    <h3>Não conseguimos carregar os planos agora.</h3>
    <p>Fale com o suporte para começar o teste grátis, ativar um plano ou confirmar valores atualizados.</p>
    <a data-support-link href="${escapeAttr(whatsappUrl(CONFIG.supportWhatsappUrl, CONFIG.purchaseWhatsappText || 'Olá! Quero começar a usar o Terê Studio na minha loja.'))}">Falar com suporte</a>
  </div>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
}
function escapeAttr(value) { return escapeHtml(value); }

const grid = document.getElementById('plansGrid');
function renderPlans() {
  if (!grid) return;
  grid.innerHTML = plans.length ? plans.map(renderPlan).join('') : renderPlansEmpty();
  setSupportLinks(CONFIG);
}

plans = await loadPlans();
renderPlans();

function updateBillingToggle() {
  for (const btn of document.querySelectorAll('[data-cycle-toggle]')) {
    const active = btn.dataset.cycleToggle === selectedBillingCycleId;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  }
}

document.addEventListener('click', ev => {
  const toggle = ev.target.closest('[data-cycle-toggle]');
  if (!toggle) return;
  selectedBillingCycleId = normalizeCycleId(toggle.dataset.cycleToggle || 'mensal');
  updateBillingToggle();
  renderPlans();
});

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
  if (!form || !checkoutSection) return;
  selectedPlan = plan;
  selectedCycle = cycle;
  form.planId.value = selectedPlan.id;
  if (form.cycleId) form.cycleId.value = selectedCycle.id || 'mensal';
  const installmentText = installmentTextFor(selectedCycle);
  const totalText = totalTextFor(selectedCycle);
  summaryTitle.textContent = selectedPlan.nome || 'Plano selecionado';
  summaryText.textContent = selectedPlan.destaque || selectedPlan.descricao || 'Plano Terê Studio';
  summaryPrice.textContent = priceTextFor(selectedPlan, selectedCycle);
  summaryCycle.textContent = selectedCycle.label || 'Mensal';
  const oldInstallment = document.getElementById('checkoutInstallmentNote');
  oldInstallment?.remove();
  if (installmentText || totalText) {
    const note = document.createElement('p');
    note.id = 'checkoutInstallmentNote';
    note.className = 'checkout-installment-note';
    note.innerHTML = `${installmentText ? `<strong>${escapeHtml(installmentText)}</strong>` : ''}${totalText ? ` · ${escapeHtml(totalText)}` : ''}`;
    summaryCycle.insertAdjacentElement('afterend', note);
  }
  planInfo.textContent = `Plano ${selectedPlan.nome} · ${selectedCycle.label || 'Mensal'}${selectedCycle.preco ? ' · ' + selectedCycle.preco : ''}. Você seguirá para o pagamento seguro.`;
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
  const cycle = planCycles(plan).find(c => String(c.id) === String(btn.dataset.cycleId)) || selectedCycleFor(plan);
  if (btn.dataset.supportOnly === '1' || plan.supportOnly) {
    window.location.href = whatsappUrl(CONFIG.supportWhatsappUrl, `${CONFIG.purchaseWhatsappText || 'Olá! Quero começar a usar o Terê Studio na minha loja.'}\nPlano: ${plan.nome}`);
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
    installments: Number(selectedCycle?.installments || 1),
    cliente: {
      nome: fd.get('nome'),
      loja: fd.get('loja'),
      whatsapp: fd.get('whatsapp'),
      email: fd.get('email'),
      cpf: fd.get('cpf'),
      documento: fd.get('cpf')
    }
  };
  message.textContent = 'Preparando ativação segura no servidor...';
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const resp = await fetch(apiUrl(CONFIG, '/checkout/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.ok === false) throw new Error(json.error || 'Não foi possível iniciar a ativação.');
    if (json.checkoutMode === 'configure_payment_provider') {
      message.textContent = 'O Mercado Pago ainda não foi configurado no servidor. Abrindo suporte para concluir com segurança.';
      window.location.href = whatsappUrl(CONFIG.supportWhatsappUrl, `${CONFIG.purchaseWhatsappText || 'Olá! Quero começar a usar o Terê Studio na minha loja.'}\nPlano: ${selectedPlan.nome}\nDuração: ${selectedCycle?.label || 'Mensal'}\nPedido: ${json.orderId}`);
      return;
    }
    message.textContent = 'Abrindo pagamento seguro...';
    window.location.href = json.checkoutUrl || json.successUrl || 'sucesso.html?pedido=' + encodeURIComponent(json.orderId);
  } catch (err) {
    message.textContent = err instanceof Error ? err.message : 'Não foi possível iniciar a ativação.';
  } finally {
    submit.disabled = false;
  }
});

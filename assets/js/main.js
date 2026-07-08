import { loadConfig, apiUrl, setSupportLinks, whatsappUrl } from './common.js';

let CONFIG = await loadConfig();
setSupportLinks(CONFIG);


async function loadLandingContent(config) {
  const fallback = {
    texts: {
      heroTitle: 'Gestão para joias e semijoias personalizadas, do pedido à produção.',
      heroSubtitle: 'Organize atendimento, pedidos, prévia da gravação, produção, totem e controle da loja em uma rotina simples de acompanhar.',
      previewTitle: 'Prévia da gravação antes de produzir.',
      previewText: 'O cliente entende melhor a personalização, sua equipe confirma o pedido com mais segurança e a produção recebe a informação do jeito certo.',
      totemTitle: 'Seu cliente começa o pedido direto no tablet.',
      totemText: 'O Totem ajuda a loja a atender com mais agilidade, mantendo uma experiência simples, bonita e organizada. Por enquanto, a landing trata o Totem no formato horizontal usado hoje.'
    },
    media: {},
    testimonials: []
  };
  const urls = [apiUrl(config, '/public/landing'), 'content/landing-content.json'];
  for (const url of urls) {
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      const json = await resp.json();
      if (resp.ok && json && (json.ok || json.texts || json.media || json.testimonials)) {
        const data = json.landing || json;
        return {
          texts: { ...fallback.texts, ...(data.texts || {}) },
          media: { ...(data.media || {}) },
          testimonials: Array.isArray(data.testimonials) ? data.testimonials : []
        };
      }
    } catch {}
  }
  return fallback;
}
function applyLandingContent(content) {
  const texts = content.texts || {};
  document.querySelectorAll('[data-landing-text]').forEach(el => {
    const key = el.dataset.landingText;
    if (texts[key]) el.textContent = texts[key];
  });
  const media = content.media || {};
  document.querySelectorAll('[data-landing-media]').forEach(img => {
    const key = img.dataset.landingMedia;
    const url = media[key + 'Url'] || media[key] || '';
    if (url) img.src = url;
  });
  document.querySelectorAll('[data-landing-screen]').forEach(img => {
    const key = img.dataset.landingScreen;
    const url = media[key + 'Url'] || media[key] || '';
    if (url) {
      img.src = url;
      img.closest('.device')?.classList.add('has-screen');
    } else {
      img.closest('.device')?.classList.remove('has-screen');
    }
  });
  renderTestimonials(content.testimonials || []);
}
let testimonialIndex = 0;
function renderTestimonials(items = []) {
  const active = items.filter(item => item && item.ativo !== false && (item.texto || item.text) && item.nome).sort((a,b)=>Number(a.ordem||0)-Number(b.ordem||0));
  const section = document.getElementById('depoimentos');
  const track = document.querySelector('[data-testimonial-track]');
  const dots = document.querySelector('[data-testimonial-dots]');
  const nav = document.querySelector('[data-testimonials-nav]');
  if (!section || !track || !dots) return;
  if (!active.length) { section.hidden = true; if (nav) nav.hidden = true; return; }
  section.hidden = false; if (nav) nav.hidden = false;
  const avatar = item => item.fotoUrl || item.photoUrl || item.foto || 'assets/img/tere-studio-logo.webp';
  track.innerHTML = active.map((item, index) => `<article class="testimonial-card ${index === testimonialIndex ? 'active' : ''}"><img src="${escapeAttr(avatar(item))}" alt="${escapeAttr(item.nome)}"/><div><blockquote>“${escapeHtml(item.texto || item.text)}”</blockquote><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml([item.loja, item.cidade].filter(Boolean).join(' · '))}</small></div></article>`).join('');
  dots.innerHTML = active.map((_, index) => `<button class="${index === testimonialIndex ? 'active' : ''}" type="button" data-testimonial-dot="${index}" aria-label="Ver depoimento ${index+1}"></button>`).join('');
  document.querySelector('[data-testimonial-prev]')?.addEventListener('click', () => { testimonialIndex = (testimonialIndex - 1 + active.length) % active.length; renderTestimonials(active); });
  document.querySelector('[data-testimonial-next]')?.addEventListener('click', () => { testimonialIndex = (testimonialIndex + 1) % active.length; renderTestimonials(active); });
  dots.querySelectorAll('[data-testimonial-dot]').forEach(btn => btn.addEventListener('click', () => { testimonialIndex = Number(btn.dataset.testimonialDot || 0); renderTestimonials(active); }));
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch])); }
function escapeAttr(value) { return escapeHtml(value); }

const LANDING_CONTENT = await loadLandingContent(CONFIG);
applyLandingContent(LANDING_CONTENT);

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
const BILLING_HELP = {
  mensal: 'Mensal para começar agora, com baixo investimento inicial.',
  semestral: 'Semestral para manter a loja organizada por 6 meses, com opção de parcelamento sem juros no cartão.',
  anual: 'Anual para usar por 12 meses, com melhor planejamento e opção de parcelamento sem juros no cartão.'
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
  if (!Number.isFinite(amount) || amount <= 0) return 'Valor total conforme o plano selecionado.';
  return `Total: ${formatMoneyBR(amount)}`;
}

function planLabelFor(plan) {
  if (plan.label || plan.tagline) return plan.label || plan.tagline;
  const id = String(plan.id || '').toLowerCase();
  if (id === 'inicial') return 'Para começar';
  if (id === 'profissional') return 'Mais escolhido';
  if (id === 'avancado' || id === 'avançado') return 'Para crescer';
  if (id === 'personalizado') return 'Sob medida';
  return 'Plano Terê Studio';
}

function planAudienceFor(plan) {
  if (plan.audience || plan.publico) return plan.audience || plan.publico;
  const id = String(plan.id || '').toLowerCase();
  if (id === 'inicial') return 'Para lojas que querem organizar a rotina principal em um computador.';
  if (id === 'profissional') return 'Para lojas com mais movimento, produção diária e atendimento mais completo.';
  if (id === 'avancado' || id === 'avançado') return 'Para operações com mais computadores, equipe e necessidade de mais controle.';
  if (id === 'personalizado') return 'Para redes, implantação guiada ou necessidades especiais.';
  return plan.descricao || 'Para organizar a rotina da loja com mais clareza.';
}

function priceMarkupFor(plan, cycle, supportOnly) {
  if (supportOnly) {
    return `<div class="plan-price premium-price"><small>plano sob medida</small><span class="price-main">${escapeHtml(plan.preco || 'Sob consulta')}</span><span class="price-subtitle">Condições alinhadas pelo suporte.</span></div>`;
  }
  const priceText = priceTextFor(plan, cycle);
  const installmentText = installmentTextFor(cycle);
  const totalText = totalTextFor(cycle);
  if (cycle?.id !== 'mensal' && Number(cycle?.priceAmount || 0) > 0 && installmentText) {
    return `<div class="plan-price premium-price installment-price"><small>${escapeHtml(cycle.label || 'Plano')}</small><span class="price-main">${escapeHtml(installmentText)}</span><span class="price-subtitle">${escapeHtml(totalText || priceText)}</span></div>`;
  }
  return `<div class="plan-price premium-price"><small>${cycle?.id === 'mensal' ? 'mensalidade' : 'valor do período'}</small><span class="price-main">${escapeHtml(priceText)}${cycle?.id === 'mensal' && priceText !== 'Sob consulta' ? '<em>/mês</em>' : ''}</span>${installmentText ? `<span class="price-subtitle">${escapeHtml(installmentText)}</span>` : `<span class="price-subtitle">${escapeHtml(cycleSubtitleFor(cycle))}</span>`}</div>`;
}

function renderPlan(plan) {
  const features = Array.isArray(plan.features) ? plan.features : [];
  const planIdentity = normalizeCycleId(`${plan.id || ''} ${plan.nome || ''} ${plan.label || ''}`);
  const supportOnly = Boolean(plan.supportOnly) || planIdentity.includes('personalizado') || planIdentity.includes('sob_medida') || /personalizado|sob medida|implantação guiada/i.test(`${plan.nome || ''} ${plan.label || ''} ${plan.audience || ''}`);
  const cycle = supportOnly ? null : selectedCycleFor(plan);
  const buttonLabel = plan.buttonLabel || (supportOnly ? 'Falar com suporte' : 'Começar agora');
  const featured = Boolean(plan.featured) && !supportOnly;
  const planClass = ['plan-card', 'pricing-card'];
  if (featured) planClass.push('featured');
  if (supportOnly) planClass.push('support-only');

  if (supportOnly) {
    return `
      <article class="${planClass.join(' ')}">
        <div class="support-plan-copy">
          <span class="plan-kicker">${escapeHtml(planLabelFor(plan))}</span>
          <h3>${escapeHtml(plan.nome || 'Personalizado')}</h3>
          <p class="plan-audience">${escapeHtml(planAudienceFor(plan))}</p>
        </div>
        ${priceMarkupFor(plan, null, true)}
        <ul class="plan-feature-list compact">${features.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        <button class="btn btn-primary" type="button" data-buy-plan="${escapeAttr(plan.id)}" data-cycle-id="mensal" data-support-only="1">${escapeHtml(buttonLabel)}</button>
      </article>`;
  }

  return `
    <article class="${planClass.join(' ')}">
      ${featured ? '<span class="plan-badge">Mais escolhido</span>' : ''}
      <header class="plan-card-head">
        <span class="plan-kicker">${escapeHtml(planLabelFor(plan))}</span>
        <h3>${escapeHtml(plan.nome || '')}</h3>
      </header>
      <p class="plan-audience">${escapeHtml(planAudienceFor(plan))}</p>
      <span class="plan-cycle-pill">${escapeHtml(BILLING_LABELS[cycle?.id] || cycle?.label || 'Plano')}</span>
      ${priceMarkupFor(plan, cycle, false)}
      ${plan.destaque ? `<p class="plan-highlight">${escapeHtml(plan.destaque)}</p>` : ''}
      <ul class="plan-feature-list">${features.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <div class="plan-card-bottom">
        <button class="btn btn-primary" type="button" data-buy-plan="${escapeAttr(plan.id)}" data-cycle-id="${escapeAttr(cycle?.id || 'mensal')}" data-support-only="0">${escapeHtml(buttonLabel)}</button>
        <small>Ativação e cobrança protegidas pelos canais oficiais do Terê Studio.</small>
      </div>
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
  const help = document.getElementById('billingHelpText');
  if (help) help.textContent = BILLING_HELP[selectedBillingCycleId] || BILLING_HELP.mensal;
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
  message.textContent = 'Preparando ativação segura...';
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
      message.textContent = 'O Mercado Pago ainda não foi configurado. Abrindo suporte para concluir com segurança.';
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

// RC61.7 — entrada suave das seções e cards
const revealTargets = [
  '.quick-cards article',
  '.spotlight .spotlight-image', '.spotlight .spotlight-copy',
  '.modules-section .section-title', '.module-grid article',
  '.inside-head', '.screen-card',
  '.pricing-hero', '.billing-panel', '.pricing-card', '.comparison-card', '.plan-faq-grid article',
  '.testimonial-band .testimonial-copy', '.support-cards article',
  '.faq-grid .section-title', '.faq-list details', '.license-recovery .recovery-grid'
];
const revealEls = revealTargets.flatMap(selector => Array.from(document.querySelectorAll(selector)));
revealEls.forEach((el, index) => {
  el.classList.add('reveal', `reveal-delay-${(index % 4) + 1}`);
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

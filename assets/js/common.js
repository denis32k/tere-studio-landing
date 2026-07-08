export async function loadConfig() {
  const fallback = {
    brandName: 'Terê Studio',
    headline: 'O Terê Studio para usar na rotina da sua loja',
    subheadline: 'Use o Terê Studio para cuidar do atendimento, pedidos, mockups, produção, estoque, caixa, totem e licenças em um só lugar.',
    licenseServerUrl: 'https://li.terepersonalizados.com.br/api',
    downloadUrl: 'https://terestudio.terepersonalizados.com.br/download/tere-studio-installer.exe',
    supportWhatsappUrl: 'https://wa.me/5535999999999',
    supportWhatsappText: 'Olá! Preciso de suporte com minha licença do Terê Studio.',
    purchaseWhatsappText: 'Olá! Quero começar a usar o Terê Studio na minha loja.',
    primaryCta: 'Começar teste grátis',
    secondaryCta: 'Ver as telas do sistema',
    securityNotice: 'Por segurança, sua licença será exibida somente aqui esta única vez. Guarde em local seguro.'
  };
  try {
    const resp = await fetch('content/site-config.json', { cache: 'no-store' });
    if (!resp.ok) return fallback;
    return { ...fallback, ...(await resp.json()) };
  } catch { return fallback; }
}
export function apiBase(config) {
  return String(config.licenseServerUrl || '').replace(/\/$/, '');
}
export function apiUrl(config, path) {
  const base = apiBase(config);
  const clean = String(path || '').replace(/^\//, '');
  return `${base}/${clean}`;
}
export function whatsappUrl(base, text) {
  const url = String(base || '').trim() || 'https://wa.me/5535999999999';
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}text=${encodeURIComponent(text || '')}`;
}
export function setSupportLinks(config, text) {
  document.querySelectorAll('[data-support-link]').forEach(link => {
    link.href = whatsappUrl(config.supportWhatsappUrl, text || config.supportWhatsappText);
  });
}
export function formatDateBR(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return iso; }
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

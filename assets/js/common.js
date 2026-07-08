export async function loadConfig() {
  const fallback = {
    brandName: 'Terê Studio',
    headline: 'Gestão para joias e semijoias personalizadas, do pedido à produção.',
    subheadline: 'O Terê Studio organiza atendimento, pedidos, clientes, personalizações, produção e controle da loja em uma rotina simples de acompanhar.',
    licenseServerUrl: 'https://li.terepersonalizados.com.br/api',
    downloadUrl: 'https://terestudio.terepersonalizados.com.br/download/tere-studio-installer.exe',
    supportWhatsappUrl: 'https://wa.me/5535999999999',
    supportWhatsappText: 'Olá! Preciso de suporte com minha licença do Terê Studio.',
    purchaseWhatsappText: 'Olá! Quero começar a usar o Terê Studio na minha loja.',
    primaryCta: 'Começar teste grátis',
    secondaryCta: 'Conhecer o sistema',
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

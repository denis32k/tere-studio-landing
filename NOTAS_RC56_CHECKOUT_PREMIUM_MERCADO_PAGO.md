# Terê Studio Landing Page RC56 — Checkout premium + Mercado Pago

## O que mudou

- A landing não abre mais checkout em popup.
- O cliente entra na página normal, vê apresentação, benefícios, módulos e planos.
- Ao escolher plano/ciclo, a página rola para uma seção premium de checkout dentro da própria landing.
- O checkout mostra resumo do plano, ciclo, preço, benefícios e selo de pagamento seguro Mercado Pago.
- Mantém ciclos: 1 mês, 6 meses e 1 ano.
- O botão final chama o servidor de licenças em `/api/checkout/orders`.
- Se o Mercado Pago estiver configurado no servidor, o cliente é redirecionado para o Checkout Pro.
- Se o Mercado Pago ainda não estiver configurado, a landing abre o WhatsApp com plano, ciclo e número do pedido.

## Arquivos principais

- `index.html`
- `assets/css/styles.css`
- `assets/js/main.js`
- `content/site-config.json`
- `content/plans.json`

## Atenção

Não coloque tokens, senhas ou segredo do Mercado Pago na landing. Esses dados ficam somente no servidor de licenças/EasyPanel.

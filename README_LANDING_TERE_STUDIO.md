# Terê Studio — Landing page oficial

Esta pasta é um projeto independente do executável. Pode ser hospedada como site estático em qualquer hospedagem comum.

## Arquivos principais

- `index.html`: página comercial com apresentação, benefícios, módulos, planos, compra e suporte.
- `sucesso.html`: tela de sucesso que consulta o servidor e exibe a licença uma única vez.
- `recuperar-licenca.html`: página de suporte para recuperação de licença.
- `content/site-config.json`: textos, URLs, WhatsApp, servidor de licenças e download.
- `content/plans.json`: planos de fallback quando o servidor ainda não estiver configurado.

## Como alterar textos, preços e botões sem novo instalador

Edite apenas os arquivos dentro de `content/` e publique novamente a landing. Isso não altera o app instalado.

## Integração com servidor de licenças

A landing usa a URL configurada em `content/site-config.json`:

```json
"licenseServerUrl": "https://li.terepersonalizados.com.br/api"
```

Endpoints usados:

- `GET /checkout/plans`
- `POST /checkout/orders`
- `GET /checkout/orders/:orderId/status`
- `POST /checkout/success/reveal`

A licença não vai na URL. A página de sucesso recebe apenas o número do pedido e solicita ao servidor um token temporário para revelar a licença uma única vez.

## WhatsApp

A estrutura está pronta para WhatsApp Business API no servidor, mas esta landing não usa WhatsApp Web, QR Code ou automação não oficial. O botão atual abre conversa de suporte comum.

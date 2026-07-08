# Terê Studio — Landing page oficial

Esta pasta é um projeto independente do executável instalado. A landing pode ser hospedada como site estático e alterada sem gerar novo instalador do Terê Studio.

## Posicionamento

O Terê Studio deve ser apresentado como um sistema de gestão para lojas de joias e semijoias personalizadas organizarem atendimento, pedidos, clientes, prévias da personalização, produção, estoque, caixa, totem e licenças.

Importante: não vender como ERP fiscal e não prometer emissão de NF-e/NFC-e.

## Arquivos principais

- `index.html`: página comercial com apresentação, benefícios, módulos, planos, checkout, FAQ, suporte e seção de apresentação do sistema.
- `sucesso.html`: página de sucesso que consulta o servidor e exibe a licença uma única vez.
- `recuperar-licenca.html`: recuperação de licença via suporte oficial.
- `ajuda.html`: central simples de ajuda.
- `termos.html`: termos de uso base.
- `privacidade.html`: política de privacidade/LGPD base.
- `content/site-config.json`: headline, subtítulo, CTAs, URLs, WhatsApp, servidor de licenças e download.
- `content/plans.json`: planos de fallback quando o servidor ainda não estiver configurado.

## Como alterar textos, preços e botões sem novo instalador

Edite os arquivos dentro de `content/` e publique novamente a landing. Isso não altera o app instalado.

Campos mais importantes:

```json
"headline": "Gestão para joias e semijoias personalizadas, do pedido à produção.",
"subheadline": "O Terê Studio organiza atendimento, pedidos, clientes, personalizações, produção e controle da loja em uma rotina simples de acompanhar.",
"supportWhatsappUrl": "https://wa.me/5535999999999"
```

Antes de publicar, troque `supportWhatsappUrl` pelo WhatsApp real.

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

## Prints reais do sistema

A seção `#por-dentro` apresenta as principais áreas do sistema. Quando os prints reais forem enviados, substituir os cards visuais por imagens otimizadas em `assets/img/screenshots/`.


## RC61.5 — Planos premium

Esta versão melhora a seção de planos para parecer uma página real de SaaS:

- cards premium;
- plano Profissional como “Mais escolhido”;
- chave Mensal/Semestral/Anual;
- parcelamento visual para ciclos maiores;
- tabela comparativa;
- dúvidas rápidas de plano;
- linguagem final para lojista, sem bastidor.

A landing continua buscando planos no servidor de licenças antes de usar `content/plans.json` como fallback.


## RC61.6 — Refino visual premium

Refino visual aplicado em cima da RC61.5 para deixar a landing com aparência mais profissional, limpa e SaaS real, principalmente nos planos.

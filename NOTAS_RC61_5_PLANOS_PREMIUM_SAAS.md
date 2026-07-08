# Terê Studio Landing — RC61.5

## Objetivo
Transformar a área de planos em uma seção com cara de SaaS real, inspirada na lógica de páginas profissionais de planos: escolha rápida, plano recomendado, comparação objetiva e dúvidas de decisão.

## O que entrou

- Nova seção de planos premium.
- Cabeçalho de planos com promessa mais clara para lojista.
- Chave Mensal / Semestral / Anual mantida e redesenhada.
- Cards com linguagem de decisão:
  - Inicial — Para começar.
  - Profissional — Mais escolhido.
  - Avançado — Para crescer.
  - Personalizado — Sob medida.
- Plano Profissional destacado visualmente.
- Textos de plano reescritos para uso real na loja.
- Parcelamento sem juros mantido para semestral e anual.
- Tabela comparativa de recursos.
- Blocos de dúvidas rápidas de plano.
- Remoção de termos públicos com cara de bastidor.
- Comunicação sem “mockup”, sem “prints” e sem “peça”.

## Mantido

- Integração com servidor de licenças.
- Busca dinâmica de planos em `/checkout/plans`.
- Fallback local em `content/plans.json`.
- Envio de ciclo de cobrança no checkout.
- Envio de parcelas para o servidor.
- Página de sucesso, recuperação de licença, suporte, termos e privacidade.

## Observações

Os valores continuam sendo controlados pelo servidor de licenças. A landing apenas renderiza o ciclo selecionado e exibe o parcelamento quando o servidor envia `priceAmount` e `installments`.

Se o servidor ainda estiver sem valores configurados, a landing exibe “Sob consulta” no fallback local.

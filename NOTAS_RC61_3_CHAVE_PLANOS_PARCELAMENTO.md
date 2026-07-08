# RC61.3 — Chave Mensal/Semestral/Anual e parcelamento

Alterações feitas na landing:

- Troca a antiga lista de ciclos dentro de cada card por uma chave global: Mensal / Semestral / Anual.
- Ao clicar na chave, os cards dos planos atualizam os valores embaixo sem recarregar a página.
- Semestral mostra suporte a parcelamento em até 6x sem juros.
- Anual mostra suporte a parcelamento em até 12x sem juros.
- O valor real continua vindo primeiro do servidor de licenças pelo endpoint `/api/checkout/plans`.
- O arquivo `content/plans.json` segue como fallback caso o servidor esteja fora.
- A landing envia para o servidor `billingCycle`, `cycleId`, `durationMonths` e `installments`.

Como configurar valores:

Preferência: configurar os valores no painel/JSON do servidor de licenças, não fixar na landing.

Estrutura esperada por ciclo:

```json
{
  "id": "semestral",
  "label": "Semestral",
  "months": 6,
  "preco": "R$ 479,40",
  "priceAmount": 479.40,
  "installments": 6
}
```

Para o anual:

```json
{
  "id": "anual",
  "label": "Anual",
  "months": 12,
  "preco": "R$ 958,80",
  "priceAmount": 958.80,
  "installments": 12
}
```

A landing calcula automaticamente textos como `6x de R$ 79,90 sem juros` e `12x de R$ 79,90 sem juros`, desde que `priceAmount` esteja preenchido.

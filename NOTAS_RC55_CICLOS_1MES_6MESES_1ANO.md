# Landing Page Terê Studio RC55 — ciclos de venda

A landing agora mostra, dentro de cada plano, as opções:

- 1 mês
- 6 meses
- 1 ano

O cliente escolhe o plano e o ciclo antes de preencher os dados.

## Separação correta

- Plano = recursos e limites do sistema.
- Ciclo = tempo comprado.

Exemplo:

- Plano Profissional + 1 mês
- Plano Profissional + 6 meses
- Plano Profissional + 1 ano

O plano Personalizado continua levando para suporte/WhatsApp.

## Arquivos principais

- `content/plans.json`: fallback dos planos/ciclos quando o servidor não responde.
- `assets/js/main.js`: renderiza os ciclos e envia `billingCycle` para o servidor.
- `assets/js/success.js`: mostra a duração comprada na tela de sucesso.

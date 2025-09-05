
# Marvel Multiverse – Chat Power Details

Mostra **ACTION**, **DURATION** e **COST** dos poderes diretamente no **primeiro card** do chat ao clicar em um poder no sistema Marvel Multiverse (v2.2.0+).

> Não duplica no card de rolagem/dano. Não altera regras nem rolagens.

## Instalação
1. Extraia a pasta `marvel-multiverse-chat-power-details` em `Data/modules/` (ficando `Data/modules/marvel-multiverse-chat-power-details/`).
2. Ative em *Manage Modules*.
3. Clique em um poder: o card de descrição exibirá o bloco **POWER DETAILS**.

## Compatibilidade
- Foundry **v13** (mínimo v12).
- Sistema **marvel-multiverse** (testado com **2.2.0**).

## Como funciona
- Lê o **flavor** do chat (ex.: `power: Esmagar`) para identificar o item do poder no ator do *speaker*.
- Recupera de `item.system` os campos `action`, `duration` e `cost`.
- Injeta o bloco apenas no **primeiro card** (mensagens sem `message.rolls`).

## Desenvolvimento
- Código simples em **`main.js`** e estilo em **`styles.css`**.
- Licença **MIT**.

Manifest link: https://raw.githubusercontent.com/rodrigosinistro/marvel-multiverse-chat-power-details/main/module.json

---
v1.0.0 • 2025-09-05

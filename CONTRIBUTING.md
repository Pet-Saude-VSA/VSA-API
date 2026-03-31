# Guia de Contribuição - Pet-Saúde VSA

Bem-vindo ao projeto! Para manter a organização e a qualidade do código, seguimos estas diretrizes.

## 🌿 Fluxo de Git (Git Flow Sugerido)
Trabalhamos com o modelo de branches por funcionalidade:
* `main`: Código em produção (estável).
* `feat/nome-da-tarefa`: Para novas funcionalidades.
* `fix/nome-da-correcao`: Para correção de bugs.
* `docs/nome-da-alteracao`: Para documentação.

## 📝 Padrão de Commits (Conventional Commits)
Os commits devem seguir o seguinte formato: `tipo: descrição curta`

**Tipos permitidos:**
* `feat:` Uma nova funcionalidade.
* `fix:` Correção de um erro/bug.
* `docs:` Alterações apenas na documentação.
* `style:` Alterações de formatação que não afetam a lógica (espaços, ponto e vírgula).
* `refactor:` Mudança no código que não corrige erro nem adiciona funcionalidade.
* `ui:` Alterações de interface (específico para o mobile).

**Exemplos:**
- `feat: adiciona tela de login`
- `fix: corrige erro no cálculo de doses da vacina`

## 🚀 Processo de Submissão
1. Crie uma branch a partir da `main`.
2. Faça as alterações e realize os commits seguindo o padrão.
3. Envie (push) para o GitHub.
4. Abra um **Pull Request (PR)** descrevendo o que foi feito.
5. Aguarde a revisão de pelo menos um colega antes do merge.

# Fluxo de git

Leia antes de: criar branch, abrir PR, fazer merge ou limpar branches.

1. **Toda branch nasce da `main` atualizada:** `git switch main && git pull` antes de `git switch -c <tipo>/<descrição>` (ex.: `feat/ep-04-organizacao`, `fix/autosave-retry`, `docs/guidelines-em-pasta`).
2. **Todo PR tem a `main` como base.** Nada de PRs empilhados (um PR com base em outra branch): o merge vai para a branch intermediária, não para a `main`, e o trabalho fica fora dela sem ninguém notar. Se uma entrega depende de outra, espere a primeira entrar na `main` e crie a próxima branch a partir dela.
3. **Merge só com o CI verde**, usando *merge commit* (`gh pr merge <número> --merge --delete-branch`). Sempre informe o número do PR: sem ele, o `gh` age sobre o PR da branch atual.
4. **Depois do merge, volte para a `main` e atualize:** `git switch main && git pull && git fetch --prune`.
5. **Apague a branch assim que ela não for mais usada**, no GitHub (o `--delete-branch` do merge já faz isso) e localmente (`git branch -d <branch>`). Branch que não será mergeada também é apagada, depois de confirmar que nada nela precisa ser aproveitado.

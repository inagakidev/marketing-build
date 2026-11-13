# Git workflow

Read before: creating a branch, opening a PR, merging or cleaning up branches.

1. **Every branch starts from an up-to-date `main`:** `git switch main && git pull` before `git switch -c <type>/<description>` (e.g. `feat/ep-04-organization`, `fix/autosave-retry`, `docs/guidelines-folder`).
2. **Every PR targets `main`.** No stacked PRs (a PR based on another branch): the merge lands in the intermediate branch, not in `main`, and the work silently stays out of it. If one delivery depends on another, wait for the first to land in `main` and branch the next one from there.
3. **Merge only with green CI**, using a *merge commit* (`gh pr merge <number> --merge --delete-branch`). Always pass the PR number: without it, `gh` acts on the PR of the current branch.
4. **After merging, go back to `main` and update:** `git switch main && git pull && git fetch --prune`.
5. **Delete branches as soon as they are no longer used**, on GitHub (`--delete-branch` on merge already does it) and locally (`git branch -d <branch>`). A branch that won't be merged is deleted too, after confirming nothing in it needs to be kept.

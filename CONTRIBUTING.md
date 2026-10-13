# Contributing and Git conventions

## Branch names

Use a lowercase type prefix and a short kebab-case description:

```text
<type>/<short-description>
```

Examples: `feat/item-import`, `fix/offline-sync-retry`, `docs/architecture-map`, `refactor/api-client`.

Common branch types:

- `feat/` — new user-facing capability
- `fix/` — bug fix
- `docs/` — documentation only
- `refactor/` — code restructuring without intended behavior change
- `test/` — test-only change
- `chore/` — maintenance or tooling
- `perf/` — performance improvement
- `ci/` — CI workflow change

Start each task branch from an up-to-date `main` and keep it focused on one change.

## Commit messages

Follow Conventional Commits:

```text
<type>(<scope>): <short imperative summary>
```

Examples:

```text
feat(catalog): add bulk item import
fix(offline): preserve queued movements after sign-out
docs(architecture): map routes and runtime dependencies
chore(git): document branch and commit conventions
```

Use the same common types listed above. Scope is optional, but useful when it names the affected area (`auth`, `catalog`, `api`, `offline`, `docs`, `git`). Keep the subject concise, imperative, and without a trailing period. For incompatible changes, mark the type with `!` (for example `feat(api)!: replace movement payload`) and explain the migration in the commit body with `BREAKING CHANGE:`.

## Basic workflow

1. Update `main`, then create a branch such as `feat/item-import`.
2. Make one coherent change and include its documentation/tests when appropriate.
3. Review `git status` and the staged diff; never commit `.env` files, credentials, build output, or local test results.
4. Commit with a Conventional Commit message, then open a pull request back to `main`.

The repository uses the author identity supplied for this project: `Ybee <usouff.dev@gmail.com>`.

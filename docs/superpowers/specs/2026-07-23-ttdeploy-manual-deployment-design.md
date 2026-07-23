# `ttdeploy` Manual Deployment Command — Design

**Date:** 2026-07-23
**Branch:** `migrate/here-now`
**Status:** Approved

## Goal

Provide one globally available `ttdeploy` command that safely builds and
publishes the Tiny Trauma site from whichever named Git branch is currently
checked out.

The command is the manual fallback for GitHub Actions. It must produce the same
authenticated here.now deployment and verify that `tinytrauma.com` serves that
deployment.

## Decisions

- Deploy the currently checked-out named branch.
- Do not fetch, pull, switch branches, merge, or create a worktree.
- Refuse to deploy a dirty worktree, including untracked files.
- Use a repository-owned executable plus a shell alias, rather than embedding
  deployment logic in the shell profile.
- Publish to here.now Site `whole-geyser-5pbf`.
- Verify production domain `tinytrauma.com`.

## Files

### Tiny Trauma repository

```text
bin/
├── tt-deploy              # deployment executable
└── tt-aliases.zsh         # adds alias ttdeploy='tt-deploy'
tests/deploy/
├── _assert.zsh
└── test-tt-deploy.zsh
README.md                  # manual deployment instructions
```

### Profiles repository

`/Users/amittiwari/Profiles/.bash_aliases` currently sources Tiny Trauma aliases
from the stale, nonexistent path
`$HOME/Projects/AmitTiwari/tiny-trauma-v2/bin/tt-aliases.zsh`. Update that source
path to:

```zsh
$HOME/Projects/TinyTrauma/tiny-trauma-v2/bin/tt-aliases.zsh
```

This makes the existing Tiny Trauma aliases and the new `ttdeploy` alias
available in new interactive zsh sessions.

## Command interface

```text
ttdeploy
tt-deploy
tt-deploy --help
```

No deployment flags are needed. Site slug, production domain, and output
directory are repository constants.

## Deployment flow

`bin/tt-deploy` is an executable zsh script with
`#!/usr/bin/env zsh`.

It performs these steps in order:

1. Resolve its own absolute path before defining functions, then derive the
   repository root.
2. Verify required commands: `git`, `pnpm`, `curl`, `cmp`, `find`, `grep`,
   `mktemp`, and `sed`.
3. Verify the directory is the expected Git repository.
4. Resolve the current named branch and commit SHA. Refuse detached `HEAD`.
5. Run `git status --porcelain --untracked-files=normal`. Refuse any output.
6. Locate the publisher:
   - `${TT_HERENOW_PUBLISHER}` when explicitly set, primarily for tests.
   - `$HOME/.agents/skills/here-now/scripts/publish.sh` otherwise.
7. Require a non-empty, mode-safe `~/.herenow/credentials` file or an explicit
   `HERENOW_API_KEY`.
8. Run `pnpm install --frozen-lockfile`.
9. Run `pnpm build`.
10. Verify `out/index.html` exists and the export contains at least two files.
11. Scan the export for database connection strings and private keys using the
    same denylist as the generated GitHub workflow. Refuse publication on a
    match.
12. Publish:

    ```zsh
    "$publisher" out --slug whole-geyser-5pbf --client ttdeploy
    ```

13. Capture publisher output without suppressing it. Require:

    ```text
    publish_result.auth_mode=authenticated
    publish_result.site_url=https://whole-geyser-5pbf.here.now/
    ```

14. Download the apex homepage and here.now Site homepage, then require
    byte-for-byte equality.
15. Require:
    - `https://tinytrauma.com/` returns `200`.
    - `https://tinytrauma.com/404.html` returns `200`.
    - `https://www.tinytrauma.com/` returns `301` to
      `https://tinytrauma.com/`.
16. Print branch, commit, published Site URL, and production URL.

The script runs as a child process, so its internal `cd` cannot change the
caller's current directory.

## Failure behavior

Every failed precondition exits non-zero before publication. Every failed
post-publication verification exits non-zero and clearly states that publishing
succeeded but production verification failed.

Important failures include:

- dirty or detached worktree;
- missing dependency, credentials, publisher, or export;
- failed install/build;
- credential-shaped content in the export;
- anonymous publication;
- publication to the wrong slug;
- apex/Site content mismatch;
- incorrect production or `www` HTTP behavior.

No command prints the here.now API key.

## Testing

Offline zsh tests prepend deterministic stubs to `PATH` and set
`TT_HERENOW_PUBLISHER` to a fake publisher. Tests cover:

1. `--help`.
2. Dirty worktree refusal before `pnpm` or publisher invocation.
3. Detached `HEAD` refusal.
4. Current branch and SHA reporting.
5. Frozen install and build command invocation.
6. Missing/empty export refusal.
7. Credential leak refusal.
8. Anonymous publisher result refusal.
9. Wrong Site URL refusal.
10. Apex/Site mismatch refusal.
11. Incorrect `www` redirect refusal.
12. Successful authenticated deployment and verification.
13. `zsh -n` parsing for the executable, alias file, and tests.

Tests must not access GitHub, here.now, or the public internet.

## Documentation and installation

README documents:

- `ttdeploy` as the manual fallback when GitHub Actions is unavailable;
- current-branch and clean-worktree semantics;
- required active here.now credentials;
- success output and failure behavior;
- direct `tt-deploy` equivalent.

After updating the Profiles source path, verify in a fresh interactive zsh:

```zsh
zsh -ic 'alias ttdeploy && command -v tt-deploy'
```

Expected result: alias resolves to `tt-deploy`, and `tt-deploy` resolves to this
repository's `bin/tt-deploy`.

## Acceptance criteria

- `ttdeploy` works from any directory.
- It deploys the current named branch without switching or pulling.
- It refuses dirty worktrees and detached `HEAD`.
- It cannot accept anonymous or wrong-slug publication as success.
- It verifies the live apex and `www` behavior after publication.
- Offline tests pass.
- Shell files pass `zsh -n`.
- README and shell profile wiring are accurate.

# Tiny Trauma Content CLI — Design

**Date:** 2026-05-19
**Branch:** `feat/tt-content-cli`
**Status:** Proposed

## Goal

Wrap the existing Tiny Trauma content skills as standalone shell binaries so
Amit can kick off a content session from any terminal without first opening
an interactive agent. Each binary chooses the LLM engine (Claude, Codex,
Gemini, Devin) per-invocation, so usage limits on one engine don't block
work.

The CLI is local-only dev tooling. It is not deployed to production and
does not touch the Next.js app.

## Non-goals

- No production deployment of these scripts.
- No `package.json` integration — user wires aliases from dotfiles.
- No abstraction over the skill flows themselves; skills remain canonical.
- No per-engine prompt forking. One prompt, all engines.

## Skills covered

| Skill                  | Binary           | Mode handling                                  |
|------------------------|------------------|------------------------------------------------|
| `tiny-trauma-content`  | `tt-essay`       | `mode=essay`                                   |
| `tiny-trauma-content`  | `tt-short`       | `mode=short`                                   |
| `tiny-trauma-content`  | `tt-brainstorm`  | `mode=brainstorm`                              |
| `tiny-trauma-content`  | `tt-cross-post`  | `mode=cross-post`, positional `<slug>` target  |
| `tt-currently`         | `tt-currently`   | `--reading`, `--writing`, `--noticing` flags   |
| `tt-instagram-ingest`  | `tt-ingest`      | positional `[ingest\|rebuild-registry\|dry-run]` (default `ingest`) |
| `grill-me`             | _(no binary)_    | mirrored to `.agent/skills/` for cross-agent discovery only |

## File layout

```
tiny-trauma-v2/
├── bin/
│   ├── _tt-engine.zsh       # shared helper, sourced by each binary
│   ├── tt-essay
│   ├── tt-short
│   ├── tt-brainstorm
│   ├── tt-cross-post
│   ├── tt-currently
│   ├── tt-ingest
│   └── tt-aliases.zsh       # one big sourceable file: exports PATH + short aliases
├── .agent/
│   └── skills/              # symlink farm into .claude/skills/
│       ├── tiny-trauma-content  -> ../../.claude/skills/tiny-trauma-content
│       ├── tt-currently         -> ../../.claude/skills/tt-currently
│       ├── tt-instagram-ingest  -> ../../.claude/skills/tt-instagram-ingest
│       └── grill-me             -> ../../.claude/skills/grill-me
└── AGENTS.md                # appended: point non-Claude agents at .agent/skills/
```

### `bin/tt-aliases.zsh`

One sourceable zsh file. When sourced it:

1. Resolves its own directory (`${0:A:h}`) so it works regardless of cwd.
2. Prepends `bin/` to `PATH` (idempotent — only if not already present).
3. Defines short aliases for daily use:

   ```
   alias tt.essay='tt-essay'
   alias tt.short='tt-short'
   alias tt.brain='tt-brainstorm'
   alias tt.xpost='tt-cross-post'
   alias tt.now='tt-currently'
   alias tt.ingest='tt-ingest'
   ```

   Long names (`tt-essay`, …) also stay callable directly via PATH.

User's `/Users/amittiwari/Profiles/.bash_aliases` gets a single block
appended:

```bash
# =============================================================================
# TINY TRAUMA — content CLI (sourced from repo)
# =============================================================================
if [ -f "$HOME/Projects/AmitTiwari/tiny-trauma-v2/bin/tt-aliases.zsh" ]; then
  source "$HOME/Projects/AmitTiwari/tiny-trauma-v2/bin/tt-aliases.zsh"
fi
```

This is the only edit outside the repo.

All binaries are `#!/usr/bin/env zsh`, executable (`chmod +x`), and
verified with `zsh -n`.

## Common interface

Every binary supports:

| Flag / arg          | Behavior                                                              |
|---------------------|-----------------------------------------------------------------------|
| `--engine <name>`   | One of `claude`, `codex`, `gemini`, `devin`. Default `${TT_ENGINE:-claude}`. |
| `--dry-run`         | Print resolved prompt + engine command, exit without executing.        |
| `--help` / `-h`     | Usage + examples.                                                      |
| stdin (when piped)  | Appended verbatim to the prompt under an `Extra context:` header.      |

Skill-specific flags/positionals are documented per binary (see below).

### Engine dispatch (`bin/_tt-engine.zsh`)

Sourced helper. Provides:

- `tt_parse_common_flags "$@"` — strips `--engine`, `--dry-run`, `--help`
  out of `$@`, sets globals `TT_ENGINE_RESOLVED`, `TT_DRY_RUN`. Leaves the
  remaining positional args in a `TT_REST` array for the calling binary.
- `tt_read_stdin_if_piped` — echoes piped stdin if `[ ! -t 0 ]`, empty otherwise.
- `tt_run_engine "<prompt>"` — dispatches to the chosen CLI:

  | Engine  | Command shape                                  |
  |---------|------------------------------------------------|
  | claude  | `claude "$prompt"`                             |
  | codex   | `codex exec "$prompt"`                         |
  | gemini  | `gemini -p "$prompt"`                          |
  | devin   | `devin "$prompt"` *(placeholder — confirm exact subcommand during impl; if unknown, print a TODO error pointing the user at the Devin CLI docs)* |

  When `TT_DRY_RUN=1`, prints the resolved command and prompt to stdout
  and exits 0 without invoking the engine.

  When the requested engine binary is not found on PATH, exits non-zero
  with a clear message naming the engine and the missing binary.

### Prompt template

Each binary builds a prompt of the form:

```
Run the .agent/skills/<skill-name> skill with <args inline>.

<piped stdin, if any, prefixed with "Extra context:\n">
```

The engine reads its own skills directory per the AGENTS.md / `.agent/skills/`
convention and executes the skill flow.

## Per-binary specifics

### `tt-essay`, `tt-short`, `tt-brainstorm`

- No positional args.
- Prompt: `Run the .agent/skills/tiny-trauma-content skill with mode=<essay|short|brainstorm>.`

### `tt-cross-post <slug>`

- One required positional: the post slug (e.g. `musings/why-i-cry-at-ads`).
- Errors if missing.
- Prompt: `Run the .agent/skills/tiny-trauma-content skill with mode=cross-post and target=<slug>.`

### `tt-currently`

- Flags: `--reading <text>`, `--writing <text>`, `--noticing <text>`. All optional.
- At least one must be provided, otherwise prints `--help` and exits 2.
- Empty string is a valid value (clears the row, per skill semantics).
- Prompt: `Run the .agent/skills/tt-currently skill. Set reading=<...>, writing=<...>, noticing=<...> (omit any unset).`

### `tt-ingest [mode]`

- Positional mode: `ingest` (default), `rebuild-registry`, `dry-run`.
- Validates against the allowed set; rejects anything else.
- Prompt: `Run the .agent/skills/tt-instagram-ingest skill with mode=<mode>.`

## AGENTS.md addition

Append (do not replace) this section so non-Claude agents discover skills:

```markdown
# Skills

This repo follows the `.agent/skills/` convention. Each directory under
`.agent/skills/` is a skill — load `SKILL.md` to see how to run it. The
skills are symlinks into `.claude/skills/`, which is the canonical source.
```

## Error handling

- Unknown `--engine` value → exit 2 with the list of valid engines.
- Missing engine binary on PATH → exit 127 with the engine name + install hint.
- Missing required positional → exit 2 with usage block.
- `--dry-run` → exit 0 after printing.
- Engine command failure → propagate the engine's exit code unchanged.

## Testing

Manual smoke tests on the branch:

1. `zsh -n bin/_tt-engine.zsh && zsh -n bin/tt-*` — syntax-check all scripts.
2. `bin/tt-essay --dry-run` — confirm Claude prompt + command print.
3. `bin/tt-essay --engine codex --dry-run` — confirm Codex routing.
4. `bin/tt-essay --engine gemini --dry-run` — confirm Gemini routing.
5. `bin/tt-cross-post --dry-run` — confirm missing-slug error.
6. `bin/tt-currently --dry-run` — confirm at-least-one-flag error.
7. `bin/tt-currently --reading '*Bleak House*' --dry-run` — confirm prompt assembly.
8. `bin/tt-ingest dry-run --engine claude --dry-run` — confirm mode validation passes.
9. `bin/tt-ingest bogus --dry-run` — confirm mode validation fails.
10. `echo "seed paragraph" | bin/tt-essay --dry-run` — confirm stdin appends.
11. `ls -l .agent/skills/` — confirm all four symlinks resolve.
12. `cat .agent/skills/tiny-trauma-content/SKILL.md | head` — confirm symlink reads.

A single live run per engine (essay flow) is the acceptance test; not
scripted, run by Amit after merge.

## PR plan

- Branch: `feat/tt-content-cli`
- Commits, in order:
  1. `chore(skills): mirror .claude/skills into .agent/skills via symlinks`
  2. `chore(agents): document .agent/skills/ convention in AGENTS.md`
  3. `feat(bin): add tt-* content CLI binaries with multi-engine dispatch`
  4. `docs: README section for the tt-* CLI`
- Push branch, open PR against `main` with summary + smoke-test checklist.

## Open questions

- Confirm exact Devin CLI subcommand for non-interactive prompt execution.
  If unclear at implementation time, ship the script with a guarded error
  for `--engine devin` and a TODO comment, rather than guessing.

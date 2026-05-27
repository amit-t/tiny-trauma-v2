#!/usr/bin/env zsh
# bin/tt-aliases.zsh — source this file to put the Tiny Trauma content CLI
# binaries on PATH and define short aliases for daily use.
#
# Sourced from /Users/amittiwari/Profiles/.bash_aliases (see that file for
# the source line).
#
# Resilient to cwd — uses ${(%):-%x} (the path of the file being sourced).

# Resolve this file's directory regardless of cwd.
typeset -g TT_BIN_DIR="${${(%):-%x}:A:h}"
typeset -g TT_REPO_DIR="${TT_BIN_DIR:h}"

# Prepend bin/ to PATH (idempotent).
if [[ ":$PATH:" != *":${TT_BIN_DIR}:"* ]]; then
  export PATH="${TT_BIN_DIR}:${PATH}"
fi

# -----------------------------------------------------------------------------
# Long-form binaries (now on PATH; listed for discoverability):
#   tt-essay        — Tiny Trauma essay flow
#   tt-short        — Tiny Trauma short fiction flow
#   tt-brainstorm   — brainstorm only, no MDX
#   tt-cross-post   — generate Twitter / LinkedIn / Instagram drafts
#   tt-currently    — update homepage "currently" footer rows
#   tt-ingest       — refresh Instagram inspirations catalog
#
# Each accepts: --engine claude|codex|gemini|devin (default: claude),
#               --dry-run, --help, and piped stdin as extra context.
# -----------------------------------------------------------------------------

# Short aliases (dot-separated namespace, matches existing `tt.sync` style).
alias tt.essay='tt-essay'
alias tt.short='tt-short'
alias tt.brain='tt-brainstorm'
alias tt.xpost='tt-cross-post'
alias tt.now='tt-currently'
alias tt.ingest='tt-ingest'

# Engine-pinned shortcuts — handy when you've decided to use a specific
# engine for the whole session and don't want to retype --engine.
alias tt.essay.codex='tt-essay --engine codex'
alias tt.essay.gemini='tt-essay --engine gemini'
alias tt.essay.devin='tt-essay --engine devin'
alias tt.short.codex='tt-short --engine codex'
alias tt.short.gemini='tt-short --engine gemini'
alias tt.short.devin='tt-short --engine devin'

# tt-visuals (visual asset generator)
alias tt.vis='tt-visuals'
alias tt.vis.dry='tt-visuals --dry-run'
alias tt.vis.gemini='tt-visuals --engine gemini'
alias tt.vis.codex='tt-visuals --engine codex'

#!/usr/bin/env zsh
# bin/lib/tt-visuals/rewrite-mdx.zsh — thin wrapper over rewrite-mdx.mts.

[[ -n "${_TT_REWRITE_SOURCED:-}" ]] && return 0
typeset -g _TT_REWRITE_SOURCED=1

# Usage: tt_rewrite_mdx <mdx-path> <installed-json-path> <repo-root>
tt_rewrite_mdx() {
  local mdx="$1" installed="$2" repo="$3"
  (
    cd "$repo"
    pnpm exec tsx bin/lib/tt-visuals/rewrite-mdx.mts "$mdx" "$installed"
  )
}

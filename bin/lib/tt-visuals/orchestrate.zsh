#!/usr/bin/env zsh
# bin/lib/tt-visuals/orchestrate.zsh — wire render → pick → install per slot,
# including the retry-edit branch. Extracted from bin/tt-visuals so the top-
# level binary stays under 280 lines.
#
# Depends on (caller must have sourced):
#   - lib/tt-visuals/render.zsh         (tt_render_slots / tt_render_slots_multi
#                                        / tt_render_one_slot)
#   - lib/tt-visuals/pick-ui.zsh        (tt_pick_for_slot, tt_edit_prompt_for_slot)
#   - lib/tt-visuals/install-winner.zsh (tt_install_winner)
#   - lib/tt-visuals/parallel.zsh       (tt_render_slots_multi uses tt_parallel_run)

[[ -n "${_TT_ORCHESTRATE_SOURCED:-}" ]] && return 0
typeset -g _TT_ORCHESTRATE_SOURCED=1

# Usage:
#   tt_render_pick_install <live_engines_str> <prompts_json> <cand_root> \
#                          <asset_dir> <force> <picks_out_file>
#
# - live_engines_str: space-joined live engine names (e.g. "gemini codex").
# - prompts_json:     absolute path to the .prompts.json the renderer reads.
# - cand_root:        tmp directory where per-slot candidate dirs are created.
# - asset_dir:        public/img/<type>/<slug> destination for tt_install_winner.
# - force:            "1" to overwrite existing assets, "0" to abort if present.
# - picks_out_file:   absolute path; written as JSON {<slot>: <engine>}.
#
# Return codes:
#   0 — success (picks_out_file written; may be empty `{}` if every slot was
#       skipped).
#   5 — render or install failed in a way that should abort the run.
#   6 — user chose `q` (quit, keep nothing).
tt_render_pick_install() {
  local engines_str="$1" prompts_json="$2" cand_root="$3"
  local asset_dir="$4" force="$5" picks_out="$6"

  local -a live_engines
  live_engines=(${=engines_str})

  # ---- render across engines ----------------------------------------------
  # zsh arrays are 1-indexed; live_engines[1] is the first live engine.
  if (( ${#live_engines[@]} > 1 )); then
    tt_render_slots_multi "${live_engines[*]}" "$prompts_json" "$cand_root" \
      || print -ru2 -- "tt-visuals: at least one engine failed (continuing)"
  else
    tt_render_slots "${live_engines[1]}" "$prompts_json" "$cand_root" \
      || { print -ru2 -- "error: render failed"; return 5; }
  fi

  # ---- pick per slot ------------------------------------------------------
  typeset -A picks
  local slot_dir slot_name pick e
  # nullglob via `(N)`: re-running on a fully-installed post can yield an
  # empty slot list (every marker has already been rewritten), which leaves
  # cand_root empty. The `(N)` glob qualifier makes that case expand to
  # nothing instead of erroring with `no matches found`.
  for slot_dir in "$cand_root"/*(N/); do
    slot_name="${slot_dir:t}"
    case "$slot_name" in
      hero) ;;          # ok
      inline-*) ;;      # ok
      *) continue ;;
    esac
    pick=$(tt_pick_for_slot "$slot_name" "$slot_dir")
    case "$pick" in
      __quit__) print -ru2 -- "tt-visuals: user quit"; return 6 ;;
      __skip__) ;;
      __retry__)
        # Re-edit the prompt for this slot in $EDITOR, then re-render ONLY
        # this slot across the same engines. (Previously this re-rendered
        # every slot × every engine, burning N*M API calls for one retry.)
        # Single retry only — if the user picks `r` again on the follow-up
        # pick, treat it as skip to avoid loops.
        tt_edit_prompt_for_slot "$prompts_json" "$slot_name"
        rm -rf "$slot_dir"; mkdir -p "$slot_dir"
        typeset -i any_ok=0
        for e in "${live_engines[@]}"; do
          if tt_render_one_slot "$e" "$prompts_json" "$cand_root" "$slot_name"; then
            any_ok=1
          fi
        done
        if (( ! any_ok )); then
          print -ru2 -- "tt-visuals: every engine failed on retry of $slot_name — skipping slot"
          continue
        fi
        pick=$(tt_pick_for_slot "$slot_name" "$slot_dir")
        case "$pick" in
          __quit__) print -ru2 -- "tt-visuals: user quit"; return 6 ;;
          __skip__|__retry__) ;;
          *)
            picks[$slot_name]="$pick"
            tt_install_winner "$slot_name" "$pick" "$slot_dir" "$asset_dir" "$force" \
              || return 5
            ;;
        esac
        ;;
      *)
        picks[$slot_name]="$pick"
        tt_install_winner "$slot_name" "$pick" "$slot_dir" "$asset_dir" "$force" \
          || return 5
        ;;
    esac
  done

  # ---- emit picks as JSON object -----------------------------------------
  {
    print -n -- "{"
    typeset -i first=1
    local k
    for k in "${(@k)picks}"; do
      if (( first )); then first=0; else print -n -- ","; fi
      print -n -- "\"${k}\":\"${picks[$k]}\""
    done
    print -n -- "}"
  } > "$picks_out"

  return 0
}

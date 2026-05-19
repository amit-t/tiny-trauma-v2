#!/usr/bin/env zsh
# bin/_tt-engine.zsh — shared helper for Tiny Trauma content CLI binaries.
#
# Sourced (not executed) by each bin/tt-* script. Provides:
#   tt_parse_common_flags  — strips --engine / --dry-run / --help; leaves TT_REST
#   tt_read_stdin_if_piped — echoes stdin when non-tty
#   tt_run_engine "$prompt" — dispatches to the chosen engine CLI
#
# All non-zero exits use these conventions:
#   2   — usage error (bad flag, missing arg)
#   127 — engine CLI not found on PATH

# ---- guard against double-sourcing ------------------------------------------
[[ -n "${_TT_ENGINE_SOURCED:-}" ]] && return 0
typeset -g _TT_ENGINE_SOURCED=1

# ---- valid engines ----------------------------------------------------------
typeset -ga TT_VALID_ENGINES
TT_VALID_ENGINES=(claude codex gemini devin)

# ---- common flag parsing ----------------------------------------------------
# Usage: tt_parse_common_flags "$@"
# Sets globals:
#   TT_ENGINE_RESOLVED  — one of claude|codex|gemini|devin
#   TT_DRY_RUN          — 1 or 0
#   TT_REST             — array of remaining args
#   TT_HELP_REQUESTED   — 1 or 0
tt_parse_common_flags() {
  typeset -g TT_ENGINE_RESOLVED="${TT_ENGINE:-claude}"
  typeset -g TT_DRY_RUN=0
  typeset -g TT_HELP_REQUESTED=0
  typeset -ga TT_REST
  TT_REST=()

  while (( $# > 0 )); do
    case "$1" in
      --engine)
        if (( $# < 2 )); then
          print -ru2 -- "error: --engine requires a value (one of: ${TT_VALID_ENGINES[*]})"
          return 2
        fi
        TT_ENGINE_RESOLVED="$2"
        shift 2
        ;;
      --engine=*)
        TT_ENGINE_RESOLVED="${1#--engine=}"
        shift
        ;;
      --dry-run)
        TT_DRY_RUN=1
        shift
        ;;
      -h|--help)
        TT_HELP_REQUESTED=1
        shift
        ;;
      --)
        shift
        TT_REST+=("$@")
        break
        ;;
      *)
        TT_REST+=("$1")
        shift
        ;;
    esac
  done

  # validate engine
  if [[ ${TT_VALID_ENGINES[(Ie)$TT_ENGINE_RESOLVED]} -eq 0 ]]; then
    print -ru2 -- "error: unknown --engine '$TT_ENGINE_RESOLVED' (valid: ${TT_VALID_ENGINES[*]})"
    return 2
  fi

  return 0
}

# ---- stdin passthrough ------------------------------------------------------
tt_read_stdin_if_piped() {
  if [[ ! -t 0 ]]; then
    cat
  fi
}

# ---- engine dispatch --------------------------------------------------------
# Usage: tt_run_engine "$prompt"
# Honors TT_DRY_RUN — prints command + prompt and exits 0 without invoking.
tt_run_engine() {
  local prompt="$1"
  local engine="$TT_ENGINE_RESOLVED"
  local -a cmd

  case "$engine" in
    claude)
      cmd=(claude "$prompt")
      ;;
    codex)
      cmd=(codex exec "$prompt")
      ;;
    gemini)
      cmd=(gemini -p "$prompt")
      ;;
    devin)
      # Devin CLI's non-interactive prompt subcommand has not been pinned in
      # this repo yet — guard until the exact incantation is confirmed.
      print -ru2 -- "error: --engine devin is not yet wired."
      print -ru2 -- "       Confirm the Devin CLI's non-interactive prompt subcommand,"
      print -ru2 -- "       then update tt_run_engine in bin/_tt-engine.zsh."
      return 64
      ;;
    *)
      print -ru2 -- "error: unhandled engine '$engine' (internal bug)"
      return 70
      ;;
  esac

  if (( TT_DRY_RUN )); then
    print -r -- "# engine: $engine"
    print -r -- "# command: ${(j: :)${(@q)cmd[1,-2]}} <prompt>"
    print -r -- "# ---- prompt ----"
    print -r -- "$prompt"
    return 0
  fi

  if ! (( $+commands[${cmd[1]}] )); then
    print -ru2 -- "error: '${cmd[1]}' not found on PATH (required for --engine $engine)"
    return 127
  fi

  "${cmd[@]}"
}

# ---- prompt assembly helper -------------------------------------------------
# Usage: tt_build_prompt "<core invocation line>"
# Appends piped stdin as an Extra context: block when present.
tt_build_prompt() {
  local core="$1"
  local extra
  extra="$(tt_read_stdin_if_piped)"
  if [[ -n "$extra" ]]; then
    print -r -- "${core}

Extra context:
${extra}"
  else
    print -r -- "$core"
  fi
}

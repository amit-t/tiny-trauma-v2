#!/usr/bin/env zsh
# bin/lib/tt-visuals/parallel.zsh — small fan-out helper with concurrency cap.
# Sourced, not executed.

[[ -n "${_TT_PARALLEL_SOURCED:-}" ]] && return 0
typeset -g _TT_PARALLEL_SOURCED=1

# Usage: tt_parallel_run <max> <cmd1> <cmd2> ...
#
# Each cmd is a string passed to `eval`. Returns 0 if all rc=0; otherwise
# returns the rc of the first failing job seen (in completion order at the
# wait boundary).
#
# CAVEMAN TRAP: never `local path`, `local status`, `local fpath`,
# `local manpath`, `local cdpath`, `local module_path` — those clobber the
# parameters of the same name in zsh.
tt_parallel_run() {
  local max="$1"; shift
  local -a pids
  local -i first_fail=0 running=0 rc
  local cmd p
  for cmd in "$@"; do
    if (( running >= max )); then
      # Wait on the oldest in-flight job. zsh's `shift array` extension
      # removes the first element from the named array.
      wait "${pids[1]}"; rc=$?
      shift pids
      (( running-- ))
      (( rc != 0 && first_fail == 0 )) && first_fail=$rc
    fi
    eval "$cmd" &
    pids+=($!)
    (( running++ ))
  done
  for p in "${pids[@]}"; do
    wait "$p"; rc=$?
    (( rc != 0 && first_fail == 0 )) && first_fail=$rc
  done
  return $first_fail
}

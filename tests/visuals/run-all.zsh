#!/usr/bin/env zsh
# tests/visuals/run-all.zsh — discover and run every test-*.zsh in this dir.

set -u
script_path=${0:A}
cd "${script_path:h}"

setopt local_options nullglob

typeset -gi TOTAL_PASS=0 TOTAL_FAIL=0

for f in test-*.zsh; do
  [[ -f "$f" ]] || continue
  print -ru2 -- ""
  print -ru2 -- "▶ $f"
  (
    source ./_assert.zsh
    source ./"$f"
    tt_test_summary
  )
  rc=$?
  (( rc == 0 )) || (( TOTAL_FAIL++ ))
done

if (( TOTAL_FAIL > 0 )); then
  print -ru2 -- ""
  print -ru2 -- "$TOTAL_FAIL file(s) failed"
  exit 1
fi
print -ru2 -- ""
print -ru2 -- "All test files passed"

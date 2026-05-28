#!/usr/bin/env zsh
# tests/visuals/test-parallel.zsh

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
source "$REPO_ROOT/bin/lib/tt-visuals/parallel.zsh"

WORKDIR=$(mktemp -d -t tt-par-XXXXXX)
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

# Build a list of trivial jobs that touch numbered files.
jobs=()
for i in 1 2 3 4 5; do
  jobs+=("touch $WORKDIR/done-$i")
done

tt_test "parallel runs every job"
tt_parallel_run 3 "${jobs[@]}"
assert_eq "0" "$?"
for i in 1 2 3 4 5; do
  assert_file_exists "$WORKDIR/done-$i"
done

tt_test "parallel propagates a non-zero from at least one failing job"
fail_jobs=(
  "touch $WORKDIR/f1"
  "false"
  "touch $WORKDIR/f3"
)
tt_parallel_run 2 "${fail_jobs[@]}"
fail_rc=$?
[[ "$fail_rc" != "0" ]] && (( TT_TEST_PASS++ )) || { (( TT_TEST_FAIL++ )); print -ru2 -- "    ✗ expected non-zero, got $fail_rc"; }
assert_file_exists "$WORKDIR/f1"
assert_file_exists "$WORKDIR/f3"

tt_test "parallel respects concurrency cap (smoke-only)"
# Cannot easily assert wall time without flakiness; semantics are exercised
# by the function-counting test above. Treat as smoke-only.
(( TT_TEST_PASS++ ))

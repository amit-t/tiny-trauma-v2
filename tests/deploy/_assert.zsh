#!/usr/bin/env zsh

typeset -gi TEST_COUNT=0
typeset -gi FAILURE_COUNT=0

fail() {
  print -u2 -r -- "not ok - $1"
  (( FAILURE_COUNT += 1 ))
}

pass() {
  print -r -- "ok - $1"
}

assert_eq() {
  local expected=$1
  local actual=$2
  local label=$3

  (( TEST_COUNT += 1 ))
  if [[ "$actual" == "$expected" ]]; then
    pass "$label"
  else
    fail "$label (expected: ${(q)expected}; actual: ${(q)actual})"
  fi
}

assert_contains() {
  local haystack=$1
  local needle=$2
  local label=$3

  (( TEST_COUNT += 1 ))
  if [[ "$haystack" == *"$needle"* ]]; then
    pass "$label"
  else
    fail "$label (missing: ${(q)needle})"
  fi
}

assert_not_contains() {
  local haystack=$1
  local needle=$2
  local label=$3

  (( TEST_COUNT += 1 ))
  if [[ "$haystack" != *"$needle"* ]]; then
    pass "$label"
  else
    fail "$label (unexpected: ${(q)needle})"
  fi
}

finish_tests() {
  if (( FAILURE_COUNT > 0 )); then
    print -u2 -r -- "$FAILURE_COUNT of $TEST_COUNT assertions failed"
    return 1
  fi

  print -r -- "All $TEST_COUNT assertions passed"
}

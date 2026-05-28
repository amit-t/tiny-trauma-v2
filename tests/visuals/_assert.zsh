#!/usr/bin/env zsh
# tests/visuals/_assert.zsh — sourced by every test file.

typeset -gi TT_TEST_PASS=0 TT_TEST_FAIL=0
typeset -g  TT_TEST_CURRENT=""

tt_test() {
  TT_TEST_CURRENT="$1"
  print -ru2 -- "  · $1"
}

assert_eq() {
  local expected="$1" actual="$2" msg="${3:-}"
  if [[ "$expected" == "$actual" ]]; then
    (( TT_TEST_PASS++ ))
  else
    (( TT_TEST_FAIL++ ))
    print -ru2 -- "    ✗ $TT_TEST_CURRENT ${msg:+($msg) }"
    print -ru2 -- "      expected: ${(qqq)expected}"
    print -ru2 -- "      actual:   ${(qqq)actual}"
  fi
}

assert_contains() {
  local haystack="$1" needle="$2" msg="${3:-}"
  if [[ "$haystack" == *"$needle"* ]]; then
    (( TT_TEST_PASS++ ))
  else
    (( TT_TEST_FAIL++ ))
    print -ru2 -- "    ✗ $TT_TEST_CURRENT ${msg:+($msg) }"
    print -ru2 -- "      haystack: ${(qqq)haystack}"
    print -ru2 -- "      needle:   ${(qqq)needle}"
  fi
}

assert_not_contains() {
  local haystack="$1" needle="$2" msg="${3:-}"
  if [[ "$haystack" != *"$needle"* ]]; then
    (( TT_TEST_PASS++ ))
  else
    (( TT_TEST_FAIL++ ))
    print -ru2 -- "    ✗ $TT_TEST_CURRENT ${msg:+($msg) }"
    print -ru2 -- "      haystack: ${(qqq)haystack}"
    print -ru2 -- "      unexpected needle: ${(qqq)needle}"
  fi
}

assert_file_exists() {
  local path="$1" msg="${2:-}"
  if [[ -f "$path" ]]; then
    (( TT_TEST_PASS++ ))
  else
    (( TT_TEST_FAIL++ ))
    print -ru2 -- "    ✗ $TT_TEST_CURRENT ${msg:+($msg) }: $path does not exist"
  fi
}

tt_test_summary() {
  print -ru2 -- ""
  if (( TT_TEST_FAIL > 0 )); then
    print -ru2 -- "FAIL: $TT_TEST_FAIL failed, $TT_TEST_PASS passed"
    return 1
  fi
  print -ru2 -- "PASS: $TT_TEST_PASS passed"
  return 0
}

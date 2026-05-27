#!/usr/bin/env zsh
# tests/visuals/fixtures/stub-qlmanage.zsh — fake qlmanage. Touches a marker
# file so tests can assert it was invoked, then exits 0.
set -u
print -r -- "$@" > "${TT_TEST_QLMANAGE_MARKER:-/tmp/tt-test-qlmanage.txt}"
exit 0

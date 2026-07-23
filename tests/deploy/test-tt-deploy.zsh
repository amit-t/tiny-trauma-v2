#!/usr/bin/env zsh

set -u

script_path=${0:A}
test_dir=${script_path:h}
repo_dir=${test_dir:h:h}
source "$test_dir/_assert.zsh"

typeset fixture_root=''
typeset RUN_OUTPUT=''
typeset -gi RUN_CODE=0

cleanup() {
  [[ -z "$fixture_root" ]] || rm -rf -- "$fixture_root"
}
trap cleanup EXIT

write_stub() {
  local name=$1
  local content=$2
  print -r -- "$content" > "$fixture_root/stubs/$name"
  chmod +x "$fixture_root/stubs/$name"
}

setup_fixture() {
  cleanup
  fixture_root=$(mktemp -d)
  mkdir -p "$fixture_root/repo/bin" "$fixture_root/stubs" "$fixture_root/home"
  cp "$repo_dir/bin/tt-deploy" "$fixture_root/repo/bin/tt-deploy"
  chmod +x "$fixture_root/repo/bin/tt-deploy"
  : > "$fixture_root/calls.log"

  write_stub git '#!/usr/bin/env zsh
print -r -- "git $*" >> "$FAKE_CALLS"
if [[ "$1" == -C ]]; then
  shift 2
fi
case "$*" in
  "rev-parse --show-toplevel")
    print -r -- "$FAKE_REPO"
    ;;
  "symbolic-ref --quiet --short HEAD")
    [[ "${FAKE_DETACHED:-0}" == 1 ]] && exit 1
    print -r -- "feature/current"
    ;;
  "rev-parse HEAD")
    print -r -- "0123456789abcdef"
    ;;
  "status --porcelain --untracked-files=normal")
    [[ -z "${FAKE_DIRTY:-}" ]] || print -r -- "$FAKE_DIRTY"
    ;;
  *)
    print -u2 -r -- "unexpected git call: $*"
    exit 70
    ;;
esac'

  write_stub pnpm '#!/usr/bin/env zsh
print -r -- "pnpm $*" >> "$FAKE_CALLS"
if [[ "$1" == install ]]; then
  [[ "${FAKE_INSTALL_FAIL:-0}" == 1 ]] && exit 41
  exit 0
fi
if [[ "$1" == build ]]; then
  [[ "${FAKE_BUILD_FAIL:-0}" == 1 ]] && exit 42
  rm -rf out
  mkdir -p out
  if [[ "${FAKE_EMPTY_EXPORT:-0}" != 1 ]]; then
    print -r -- "<html>same deployment</html>" > out/index.html
    print -r -- "<html>not found</html>" > out/404.html
  fi
  if [[ "${FAKE_SECRET_EXPORT:-0}" == 1 ]]; then
    print -r -- "postgresql://user:password@example.com/database" > out/leak.txt
  fi
  exit 0
fi
print -u2 -r -- "unexpected pnpm call: $*"
exit 70'

  write_stub curl '#!/usr/bin/env zsh
print -r -- "curl $*" >> "$FAKE_CALLS"
typeset output_file=""
typeset write_format=""
typeset url=""
while (( $# > 0 )); do
  case "$1" in
    -o)
      output_file=$2
      shift 2
      ;;
    -w)
      write_format=$2
      shift 2
      ;;
    --retry|--retry-delay)
      shift 2
      ;;
    -fsS|-sS|--retry-all-errors)
      shift
      ;;
    http*)
      url=$1
      shift
      ;;
    *)
      print -u2 -r -- "unexpected curl argument: $1"
      exit 70
      ;;
  esac
done
if [[ -n "$write_format" ]]; then
  case "$url" in
    "https://tinytrauma.com/")
      print -n -r -- "${FAKE_APEX_CODE:-200}"
      ;;
    "https://tinytrauma.com/404.html")
      print -n -r -- "${FAKE_404_CODE:-200}"
      ;;
    "https://www.tinytrauma.com/")
      print -n -r -- "${FAKE_WWW_RESULT:-301 https://tinytrauma.com/}"
      ;;
    *)
      print -u2 -r -- "unexpected status URL: $url"
      exit 70
      ;;
  esac
  exit 0
fi
[[ -n "$output_file" ]] || {
  print -u2 -r -- "curl download missing -o"
  exit 70
}
if [[ "$url" == "https://tinytrauma.com/" && "${FAKE_APEX_MISMATCH:-0}" == 1 ]]; then
  print -r -- "<html>old deployment</html>" > "$output_file"
else
  print -r -- "<html>same deployment</html>" > "$output_file"
fi'

  write_stub publisher '#!/usr/bin/env zsh
print -r -- "publisher $*" >> "$FAKE_CALLS"
[[ "${FAKE_PUBLISH_FAIL:-0}" == 1 ]] && exit 43
print -r -- "publish_result.auth_mode=${FAKE_AUTH_MODE:-authenticated}"
print -r -- "publish_result.site_url=${FAKE_SITE_URL:-https://whole-geyser-5pbf.here.now/}"'
}

reset_switches() {
  unset FAKE_DIRTY FAKE_DETACHED FAKE_INSTALL_FAIL FAKE_BUILD_FAIL
  unset FAKE_EMPTY_EXPORT FAKE_SECRET_EXPORT FAKE_PUBLISH_FAIL
  unset FAKE_AUTH_MODE FAKE_SITE_URL FAKE_APEX_MISMATCH
  unset FAKE_APEX_CODE FAKE_404_CODE FAKE_WWW_RESULT
}

run_deploy() {
  RUN_OUTPUT=$(
    (
      export PATH="$fixture_root/stubs:/usr/bin:/bin"
      export HOME="$fixture_root/home"
      export FAKE_REPO="$fixture_root/repo"
      export FAKE_CALLS="$fixture_root/calls.log"
      export TT_HERENOW_PUBLISHER="$fixture_root/stubs/publisher"
      export HERENOW_API_KEY='test-only-key'
      cd /
      "$fixture_root/repo/bin/tt-deploy" "$@"
    ) 2>&1
  )
  RUN_CODE=$?
}

call_log() {
  cat "$fixture_root/calls.log"
}

run_test() {
  local label=$1
  shift
  print -r -- "# $label"
  setup_fixture
  reset_switches
  "$@"
}

test_help() {
  run_deploy --help
  assert_eq 0 "$RUN_CODE" "help exits zero"
  assert_contains "$RUN_OUTPUT" "Usage: tt-deploy" "help shows usage"
  assert_eq '' "$(call_log)" "help invokes no dependencies"
}

test_dirty_worktree() {
  export FAKE_DIRTY='?? untracked.txt'
  run_deploy
  assert_eq 1 "$RUN_CODE" "dirty worktree fails"
  assert_contains "$RUN_OUTPUT" "worktree is dirty" "dirty error is clear"
  assert_not_contains "$(call_log)" "pnpm " "dirty refusal happens before build"
  assert_not_contains "$(call_log)" "publisher " "dirty refusal happens before publish"
}

test_detached_head() {
  export FAKE_DETACHED=1
  run_deploy
  assert_eq 1 "$RUN_CODE" "detached HEAD fails"
  assert_contains "$RUN_OUTPUT" "detached HEAD" "detached error is clear"
  assert_not_contains "$(call_log)" "pnpm " "detached refusal happens before build"
}

test_install_failure() {
  export FAKE_INSTALL_FAIL=1
  run_deploy
  assert_eq 1 "$RUN_CODE" "install failure propagates"
  assert_not_contains "$(call_log)" "pnpm build" "build does not run after install failure"
  assert_not_contains "$(call_log)" "publisher " "publish does not run after install failure"
}

test_build_failure() {
  export FAKE_BUILD_FAIL=1
  run_deploy
  assert_eq 1 "$RUN_CODE" "build failure propagates"
  assert_not_contains "$(call_log)" "publisher " "publish does not run after build failure"
}

test_empty_export() {
  export FAKE_EMPTY_EXPORT=1
  run_deploy
  assert_eq 1 "$RUN_CODE" "empty export fails"
  assert_contains "$RUN_OUTPUT" "out/index.html" "empty export error names required file"
  assert_not_contains "$(call_log)" "publisher " "empty export fails before publish"
}

test_secret_export() {
  export FAKE_SECRET_EXPORT=1
  run_deploy
  assert_eq 1 "$RUN_CODE" "credential-shaped export fails"
  assert_contains "$RUN_OUTPUT" "credential or private key" "secret scan error is clear"
  assert_not_contains "$(call_log)" "publisher " "secret scan fails before publish"
}

test_anonymous_publish() {
  export FAKE_AUTH_MODE=anonymous
  run_deploy
  assert_eq 1 "$RUN_CODE" "anonymous publish result fails"
  assert_contains "$RUN_OUTPUT" "publish succeeded, but production verification failed" "post-publish failure is explicit"
  assert_contains "$RUN_OUTPUT" "authenticated mode" "anonymous error names required mode"
}

test_wrong_site_url() {
  export FAKE_SITE_URL='https://wrong-site.here.now/'
  run_deploy
  assert_eq 1 "$RUN_CODE" "wrong Site URL fails"
  assert_contains "$RUN_OUTPUT" "unexpected Site URL" "wrong Site error is clear"
}

test_homepage_mismatch() {
  export FAKE_APEX_MISMATCH=1
  run_deploy
  assert_eq 1 "$RUN_CODE" "homepage mismatch fails"
  assert_contains "$RUN_OUTPUT" "does not match" "mismatch error is clear"
}

test_wrong_www_redirect() {
  export FAKE_WWW_RESULT='302 https://tinytrauma.com/'
  run_deploy
  assert_eq 1 "$RUN_CODE" "wrong www redirect fails"
  assert_contains "$RUN_OUTPUT" "expected '301 https://tinytrauma.com/'" "www error shows expected redirect"
}

test_success() {
  run_deploy
  local calls=$(call_log)
  assert_eq 0 "$RUN_CODE" "authenticated deployment succeeds"
  assert_contains "$RUN_OUTPUT" "Branch: feature/current" "success reports current branch"
  assert_contains "$RUN_OUTPUT" "Commit: 0123456789abcdef" "success reports commit"
  assert_contains "$RUN_OUTPUT" "Site: https://whole-geyser-5pbf.here.now/" "success reports Site URL"
  assert_contains "$RUN_OUTPUT" "Production: https://tinytrauma.com/" "success reports production URL"
  assert_contains "$calls" "pnpm install --frozen-lockfile" "install uses frozen lockfile"
  assert_contains "$calls" "pnpm build" "build runs"
  assert_contains "$calls" "publisher out --slug whole-geyser-5pbf --client ttdeploy" "publisher receives exact Site arguments"
}

if [[ ! -f "$repo_dir/bin/tt-deploy" ]]; then
  (( TEST_COUNT += 1 ))
  fail "bin/tt-deploy exists"
  finish_tests
  exit $?
fi

run_test "help" test_help
run_test "dirty worktree" test_dirty_worktree
run_test "detached HEAD" test_detached_head
run_test "install failure" test_install_failure
run_test "build failure" test_build_failure
run_test "empty export" test_empty_export
run_test "secret scan" test_secret_export
run_test "anonymous publisher" test_anonymous_publish
run_test "wrong Site URL" test_wrong_site_url
run_test "homepage mismatch" test_homepage_mismatch
run_test "wrong www redirect" test_wrong_www_redirect
run_test "success" test_success

finish_tests

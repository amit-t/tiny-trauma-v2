# `ttdeploy` Manual Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one global `ttdeploy` command that safely builds and publishes the currently checked-out Tiny Trauma branch, then verifies the live here.now Site and production domain.

**Architecture:** Keep deployment logic in repository-owned `bin/tt-deploy`; expose it through existing `bin/tt-aliases.zsh` and Profiles source wiring. Implement command as fail-fast zsh pipeline with explicit pre-publish and post-publish checks. Test end-to-end offline by copying executable into temporary repository and replacing external commands with deterministic PATH stubs.

**Tech Stack:** zsh, Git, pnpm/Next.js static export, curl, here.now publisher, custom zsh test harness.

---

## Task 1: Build Offline Test Harness and Safety Contract

**Files:**
- Create: `tests/deploy/_assert.zsh`
- Create: `tests/deploy/test-tt-deploy.zsh`
- Test: `tests/deploy/test-tt-deploy.zsh`

- [ ] **Step 1: Create assertion helpers**

Add reusable zsh assertions that preserve exact command output:

```zsh
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
  local expected=$1 actual=$2 label=$3
  (( TEST_COUNT += 1 ))
  if [[ "$actual" == "$expected" ]]; then
    pass "$label"
  else
    fail "$label (expected: ${(q)expected}; actual: ${(q)actual})"
  fi
}

assert_contains() {
  local haystack=$1 needle=$2 label=$3
  (( TEST_COUNT += 1 ))
  if [[ "$haystack" == *"$needle"* ]]; then
    pass "$label"
  else
    fail "$label (missing: ${(q)needle})"
  fi
}

assert_not_contains() {
  local haystack=$1 needle=$2 label=$3
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
```

- [ ] **Step 2: Create isolated deployment fixture**

In `tests/deploy/test-tt-deploy.zsh`, create a temporary repository layout, copy
`bin/tt-deploy` into it, and generate stubs for `git`, `pnpm`, `curl`, and
publisher. Use fixture variables to select failure modes without network:

```zsh
#!/usr/bin/env zsh
set -u

script_path=${0:A}
test_dir=${script_path:h}
repo_dir=${test_dir:h:h}
source "$test_dir/_assert.zsh"

typeset fixture_root

setup_fixture() {
  fixture_root=$(mktemp -d)
  mkdir -p "$fixture_root/repo/bin" "$fixture_root/stubs" "$fixture_root/home"
  cp "$repo_dir/bin/tt-deploy" "$fixture_root/repo/bin/tt-deploy"
  chmod +x "$fixture_root/repo/bin/tt-deploy"
  : > "$fixture_root/calls.log"
}

teardown_fixture() {
  rm -rf -- "$fixture_root"
}

run_deploy() {
  (
    export PATH="$fixture_root/stubs:/usr/bin:/bin"
    export HOME="$fixture_root/home"
    export FAKE_REPO="$fixture_root/repo"
    export FAKE_CALLS="$fixture_root/calls.log"
    export TT_HERENOW_PUBLISHER="$fixture_root/stubs/publisher"
    export HERENOW_API_KEY=test-only-key
    cd /
    "$fixture_root/repo/bin/tt-deploy" "$@"
  ) 2>&1
}
```

Stubs must record invocations, return branch `feature/current`, SHA
`0123456789abcdef`, generate `out/index.html` plus `out/404.html`, emit
authenticated publisher metadata, and emulate the required production HTTP
responses. Environment switches must support dirty worktree, detached HEAD,
empty export, leaked secret, anonymous publish, wrong Site URL, content
mismatch, and wrong `www` redirect.

- [ ] **Step 3: Add first failing contract tests**

Add tests for help, dirty refusal, and detached refusal:

```zsh
output=$(run_deploy --help)
assert_contains "$output" "Usage: tt-deploy" "help shows usage"

export FAKE_DIRTY='?? untracked.txt'
output=$(run_deploy)
exit_code=$?
assert_eq 1 "$exit_code" "dirty worktree fails"
assert_contains "$output" "worktree is dirty" "dirty error is clear"
assert_not_contains "$(<"$fixture_root/calls.log")" "pnpm" "dirty check runs before build"
unset FAKE_DIRTY

export FAKE_DETACHED=1
output=$(run_deploy)
exit_code=$?
assert_eq 1 "$exit_code" "detached HEAD fails"
assert_contains "$output" "detached HEAD" "detached error is clear"
unset FAKE_DETACHED
```

Capture non-zero statuses using an `if output=$(run_deploy); then ... else
exit_code=$?; fi` helper so `set -e` is unnecessary and no result is lost.

- [ ] **Step 4: Run tests and confirm red**

Run:

```zsh
zsh tests/deploy/test-tt-deploy.zsh
```

Expected: failure because `bin/tt-deploy` does not yet exist.

- [ ] **Step 5: Commit test contract**

```zsh
git add tests/deploy
git commit -m "test: define manual deployment safety contract"
```

## Task 2: Implement Safe Build and Publication Pipeline

**Files:**
- Create: `bin/tt-deploy`
- Modify: `tests/deploy/test-tt-deploy.zsh`
- Test: `tests/deploy/test-tt-deploy.zsh`

- [ ] **Step 1: Add executable structure and interface**

Create `bin/tt-deploy`, capture script path before functions, enable strict
pipeline behavior, and define immutable deployment constants:

```zsh
#!/usr/bin/env zsh

script_path=${0:A}
repo_dir=${script_path:h:h}

set -euo pipefail

readonly site_slug='whole-geyser-5pbf'
readonly site_url="https://${site_slug}.here.now/"
readonly production_url='https://tinytrauma.com/'
readonly www_url='https://www.tinytrauma.com/'
readonly output_dir="$repo_dir/out"
typeset -g publish_completed=0

usage() {
  cat <<'EOF'
Usage: tt-deploy

Build and publish the currently checked-out Tiny Trauma branch.
Requires a clean named Git branch and authenticated here.now credentials.
EOF
}
```

Accept no flags except `-h`/`--help`; reject positional arguments with usage and
exit code 2.

- [ ] **Step 2: Add fail-fast preconditions**

Implement helpers with exact separation between pre-publish and post-publish
failures:

```zsh
die() {
  print -u2 -r -- "tt-deploy: $*"
  return 1
}

die_verification() {
  print -u2 -r -- "tt-deploy: publish succeeded, but production verification failed: $*"
  return 1
}

require_command() {
  local command_name=$1
  (( $+commands[$command_name] )) ||
    die "required command not found: $command_name"
}
```

Require `git`, `pnpm`, `curl`, `cmp`, `find`, `grep`, `mktemp`, `sed`, `stat`,
and `tee`. Validate `git -C "$repo_dir" rev-parse --show-toplevel` resolves to
`$repo_dir`. Resolve branch with:

```zsh
branch=$(git -C "$repo_dir" symbolic-ref --quiet --short HEAD) ||
  die "detached HEAD cannot be deployed"
commit_sha=$(git -C "$repo_dir" rev-parse HEAD)
dirty=$(git -C "$repo_dir" status --porcelain --untracked-files=normal)
[[ -z "$dirty" ]] || die "worktree is dirty; commit or remove all changes before deployment"
```

Resolve publisher from `${TT_HERENOW_PUBLISHER:-...}` and require executable.
When `HERENOW_API_KEY` is absent, require non-empty
`$HOME/.herenow/credentials`; read permissions using macOS `stat -f '%Lp'`
with GNU `stat -c '%a'` fallback; refuse any group/other permission bits.

- [ ] **Step 3: Build and validate static export**

From `$repo_dir`, execute:

```zsh
print -r -- "Installing locked dependencies..."
pnpm install --frozen-lockfile

print -r -- "Building static export..."
pnpm build
```

Require `out/index.html`, at least two regular files, and no denylist matches:

```zsh
readonly secret_pattern='(mongodb(\+srv)?://[^ "]*:[^ "]*@|postgres(ql)?://[^ "]*:[^ "]*@|-----BEGIN [A-Z ]*PRIVATE KEY-----)'

if grep -RIEq --binary-files=without-match "$secret_pattern" "$output_dir"; then
  die "static export contains a database credential or private key"
fi
```

- [ ] **Step 4: Publish with authenticated-result validation**

Use a temporary output file and cleanup trap. Preserve publisher output through
`tee`, and only set `publish_completed=1` after process success:

```zsh
publish_log=$(mktemp)
trap 'rm -f -- "$publish_log" "$apex_file" "$site_file"' EXIT

print -r -- "Publishing branch $branch at $commit_sha..."
if ! "$publisher" "$output_dir" --slug "$site_slug" --client ttdeploy 2>&1 |
    tee "$publish_log"; then
  die "here.now publisher failed"
fi
publish_completed=1

grep -Fqx 'publish_result.auth_mode=authenticated' "$publish_log" ||
  die_verification "publisher did not report authenticated mode"
grep -Fqx "publish_result.site_url=$site_url" "$publish_log" ||
  die_verification "publisher reported an unexpected Site URL"
```

- [ ] **Step 5: Verify live production behavior**

Download Site and apex homepages with curl retry settings and compare using
`cmp -s`. Then query exact HTTP status/redirect metadata:

```zsh
curl -fsS --retry 5 --retry-delay 2 --retry-all-errors "$production_url" -o "$apex_file" ||
  die_verification "could not download $production_url"
curl -fsS --retry 5 --retry-delay 2 --retry-all-errors "$site_url" -o "$site_file" ||
  die_verification "could not download $site_url"
cmp -s "$apex_file" "$site_file" ||
  die_verification "apex homepage does not match published Site homepage"

apex_code=$(curl -sS -o /dev/null -w '%{http_code}' "$production_url")
not_found_code=$(curl -sS -o /dev/null -w '%{http_code}' "${production_url}404.html")
www_result=$(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' "$www_url")
[[ "$apex_code" == 200 ]] || die_verification "$production_url returned $apex_code, expected 200"
[[ "$not_found_code" == 200 ]] ||
  die_verification "${production_url}404.html returned $not_found_code, expected 200"
[[ "$www_result" == "301 $production_url" ]] ||
  die_verification "$www_url returned '$www_result', expected '301 $production_url'"
```

Print success summary containing branch, commit, Site URL, and production URL.

- [ ] **Step 6: Complete all offline behavior tests**

Extend fixture tests to assert:

1. current branch and commit appear in successful output;
2. calls log contains `pnpm install --frozen-lockfile` before `pnpm build`;
3. empty export fails before publisher;
4. database credential/private key output fails before publisher;
5. anonymous publisher metadata fails;
6. wrong Site URL fails;
7. apex/Site mismatch fails;
8. wrong `www` response fails;
9. success reports both URLs;
10. publisher invocation is exactly
    `out --slug whole-geyser-5pbf --client ttdeploy`.

Each failure test must reset its environment switch and verify exit code 1 plus
specific error text.

- [ ] **Step 7: Run focused tests and parse checks**

```zsh
chmod +x bin/tt-deploy tests/deploy/test-tt-deploy.zsh
zsh -n bin/tt-deploy
zsh -n tests/deploy/_assert.zsh
zsh -n tests/deploy/test-tt-deploy.zsh
zsh tests/deploy/test-tt-deploy.zsh
```

Expected: all assertions pass; no network access.

- [ ] **Step 8: Commit implementation**

```zsh
git add bin/tt-deploy tests/deploy
git commit -m "feat: add safe manual here.now deployment"
```

## Task 3: Expose Global Alias and Repair Profile Wiring

**Files:**
- Modify: `bin/tt-aliases.zsh`
- Modify: `/Users/amittiwari/Profiles/.bash_aliases`
- Test: fresh interactive zsh

- [ ] **Step 1: Add repository alias**

Append manual deploy to discoverability list and define:

```zsh
# Manual deployment fallback.
alias ttdeploy='tt-deploy'
```

- [ ] **Step 2: Prove stale profile path fails**

Run:

```zsh
zsh -ic 'alias ttdeploy && command -v tt-deploy'
```

Expected before Profiles edit: non-zero; alias not found.

- [ ] **Step 3: Correct Profiles source path**

Change only Tiny Trauma alias source block in
`/Users/amittiwari/Profiles/.bash_aliases`:

```zsh
if [[ -f "$HOME/Projects/TinyTrauma/tiny-trauma-v2/bin/tt-aliases.zsh" ]]; then
  source "$HOME/Projects/TinyTrauma/tiny-trauma-v2/bin/tt-aliases.zsh"
fi
```

Use zsh `[[ ]]` consistently.

- [ ] **Step 4: Verify profile and alias resolution**

```zsh
zsh -n bin/tt-aliases.zsh
zsh -n /Users/amittiwari/Profiles/.bash_aliases
zsh -ic 'alias ttdeploy && command -v tt-deploy'
```

Expected:

```text
ttdeploy=tt-deploy
/Users/amittiwari/Projects/TinyTrauma/tiny-trauma-v2/bin/tt-deploy
```

- [ ] **Step 5: Commit both repository changes independently**

Tiny Trauma:

```zsh
git add bin/tt-aliases.zsh
git commit -m "feat: expose ttdeploy shell alias"
```

Profiles:

```zsh
git -C /Users/amittiwari/Profiles add .bash_aliases
git -C /Users/amittiwari/Profiles commit -m "fix: source Tiny Trauma aliases from current path"
```

## Task 4: Document Manual Deployment

**Files:**
- Modify: `README.md`
- Test: documentation command examples

- [ ] **Step 1: Expand Deployment section**

Document automated and manual paths:

```markdown
## Deployment

Published to **here.now** as a static site, on push to `main`. `out/` is the
published artifact; nothing else is uploaded and no build runs in production.

### Manual fallback

When GitHub Actions is unavailable or has exhausted its allowance, run:

```zsh
ttdeploy
```

`ttdeploy` deploys the named branch currently checked out. It does not fetch,
pull, switch, or merge. It refuses detached `HEAD` and any tracked or untracked
worktree changes.

The command requires active here.now credentials in `~/.herenow/credentials`
(mode `600`) or `HERENOW_API_KEY`. It installs locked dependencies, builds
`out/`, scans the export for credential-shaped content, publishes Site
`whole-geyser-5pbf`, and verifies `tinytrauma.com` plus its `www` redirect.

`tt-deploy` is the direct executable equivalent. Run `tt-deploy --help` for the
short command reference. A non-zero exit before publishing means nothing was
deployed; a post-publish verification error explicitly says publication
succeeded but live verification failed.
```

- [ ] **Step 2: Add deploy tests to Checks**

Add:

```zsh
zsh tests/deploy/test-tt-deploy.zsh  # offline manual-deploy contract
```

- [ ] **Step 3: Verify documentation references**

```zsh
grep -nE 'ttdeploy|whole-geyser-5pbf|tests/deploy' README.md
```

Expected: manual command, Site slug, and offline test command all present.

- [ ] **Step 4: Commit documentation**

```zsh
git add README.md
git commit -m "docs: explain manual here.now deployment"
```

## Task 5: Full Verification and Live Deployment

**Files:**
- Verify: all files above
- Verify: live here.now Site and `tinytrauma.com`

- [ ] **Step 1: Run static and offline checks**

```zsh
zsh -n bin/tt-deploy
zsh -n bin/tt-aliases.zsh
zsh -n tests/deploy/_assert.zsh
zsh -n tests/deploy/test-tt-deploy.zsh
zsh tests/deploy/test-tt-deploy.zsh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected: every command exits 0.

- [ ] **Step 2: Confirm both worktrees clean**

```zsh
git status --short --branch
git -C /Users/amittiwari/Profiles status --short --branch
```

Expected: no changed paths. Tiny Trauma remains on `migrate/here-now`; Profiles
remains on `main`.

- [ ] **Step 3: Verify global command from unrelated directory**

```zsh
cd /tmp
zsh -ic 'alias ttdeploy && command -v tt-deploy && tt-deploy --help'
```

Expected: alias and executable resolve to Tiny Trauma repository, and usage
prints successfully.

- [ ] **Step 4: Run one real manual deployment**

From any directory:

```zsh
zsh -ic 'ttdeploy'
```

Expected:

- branch `migrate/here-now` and its current commit are reported;
- publisher reports authenticated mode and
  `https://whole-geyser-5pbf.here.now/`;
- production comparison and HTTP checks pass;
- final output reports `https://tinytrauma.com/`.

- [ ] **Step 5: Recheck repository state and review diff**

```zsh
git status --short --branch
git log --oneline -6
git show --stat --oneline HEAD
git -C /Users/amittiwari/Profiles status --short --branch
git -C /Users/amittiwari/Profiles log -1 --oneline
```

Expected: both worktrees remain clean; commits contain only planned files.

# Dependency audit, 2026-10-18

Report only: nothing here has been upgraded. Every fix below was tried in a
throwaway worktree and discarded.

## Summary

- GitHub's three open alerts are all low-risk for Hexoscape. The two high
  ones (`braces`, `source-map-js`) are build-time tools that never ship to
  users. The moderate one (`glib`) sits in the Linux desktop stack, and
  nothing in the app calls its broken function.
- `cargo audit` finds seven Rust advisories GitHub does not show: `rustls`
  in the desktop updater's HTTPS client (patch fix available) and `zip` in
  the Windows updater (no fix available yet; reachable only through
  update packages already signed with your key).
- Fix now: `source-map-js` (lockfile-only patch, all checks pass). Fix
  soon: `braces` (an npm override, all local checks pass, but the release
  build that runs it was not exercised) and `rustls` (Cargo.lock-only
  patch, on its own branch). Accept for now: `glib` and `zip`.

## Sources

| Source | Covers | Result |
| --- | --- | --- |
| `gh api repos/Dissolutio/heroscape-map-editor/dependabot/alerts` | npm and Cargo, default branch `main` | 3 open (2 high, 1 moderate); the other 52 are fixed |
| `npm audit` (on `dev`) | npm, all dependencies | 6 high: `source-map-js`, and `braces` with the 4 packages that pull it in |
| `npm audit --omit=dev` | npm, production dependencies only | 5 high: the `braces` chain (it counts as production; see below) |
| `cargo audit` 0.22.2, advisory DB of 2026-10-17 | `src-tauri/Cargo.lock` | 7 vulnerabilities (`rustls` x4, `zip` x3), 1 unsound (`glib`), 6 unmaintained |

The npm sources agree with GitHub: the same two packages, and nothing else.
GitHub's `glib` alert is the same advisory as `cargo audit`'s "unsound"
warning. GitHub does not show the `rustls` and `zip` advisories.

GitHub alerts on `main`, which is 65 commits behind `dev`. Every finding
below has the same version on `main` and `dev` (`package-lock.json` and
`src-tauri/Cargo.lock` compared on both), so all of them also apply to
`dev`.

## Findings

### 1. `braces` 3.0.3: high, GHSA-vfj7-8cjw-p6xm (CVE-2026-93687)

- **What:** deeply nested brace patterns overflow the stack and crash the
  Node process (denial of service).
- **How it gets in:** transitive.
  `@sentry/vite-plugin` 4.9.1 -> `unplugin` 1.0.1 -> `chokidar` 3.6.0 ->
  `braces`. Both `@sentry/vite-plugin` and `@sentry/bundler-plugin-core`
  pin `unplugin` to exactly 1.0.1.
- **Ships to users?** No. `@sentry/vite-plugin` is listed under
  `dependencies` in `package.json`, which is why npm and GitHub call it
  "runtime", but it is a Vite build plugin: it is not in the web bundle or
  the Tauri app.
- **Reachable?** Barely. `vite.config.ts` only enables the Sentry plugin in
  a production build with `SENTRY_AUTH_TOKEN` set, i.e. the CI release
  builds. `chokidar` matches file-watch globs from the build's own
  configuration, not from outside input. Worst case is a failed build.
- **Fix:** no patched `braces` exists (3.0.3 is the latest). Two ways to
  drop it:
  - npm override, `"overrides": { "unplugin": "1.16.1" }` in
    `package.json`. `unplugin` 1.16 no longer uses `chokidar`, so `braces`
    leaves the tree. A minor bump of a transitive package, but it overrides
    an exact pin in the Sentry plugin.
  - Major bump of `@sentry/vite-plugin` 4.9.1 -> 11.8.0 (what `npm audit
    fix --force` proposes). Not tried.
- **Tried (override):** `npm audit` clean of `braces`; `npm test`,
  `npx tsc -b`, `npx tsc -p e2e`, Biome lint and format checks,
  `npm run build` and `npm run test:e2e` (16/16) all pass. The Sentry
  plugin also loads and builds its five Vite plugins with the override (in
  Node, no network). Not verified: a real production build with the Sentry
  token, which is the only place this plugin actually runs (source map
  upload, release creation).
- **Recommendation: fix soon** with the override, verified by one release
  build in CI. The major bump is the cleaner long-term fix; give it its own
  branch.

### 2. `source-map-js` 1.2.1: high, GHSA-68fv-2mgg-jv7q (CVE-2026-93749)

- **What:** an indexed source map with huge section offsets blocks the
  event loop for a long time (denial of service).
- **How it gets in:** transitive, `vite` 6.4.3 -> `postcss` 8.5.28 ->
  `source-map-js`. Dev dependency only.
- **Ships to users?** No. It runs in the Vite dev server and build.
- **Reachable?** Only if a CSS input carried a malicious source map, from
  this repo or an installed package. Worst case is a hung dev server or
  build.
- **Fix:** patch bump to 1.2.2, inside `postcss`'s `^1.2.1` range: a
  three-line `package-lock.json` change, no `package.json` change.
- **Tried:** `npm update source-map-js`; `npm test` (769 passed, 7
  expected fail), `npx tsc -b`, `npx tsc -p e2e`, Biome lint and format
  checks, `npm run build` and `npm run test:e2e` (16/16) all pass.
- **Recommendation: fix now.**

### 3. `glib` 0.18.5 (Rust): moderate, GHSA-wrw7-89jp-8q8g / RUSTSEC-2024-0429

- **What:** unsound iterator over GLib string-array variants
  (`VariantStrIter`, via `Variant::array_iter_str`); built with recent
  compilers it dereferences a null pointer.
- **How it gets in:** transitive, through the Linux desktop stack:
  `tauri` 2.11.5 / `wry` 0.55.1 / `tao` / `muda` -> `gtk` 0.18.2 /
  `webkit2gtk` 2.0.2 -> `glib`.
- **Ships to users?** In the Linux desktop app only (not Windows, macOS or
  the web).
- **Reachable?** No caller found. Searching the source of every cached
  crate in the dependency tree, and `src-tauri/src`, finds
  `VariantStrIter` / `array_iter_str` only where `glib` defines them.
- **Fix:** `glib` >= 0.20 needs `gtk` >= 0.20, which the GTK3 bindings do
  not have: Tauri 2 would have to move its Linux webview off GTK3. Nothing
  to upgrade on our side.
- **Recommendation: accept the risk** until Tauri moves; re-check when
  upgrading Tauri.

### Not shown by GitHub

#### 4. `rustls` 0.23.45 (Rust): RUSTSEC-2026-0346, -0347, -0348, -0349

- **What:** four advisories. A forged ServerHello can downgrade later
  connections to classical key exchange; Brotli certificate decompression
  can allocate up to 1 GiB before authentication; `Debug` output of client
  sessions exposes TLS secrets; buffered data after an ECH rejection.
- **How it gets in:** transitive, `tauri-plugin-updater` 2.12.0 ->
  `reqwest` 0.13.5 / `hyper-rustls` -> `rustls`.
- **Ships to users?** Yes, in every desktop build.
- **Reachable?** The updater checks
  `https://github.com/Dissolutio/heroscape-map-editor/releases/latest/download/latest.json`
  and downloads releases over this TLS stack. The updates themselves are
  signature-checked (`requireSignedVersion` and a public key in
  `tauri.conf.json`), so a downgraded or attacked connection still cannot
  install an unsigned update. Low impact.
- **Fix:** patch bump to 0.23.46, `cargo update -p rustls --precise 0.23.46`
  (a two-line `Cargo.lock` change).
- **Tried:** in the scratch worktree, `cargo check` and
  `cargo test --no-run` both compile cleanly (no warnings) with
  0.23.46. Not run: a desktop build, the app itself, or an update check.
- **Recommendation: fix soon,** on its own branch with a desktop build and
  an update check as the gate (it is part of the Tauri side; see below).

#### 5. `zip` 4.6.1 (Rust): RUSTSEC-2026-0367, -0368, -0369

- **What:** archive extraction can follow symlinks out of the target
  directory, apply Unix permissions through symlinks, and keep SUID/SGID
  bits.
- **How it gets in:** `tauri-plugin-updater`, Windows builds only
  (`cfg(target_os = "windows")`).
- **Ships to users?** Windows desktop builds.
- **Reachable?** Only through `extract_zip` in the updater, which runs
  after the downloaded update's signature has been checked against your
  public key. A malicious archive would have to be signed with your key,
  and whoever has that can ship a malicious installer anyway. The
  Unix-permission and SUID issues do not apply on Windows.
- **Fix:** `zip` >= 9.0.0, but even the newest `tauri-plugin-updater`
  (2.14.0) still requires `zip ^4`. No fix until Tauri updates it.
- **Recommendation: accept the risk;** re-check on the next updater
  release.

#### Unmaintained crates (warnings, not vulnerabilities)

`proc-macro-error` 1.0.4 (via `glib-macros`, compile time) and five `unic-*`
0.9.0 crates (via `urlpattern` in `tauri-utils`). All are pulled in by Tauri
and gtk-rs; nothing to do on our side.

## Upgrades that touch the 3D stack or Tauri

None of the npm findings touch `three`, `@react-three/fiber`,
`@react-three/drei` or `@types/three`. The Rust findings are all on the
Tauri side. A previous library update (branch `update-libs`) made the app
slow, so any upgrade of the 3D stack or of Tauri itself should go on its own
branch, gated by the browser tests (`npm run test:e2e`) and a manual
performance check (frame rate on a large map, in the browser and the
desktop app). The `rustls` bump changes no Tauri version, only a TLS crate
inside the updater, but it still needs a desktop build, so keep it off the
npm fix branch.

## Ranked list

### Fix now

1. **`source-map-js` -> 1.2.2.** On a branch off `dev`:

   ```sh
   npm update source-map-js
   git diff --stat   # only package-lock.json, 3 lines
   npm test && npx tsc -b && npx tsc -p e2e
   npx @biomejs/biome lint ./src ./e2e playwright.config.ts
   npx @biomejs/biome format ./src ./e2e playwright.config.ts
   npm run build && npm run test:e2e
   ```

   Verified: all of the above pass (769 unit tests, 16/16 browser tests).

### Fix soon

2. **`braces`: override `unplugin` to 1.16.1.** Add to `package.json`:

   ```json
   "overrides": { "unplugin": "1.16.1" }
   ```

   then `npm install` and the same checks. Verified locally: all pass, and
   the Sentry plugin loads. Still to verify: one CI release build (the
   only place the Sentry plugin runs). Longer term, the major bump of
   `@sentry/vite-plugin` to 11.x on its own branch.
3. **`rustls` -> 0.23.46.** On its own branch:

   ```sh
   cd src-tauri && cargo update -p rustls --precise 0.23.46
   ```

   Gate: a desktop build and an update check against the GitHub release.
   This is the one time `src-tauri/Cargo.lock` should be committed.

### Accept the risk

4. **`glib`** (Linux desktop only, no caller of the unsound function, no
   fix without Tauri leaving GTK3).
5. **`zip`** (Windows updater only, behind the update signature check, no
   fixed updater release yet).

## Unsure or not verified

- The Sentry plugin with the `unplugin` override in a real release build
  (needs the CI token): not run.
- The `rustls` bump in a real desktop build and update check: not run (see
  above for what was checked).
- Why GitHub shows no `rustls` or `zip` alerts: probably those RustSec
  advisories are not in GitHub's advisory database yet; not confirmed.
- Reachability of `glib`'s unsound function rests on searching the cached
  crate sources; system libraries and code generated at build time were
  not searched.
- Real GPU, the Tauri window on each platform, and the `update-libs`
  slowdown were not looked at.

# Dependency alert triage, 2026-10-26

## Summary

- The GitHub Dependabot alerts endpoint returned HTTP 403, so alert numbers
  and alert #49 could not be mapped to packages or advisory records.
- `npm audit --json` on `main`'s `package.json` and `package-lock.json`
  reports two moderate package findings and one high package finding.
  The corresponding package versions are already patched on `dev`; its
  npm audit reports zero vulnerabilities. No dependency changes were needed
  on this branch.
- `cargo-audit` is not installed. The Rust lockfiles were compared, but
  current Rust advisory status could not be verified. The prior audit's
  `glib` and `zip` risks remain documented below, not asserted as current
  Dependabot alerts.

## npm findings on `main`

The vulnerable package entries are in `package-lock.json`; `vite`, `vitest`
and `@vitest/mocker` are development/build/test tooling, not shipped in the
web or Tauri application. The app does not execute the affected Vite editor
launch paths or run Vitest against user-supplied maps during normal use.

| Package on `main` | Severity and advisory | Vulnerable range | Patched version on `dev` | Path | Triage |
| --- | --- | --- | --- | --- | --- |
| `vite` 6.4.3 | High: GHSA-587h-7wmj-h5pm; Moderate: GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22 | `<=6.4.3` | 6.4.5 | `package-lock.json` | Build/dev only. Realistic exposure is limited to a developer running the vulnerable Vite tooling, particularly its Windows editor-launch handling; it is not in the shipped app. |
| `vitest` / `@vitest/mocker` 4.1.11 | Moderate: GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp | `>=2.1.0-beta.7 <4.1.12` (first advisory); `>=4.1.11 <4.1.12` (second) | 4.1.12 | `package-lock.json` | Test-only tooling. Risk requires running the vulnerable test runner/mocker; Hexoscape does not run it against maps or share links in production. |

Both fixes are already present in `dev`'s lockfile: `vite` 6.4.5 and
`vitest`/`@vitest/mocker` 4.1.12. `npm audit --json` on `dev` reports
`0` vulnerabilities. `source-map-js` is 1.2.2 on both branches, and `braces`
is absent from both lockfiles.

These npm audit results identify package advisories, not GitHub alert
numbers. Because the alerts endpoint was inaccessible, they cannot be
reliably mapped to the reported two moderate Dependabot alerts or alert #49.

## Rust findings not verified in this run

The `main` and `dev` lockfiles both contain `glib` 0.18.5, `rustls` 0.23.46,
and `zip` 4.6.1. `cargo-audit` was unavailable, so no Rust advisory database
scan was run against either lockfile.

| Package | Prior audit finding | Triage and revisit |
| --- | --- | --- |
| `glib` 0.18.5 | Moderate, GHSA-wrw7-89jp-8q8g / RUSTSEC-2024-0429 | Linux GTK3/Tauri dependency. The prior audit found no caller of the affected iterator, and a compatible upgrade requires the Tauri Linux stack to move off GTK3. Leave unchanged; revisit with a Tauri GTK-stack update and rerun `cargo audit`. |
| `zip` 4.6.1 | RUSTSEC-2026-0367, RUSTSEC-2026-0368, RUSTSEC-2026-0369 | Windows updater dependency; the prior audit found the vulnerable extraction path behind update signature verification, and the current updater dependency line does not accept the fixed `zip` 9.x release. Leave unchanged; revisit when `tauri-plugin-updater` supports a fixed `zip` version and rerun `cargo audit`. |

The same prior audit recorded `rustls` advisories for 0.23.45; the lockfiles
now contain 0.23.46, but the current advisory status was not independently
checked.

## Verification limits

- GitHub Dependabot alert details, including alert #49, could not be read
  (HTTP 403).
- `cargo-audit` was not installed, so Rust advisories could not be checked on
  either branch.
- No real Sentry-token release build, Windows/macOS Tauri builds, update
  download, or GPU frame-rate check was run.

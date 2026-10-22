# Releasing

1. Promote the tested `dev` branch to `main`.
2. Add the user-facing entry for the release to [`release-notes.md`](../release-notes.md)
   before promoting; the app bundles that file into its What's New dialog.
3. A push to `main` computes the next patch version from the highest `v*` tag
   and builds the desktop release. The workflow tags the exact pushed commit,
   publishes the GitHub release, and does not commit the temporary app-version
   sync back to the repository. If the commit already has a `v*` tag, the
   release build is skipped. Runs are serialized and an active build is not
   cancelled.
4. For a manual minor or major release, push the chosen tag (for example,
   `git tag v2.0.0 && git push origin v2.0.0`). The workflow uses that version.
5. To preview an automatically computed patch version, dispatch the Release
   Tauri Application workflow with `dry_run` enabled. It prints the computed
   version and does not run the build matrix.

The release workflow itself must be verified by the owner on its first real
run. Confirm that the version output is correct, all three platform builds
succeed, the created tag points to the triggering commit, and the published
release contains the expected signed updater assets and Sentry release version.

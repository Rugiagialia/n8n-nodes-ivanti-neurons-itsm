# Project Agent Notes

## Scope

These notes are intended to stay useful after cloning or checking out this repository in a new folder or worktree.

## Local n8n Testing

This repository is commonly tested through an existing local `n8n` instance instead of `n8n-node dev`.

Before running manual tests in local `n8n`:

1. Check which checkout is currently linked into local `n8n`.
2. Inspect both `~/.n8n/nodes/node_modules` and `~/.n8n/custom/node_modules` for duplicate links to this package.
3. Keep only one active package link for `n8n-nodes-ivanti-neurons-itsm`, pointing at the checkout being tested.
4. Do not leave backup symlinks for this package inside `~/.n8n/nodes/node_modules` or `~/.n8n/custom/node_modules`; `n8n` can detect them as duplicate package copies.
5. If a backup is needed, move it outside those `node_modules` directories.
6. Run `npm run build` only after the symlink state is correct.
7. Restart or start the user's normal local `n8n`, then verify the change in the UI.
8. If `n8n` fails to start because it cannot bind to `::`, retry with `N8N_LISTEN_ADDRESS=127.0.0.1`.

After testing:

1. Do not assume the temporary symlink should remain.
2. Restore the previous link target or explicitly confirm with the user whether the temporary link should stay in place.
3. If you temporarily repointed the active symlink to a different worktree, record the previous target before changing it so it can be restored exactly.
4. If you only need a startup smoke test, it is acceptable to start local `n8n` and verify a healthy response such as `GET /healthz`, but this does not replace a real credential-backed functional test.

## Practical Guidance

- Do not assume local `n8n` is loading the current checkout.
- If changes appear to be ignored, verify symlinks before debugging code.
- Duplicate active links can make a successful build look broken.
- Do not commit generated tarballs such as `*.tgz`.

## Release Guidance

Before release:

1. Run `npm run build`.
2. Run `npm run lint`.
3. Verify package contents with `npm pack --json --dry-run`.
4. Confirm the tarball contains `dist/**`.
5. Keep changelog entries under the next unreleased version, not under an already tagged version.
6. Make sure `npm pack --json --dry-run` is run only after `npm run build` has finished; running them in parallel can fail because `dist/` may not exist yet.
7. If working from multiple git worktrees, check whether `main` is already checked out elsewhere before doing merge, tag, or publish steps.
8. If `main` is checked out in another worktree, perform the final merge/tag/publish sequence from that `main` checkout rather than trying to switch branches in the current worktree.
9. When releasing from a feature worktree, create a normal feature commit on the feature branch first, then merge into `main`, and keep the release metadata changes (`package.json`, `CHANGELOG.md`, tag) in a separate release commit on `main`.

Versioning:

- Keep `package.json` version and git tag aligned, for example `0.9.2` and `v0.9.2`.
- Before pushing or publishing, verify that `package.json`, the release commit at `HEAD`, and the release tag all point to the same version and the same commit.
- If the repository uses `v`-prefixed tags, keep using that convention.
- After release preparation, push both the branch and the tag explicitly.
- After pushing the tag, create or update the GitHub Release entry so the published version is visible in the repository Releases page.

## npm Publishing

- If `npm whoami` fails, fix authentication before attempting `npm publish`.
- Check whether auth is coming from `~/.npmrc` or from a project-specific `.npmrc`.
- If the repository contains a project `.npmrc`, verify whether it overrides the token from `~/.npmrc` before publishing.
- A token may work for `whoami` but still fail publish if the npm policy requires 2FA bypass for publishing.
- If publish scripts are unnecessary or known to fail in this repository, `npm publish --ignore-scripts` is an acceptable release path.
- If `npm publish` is blocked by this repository's `prepublishOnly` script after build/lint/pack checks already passed, use `npm publish --ignore-scripts` instead of trying to bypass the release checks in another way.
- If `npm publish` returns an unexpected registry error such as `404` even though `npm whoami` works and package ownership is correct, compare the effective auth token source from the project `.npmrc` and `~/.npmrc`.
- If publish must use the home npm config instead of the project `.npmrc`, prefer `npm pack` first and then publish the generated tarball from a temporary directory with `--userconfig ~/.npmrc`.
- Do not publish from a temporary directory until the tarball has already been verified from the intended, fully built checkout.

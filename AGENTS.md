# Project Agent Notes

## Scope

These notes are intended to stay useful after cloning or checking out this repository in a new folder or worktree.

## Local n8n Testing

This repository is commonly tested through an existing local `n8n` instance instead of `n8n-node dev`.

Before running manual tests in local `n8n`:

1. Check which checkout is currently linked into local `n8n`.
2. Inspect both `~/.n8n/nodes/node_modules` and `~/.n8n/custom/node_modules` for duplicate links to this package.
3. Keep only one active package link for `n8n-nodes-ivanti-neurons-itsm`, pointing at the checkout being tested.
4. Run `npm run build` only after the symlink state is correct.
5. Restart or start the user's normal local `n8n`, then verify the change in the UI.

After testing:

1. Do not assume the temporary symlink should remain.
2. Restore the previous link target or explicitly confirm with the user whether the temporary link should stay in place.

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

Versioning:

- Keep `package.json` version and git tag aligned, for example `0.9.2` and `v0.9.2`.
- If the repository uses `v`-prefixed tags, keep using that convention.
- After release preparation, push both the branch and the tag explicitly.

## npm Publishing

- If `npm whoami` fails, fix authentication before attempting `npm publish`.
- Check whether auth is coming from `~/.npmrc` or from a project-specific `.npmrc`.
- A token may work for `whoami` but still fail publish if the npm policy requires 2FA bypass for publishing.
- If publish scripts are unnecessary or known to fail in this repository, `npm publish --ignore-scripts` is an acceptable release path.

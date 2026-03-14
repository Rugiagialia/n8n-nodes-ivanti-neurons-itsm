# Local Agent Notes

## User Preferences

- For `n8n` community node work in this repository, prefer testing in the user's existing local `n8n` instance when the user wants to validate changes there.

## Local n8n Testing Rule

When starting work on a new `n8n` community node project, first inspect the local `n8n` package symlinks before suggesting or running `npm run build`, relinking, or manual UI tests.

If the user wants to test changes in their normal local `n8n`:

1. Check which package copy is currently linked into local `n8n`.
2. Look for duplicate or conflicting links, especially between `~/.n8n/nodes/node_modules` and `~/.n8n/custom/node_modules`.
3. Make sure only the intended project copy is active.
4. Only after the symlink state is clear, run `npm run build`.
5. Then restart or start the user's normal local `n8n` and verify the change in the UI.

## Practical Guidance

- Do not assume an `n8n` project is loaded from the current repository path.
- If the user previously worked from another local clone or repo, verify whether `n8n` is still linked to that older path.
- Duplicate active links can make it look like code changes are ignored even when the build succeeds.
- Prefer fixing the symlink state first and only then moving to build and test steps.

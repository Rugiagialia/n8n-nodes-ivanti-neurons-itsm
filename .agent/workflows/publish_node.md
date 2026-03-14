---
description: Publish the n8n node to npm
---

1. Ensure the package version and changelog are already prepared for the next release.
2. Verify npm authentication before publishing:
   ```bash
   npm whoami
   ```
3. Run the build to ensure the `dist` folder is up to date:
   ```bash
   npm run build
   ```
4. Run lint:
   ```bash
   npm run lint
   ```
5. Verify the package contents that will be published:
   ```bash
   npm pack --json --dry-run
   ```
6. Publish to npm. For this repository, ignore publish scripts if they are not needed for the release:
   ```bash
   npm publish --ignore-scripts
   ```
7. If publishing fails with a 2FA policy error, use an npm login or a granular token with publish permission and 2FA bypass enabled.

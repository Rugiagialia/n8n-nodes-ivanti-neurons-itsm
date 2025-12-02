---
description: Publish the n8n node to npm
---

1. Ensure `NPM_TOKEN` is set in your `.env` file.
2. Run the build to ensure the `dist` folder is up to date:
   ```bash
   npm run build
   ```
3. Publish to npm. This command temporarily creates an `.npmrc` file using the token from `.env` and removes it afterwards:
   ```bash
   set -a && source .env && set +a && echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && npm publish --ignore-scripts; rm .npmrc
   ```

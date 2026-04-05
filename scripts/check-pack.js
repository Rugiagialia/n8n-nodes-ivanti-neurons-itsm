const { execFileSync } = require('node:child_process');

const requiredFiles = [
    'dist/nodes/IvantiNeuronsItsm/IvantiNeuronsItsm.node.js',
    'dist/nodes/IvantiNeuronsItsm/IvantiNeuronsItsmTrigger.node.js',
    'dist/nodes/IvantiNeuronsItsmWebService/IvantiNeuronsItsmWebService.node.js',
    'dist/credentials/IvantiNeuronsItsmApi.credentials.js',
    'dist/credentials/IvantiNeuronsItsmWebServiceApi.credentials.js',
];

const forbiddenFiles = [
    'dist/tsconfig.tsbuildinfo',
];

const output = execFileSync('npm', ['pack', '--json', '--dry-run'], {
    encoding: 'utf8',
});

const packResult = JSON.parse(output);

if (!Array.isArray(packResult) || packResult.length === 0) {
    throw new Error('npm pack --json --dry-run returned no package metadata');
}

const files = new Set(packResult[0].files.map((file) => file.path));

const missingFiles = requiredFiles.filter((file) => !files.has(file));
if (missingFiles.length > 0) {
    throw new Error(
        `Packed tarball is missing required files:\n${missingFiles.map((file) => `- ${file}`).join('\n')}`,
    );
}

const unexpectedFiles = forbiddenFiles.filter((file) => files.has(file));
if (unexpectedFiles.length > 0) {
    throw new Error(
        `Packed tarball contains forbidden files:\n${unexpectedFiles.map((file) => `- ${file}`).join('\n')}`,
    );
}

console.log('Pack validation successful.');

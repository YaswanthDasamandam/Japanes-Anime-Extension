import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pkgPath = path.join(rootDir, 'package.json');
const manifestPath = path.join(rootDir, 'extension', 'manifest.json');

export function getVersionInfo() {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return {
    rawVersion: pkg.version || '0.1.0',
    // Chrome Web Store requires 1-4 dot-separated integers (no hyphens/letters)
    chromeVersion: (pkg.version || '0.1.0').replace(/[-+].*$/, '').trim(),
    pkg
  };
}

export function syncVersions(newVersion = null) {
  const { pkg } = getVersionInfo();

  if (newVersion) {
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  const rawVersion = pkg.version;
  const chromeVersion = rawVersion.replace(/[-+].*$/, '').trim();

  // Sync extension/manifest.json
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const oldManifestVersion = manifest.version;
  manifest.version = chromeVersion;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  return { rawVersion, chromeVersion, oldManifestVersion };
}

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];

  if (arg === '--get') {
    const { rawVersion } = getVersionInfo();
    process.stdout.write(rawVersion);
    process.exit(0);
  }

  if (arg === '--get-tag') {
    const { rawVersion } = getVersionInfo();
    const tag = rawVersion.startsWith('v') ? rawVersion : `v${rawVersion}`;
    process.stdout.write(tag);
    process.exit(0);
  }

  let targetVersion = null;
  const { rawVersion } = getVersionInfo();

  if (arg === '--patch') {
    const parts = rawVersion.split('-');
    const nums = parts[0].split('.').map(Number);
    nums[2] = (nums[2] || 0) + 1;
    targetVersion = nums.join('.') + (parts[1] ? `-${parts[1]}` : '');
  } else if (arg === '--minor') {
    const parts = rawVersion.split('-');
    const nums = parts[0].split('.').map(Number);
    nums[1] = (nums[1] || 0) + 1;
    nums[2] = 0;
    targetVersion = nums.join('.') + (parts[1] ? `-${parts[1]}` : '');
  } else if (arg && !arg.startsWith('--')) {
    targetVersion = arg;
  }

  const res = syncVersions(targetVersion);
  console.log(`[Version SSoT] Current Version: ${res.rawVersion}`);
  console.log(`[Version SSoT] Chrome Manifest Version: ${res.chromeVersion}`);
}

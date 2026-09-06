import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const extensionDir = path.resolve(rootDir, 'extension');
const distDir = path.resolve(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

import { syncVersions } from './sync-version.js';

// Synchronize manifest.json with package.json (Single Source of Truth)
const { rawVersion, chromeVersion } = syncVersions();

const outputFile = path.resolve(distDir, `anime-romaji-dual-subtitles-v${rawVersion}.zip`);
const latestZip = path.resolve(distDir, 'anime-romaji-extension-latest.zip');

console.log(`[Packager] Preparing extension bundle v${rawVersion} (Chrome manifest: ${chromeVersion})...`);

// Files/directories from extension/ to include (excluding models/ or any dev cache)
const includes = ['manifest.json', 'content', 'icons', 'lib', 'popup'];

try {
  if (process.platform === 'win32') {
    const pathsArg = includes.map(f => `'${path.join(extensionDir, f).replace(/'/g, "''")}'`).join(', ');
    const cmd = `powershell -NoProfile -Command "Compress-Archive -Path ${pathsArg} -DestinationPath '${outputFile.replace(/'/g, "''")}' -Force"`;
    execSync(cmd, { stdio: 'inherit' });
  } else {
    // macOS / Linux
    const files = includes.join(' ');
    execSync(`cd "${extensionDir}" && zip -r "${outputFile}" ${files}`, { stdio: 'inherit' });
  }

  // Also keep a generic anime-romaji-extension-latest.zip
  fs.copyFileSync(outputFile, latestZip);

  const stats = fs.statSync(outputFile);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`[Packager] Success! Created:`);
  console.log(`  - ${outputFile} (${sizeKb} KB)`);
  console.log(`  - ${latestZip} (${sizeKb} KB)`);
  console.log('[Packager] Ready to attach to GitHub Pre-release or share with testers.');
} catch (err) {
  console.error('[Packager] Error packaging extension:', err.message);
  process.exit(1);
}

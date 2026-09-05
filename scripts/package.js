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

// Read version dynamically from manifest.json
const manifestPath = path.join(extensionDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version || '0.1.0';

const outputFile = path.resolve(distDir, `anime-romaji-dual-subtitles-v${version}-test.zip`);
const latestTestZip = path.resolve(distDir, 'anime-romaji-extension-test.zip');

console.log(`[Packager] Preparing test extension bundle v${version}...`);

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

  // Also keep a generic anime-romaji-extension-test.zip
  fs.copyFileSync(outputFile, latestTestZip);

  const stats = fs.statSync(outputFile);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`[Packager] Success! Created:`);
  console.log(`  - ${outputFile} (${sizeKb} KB)`);
  console.log(`  - ${latestTestZip} (${sizeKb} KB)`);
  console.log('[Packager] Ready to attach to GitHub Pre-release or share with testers.');
} catch (err) {
  console.error('[Packager] Error packaging extension:', err.message);
  process.exit(1);
}

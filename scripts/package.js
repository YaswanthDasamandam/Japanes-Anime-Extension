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

const outputFile = path.resolve(distDir, 'anime-romaji-dual-subtitles-v1.0.0.zip');

console.log('[Packager] Preparing extension bundle for distribution...');

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

  const stats = fs.statSync(outputFile);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`[Packager] Success! Created: ${outputFile} (${sizeKb} KB)`);
  console.log('[Packager] Ready to upload to Chrome Web Store or attach to GitHub Releases.');
} catch (err) {
  console.error('[Packager] Error packaging extension:', err.message);
  process.exit(1);
}

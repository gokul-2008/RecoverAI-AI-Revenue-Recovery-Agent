const { execSync } = require('child_process');
const path = require('path');

try {
  const frontendDir = path.join(__dirname, '../frontend');
  console.log('[BUILD] Building Vite production bundle into dist...');
  execSync('npx vite build --outDir ../dist --emptyOutDir', { cwd: frontendDir, stdio: 'inherit', shell: true });
  console.log('[BUILD] Production build completed successfully!');
} catch (err) {
  console.error('[BUILD ERROR]', err.message);
  process.exit(1);
}

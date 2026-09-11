const { execSync } = require('child_process');
const path = require('path');

try {
  const frontendDir = path.join(__dirname, '../frontend');
  console.log('[BUILD] Building Vite production bundle into dist...');
  execSync('npm --prefix frontend run build -- --outDir ../dist --emptyOutDir', { stdio: 'inherit' });
  console.log('[BUILD] Production build completed successfully!');
} catch (err) {
  console.error('[BUILD ERROR]', err.message);
  process.exit(1);
}

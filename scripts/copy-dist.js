const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../frontend/dist');
const dest = path.join(__dirname, '../dist');

if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true });
  console.log(`[BUILD] Successfully synced build assets from ${src} -> ${dest}`);
} else {
  console.warn(`[BUILD] Warning: Source build directory not found: ${src}`);
}

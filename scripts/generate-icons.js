import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  console.log('Generating PWA icons...');
  
  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('pwa-192x192.png generated');

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('pwa-512x512.png generated');

  // 512x512 maskable (with background safe zone padding)
  await sharp(svgBuffer)
    .resize(420, 420)
    .extend({
      top: 46,
      bottom: 46,
      left: 46,
      right: 46,
      background: '#0d9488'
    })
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('pwa-maskable-512x512.png generated');

  // apple-touch-icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('apple-touch-icon.png generated');

  // favicon 48x48
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile('public/favicon.ico');
  console.log('favicon.ico generated');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 1. Full Official SWARAKU Logo (Emblem + SWARAKU text)
const fullSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <!-- Solid White Background -->
  <rect width="800" height="800" fill="#FFFFFF" />

  <g transform="translate(400, 340)">
    <!-- Equalizer Soundwave Bars Left -->
    <rect x="-240" y="-35" width="22" height="70" rx="11" fill="#5B6B82" />
    <rect x="-195" y="-95" width="24" height="190" rx="12" fill="#5B6B82" />
    <rect x="-148" y="-155" width="25" height="310" rx="12.5" fill="#00A4C6" />

    <!-- Equalizer Soundwave Bars Right -->
    <rect x="123" y="-155" width="25" height="310" rx="12.5" fill="#00A4C6" />
    <rect x="171" y="-95" width="24" height="190" rx="12" fill="#5B6B82" />
    <rect x="218" y="-35" width="22" height="70" rx="11" fill="#5B6B82" />

    <!-- Centerpiece: Stylized Modern "S" -->
    <!-- Top Half: Dark Midnight Navy (#081225) -->
    <path
      d="M 92 -112
         C 82 -156, 48 -186, -8 -186
         C -78 -186, -114 -142, -114 -88
         C -114 -28, -68 12, -8 40
         L 58 72
         L 100 4
         C 50 -18, -34 -38, -34 -74
         C -34 -98, -14 -116, 12 -116
         C 46 -116, 68 -98, 72 -76
         Z"
      fill="#081225"
    />

    <!-- Bottom Half: Vibrant Cyan (#00A4C6) with dynamic tail fin -->
    <path
      d="M 58 72
         L -8 40
         L -66 128
         C -28 152, 54 168, 54 196
         C 54 216, 32 232, 2 232
         C -40 232, -68 206, -72 174
         L -136 174
         L -142 206
         C -128 258, -80 286, 0 286
         C 78 286, 128 244, 128 188
         C 128 132, 86 100, 42 78
         Z"
      fill="#00A4C6"
    />
  </g>

  <!-- Wordmark 'S W A R A K U' in Bold Geometric Sans-serif -->
  <text
    x="400"
    y="650"
    text-anchor="middle"
    fill="#081225"
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Montserrat', sans-serif"
    font-size="68"
    font-weight="900"
    letter-spacing="0.22em"
  >
    SWARAKU
  </text>
</svg>`;

// 2. Pure Icon Emblem (S + Soundwave bars only, centered, transparent background)
const iconSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 480" width="560" height="480" fill="none">
  <g transform="translate(280, 240)">
    <!-- Equalizer Soundwave Bars Left -->
    <rect x="-240" y="-35" width="22" height="70" rx="11" fill="#5B6B82" />
    <rect x="-195" y="-95" width="24" height="190" rx="12" fill="#5B6B82" />
    <rect x="-148" y="-155" width="25" height="310" rx="12.5" fill="#00A4C6" />

    <!-- Equalizer Soundwave Bars Right -->
    <rect x="123" y="-155" width="25" height="310" rx="12.5" fill="#00A4C6" />
    <rect x="171" y="-95" width="24" height="190" rx="12" fill="#5B6B82" />
    <rect x="218" y="-35" width="22" height="70" rx="11" fill="#5B6B82" />

    <!-- Centerpiece Modern 'S' -->
    <path
      d="M 92 -112
         C 82 -156, 48 -186, -8 -186
         C -78 -186, -114 -142, -114 -88
         C -114 -28, -68 12, -8 40
         L 58 72
         L 100 4
         C 50 -18, -34 -38, -34 -74
         C -34 -98, -14 -116, 12 -116
         C 46 -116, 68 -98, 72 -76
         Z"
      fill="#081225"
    />

    <path
      d="M 58 72
         L -8 40
         L -66 128
         C -28 152, 54 168, 54 196
         C 54 216, 32 232, 2 232
         C -40 232, -68 206, -72 174
         L -136 174
         L -142 206
         C -128 258, -80 286, 0 286
         C 78 286, 128 244, 128 188
         C 128 132, 86 100, 42 78
         Z"
      fill="#00A4C6"
    />
  </g>
</svg>`;

async function buildLogos() {
  const publicDir = path.resolve('public/images');
  const srcAssetsDir = path.resolve('src/assets/images');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(srcAssetsDir)) fs.mkdirSync(srcAssetsDir, { recursive: true });

  // Full Logo files
  fs.writeFileSync(path.join(publicDir, 'swaraku_logo.svg'), fullSvgContent);
  fs.writeFileSync(path.resolve('public/swaraku_logo.svg'), fullSvgContent);

  const fullBuffer = Buffer.from(fullSvgContent);
  await sharp(fullBuffer).resize(1024, 1024).png({ quality: 100 }).toFile(path.join(publicDir, 'swaraku_logo.png'));
  await sharp(fullBuffer).resize(1024, 1024).png({ quality: 100 }).toFile(path.resolve('public/swaraku_logo.png'));
  await sharp(fullBuffer).resize(1024, 1024).png({ quality: 100 }).toFile(path.join(srcAssetsDir, 'swaraku_logo.png'));
  await sharp(fullBuffer).resize(1024, 1024).jpeg({ quality: 98 }).toFile(path.join(publicDir, 'swaraku_logo.jpg'));
  await sharp(fullBuffer).resize(1024, 1024).jpeg({ quality: 98 }).toFile(path.resolve('public/swaraku_logo.jpg'));
  await sharp(fullBuffer).resize(1024, 1024).jpeg({ quality: 98 }).toFile(path.join(srcAssetsDir, 'swaraku_logo.jpg'));

  // Pure Icon files (no duplicate text at bottom, ideal for inline badges)
  fs.writeFileSync(path.join(publicDir, 'swaraku_icon.svg'), iconSvgContent);
  fs.writeFileSync(path.resolve('public/swaraku_icon.svg'), iconSvgContent);
  fs.writeFileSync(path.resolve('public/icon.svg'), iconSvgContent);

  const iconBuffer = Buffer.from(iconSvgContent);
  await sharp(iconBuffer).resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(path.join(publicDir, 'swaraku_icon.png'));
  await sharp(iconBuffer).resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(path.resolve('public/swaraku_icon.png'));
  await sharp(iconBuffer).resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(path.join(srcAssetsDir, 'swaraku_icon.png'));

  console.log('Successfully generated SWARAKU logo & icon assets!');
}

buildLogos().catch(console.error);

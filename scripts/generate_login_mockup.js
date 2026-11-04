import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateNeatLoginMockup() {
  const mockupSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#081225" />
      <stop offset="50%" stop-color="#0B1A30" />
      <stop offset="100%" stop-color="#003548" />
    </linearGradient>

    <!-- Card Soft Elevation -->
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000000" flood-opacity="0.45" />
    </filter>

    <!-- Logo White Card Badge Shadow -->
    <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="900" fill="url(#bgGrad)" />

  <!-- Ambient Light Orbs -->
  <circle cx="220" cy="180" r="380" fill="#00A4C6" opacity="0.08" filter="blur(70px)" />
  <circle cx="980" cy="720" r="380" fill="#0284C7" opacity="0.08" filter="blur(70px)" />

  <!-- Centered Login Device Mockup Card -->
  <g transform="translate(360, 40)" filter="url(#cardShadow)">
    <!-- Device Frame / White Card Base -->
    <rect width="480" height="820" rx="36" fill="#FFFFFF" />

    <!-- Top Phone Header / Status Bar -->
    <text x="36" y="38" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700">09:41</text>
    <circle cx="430" cy="34" r="3.5" fill="#10B981" />
    <text x="438" y="38" fill="#64748B" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600">4G</text>

    <!-- BRANDING SECTION: Logo Box + SWARAKU Text Underneath -->
    <g transform="translate(240, 140)">
      <!-- Pure Emblem: S + Equalizer Soundwaves (Centered around 0, -35) -->
      <g transform="translate(0, -38) scale(0.38)">
        <!-- Left Soundwave Bars -->
        <rect x="-240" y="-35" width="22" height="70" rx="11" fill="#5B6B82" />
        <rect x="-195" y="-95" width="24" height="190" rx="12" fill="#5B6B82" />
        <rect x="-148" y="-155" width="25" height="310" rx="12.5" fill="#00A4C6" />

        <!-- Right Soundwave Bars -->
        <rect x="123" y="-155" width="25" height="310" rx="12.5" fill="#00A4C6" />
        <rect x="171" y="-95" width="24" height="190" rx="12" fill="#5B6B82" />
        <rect x="218" y="-35" width="22" height="70" rx="11" fill="#5B6B82" />

        <!-- Center Stylized 'S' Emblem -->
        <!-- Navy Top -->
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

        <!-- Cyan Bottom Fin -->
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

      <!-- Rapih & Bersih: Teks "SWARAKU" Berada Tepat di Bawah Gambar Logo -->
      <text
        x="0"
        y="54"
        text-anchor="middle"
        fill="#081225"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        font-size="28"
        font-weight="900"
        letter-spacing="0.18em"
      >
        SWARAKU
      </text>

      <!-- Sub-label -->
      <text
        x="0"
        y="78"
        text-anchor="middle"
        fill="#64748B"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="12"
        font-weight="600"
      >
        Sistem Pemenangan Caleg &amp; Pilkada
      </text>
    </g>

    <!-- Role Selection Title -->
    <text x="36" y="260" fill="#334155" font-family="system-ui, sans-serif" font-size="11" font-weight="700" letter-spacing="0.05em">PILIH JENIS AKUN:</text>

    <!-- Role Option 1: Tim Sukses (Selected) -->
    <rect x="36" y="274" width="196" height="74" rx="16" fill="#ECFEFF" stroke="#0891B2" stroke-width="2" />
    <rect x="48" y="286" width="28" height="28" rx="8" fill="#0891B2" />
    <text x="62" y="305" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">★</text>
    <text x="84" y="301" fill="#0E7490" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">01. Tim Sukses</text>
    <text x="84" y="318" fill="#64748B" font-family="system-ui, sans-serif" font-size="10">DPT &amp; Command Center</text>

    <!-- Role Option 2: Kader Lapangan -->
    <rect x="248" y="274" width="196" height="74" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
    <rect x="260" y="286" width="28" height="28" rx="8" fill="#F1F5F9" />
    <text x="274" y="305" text-anchor="middle" fill="#0F766E" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">✓</text>
    <text x="296" y="301" fill="#1E293B" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">02. Kader TPS</text>
    <text x="296" y="318" fill="#64748B" font-family="system-ui, sans-serif" font-size="10">KTP OCR &amp; C1 Plano</text>

    <!-- Username Input Field -->
    <text x="36" y="380" fill="#475569" font-family="system-ui, sans-serif" font-size="12" font-weight="600">Username atau ID Relawan</text>
    <rect x="36" y="392" width="408" height="50" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" />
    <text x="54" y="423" fill="#0F172A" font-family="system-ui, sans-serif" font-size="14" font-weight="500">timsukses@swaraku.com</text>

    <!-- Password Input Field -->
    <text x="36" y="470" fill="#475569" font-family="system-ui, sans-serif" font-size="12" font-weight="600">Kata Sandi Enkripsi</text>
    <rect x="36" y="482" width="408" height="50" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" />
    <text x="54" y="513" fill="#0F172A" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">••••••••••••</text>

    <!-- Remember Me -->
    <circle cx="44" cy="554" r="6" fill="#0891B2" />
    <text x="58" y="558" fill="#475569" font-family="system-ui, sans-serif" font-size="12">Ingat akun di perangkat ini</text>

    <!-- Login Button -->
    <rect x="36" y="580" width="408" height="52" rx="16" fill="#0891B2" />
    <text x="240" y="612" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="bold">Masuk ke Aplikasi SWARAKU →</text>

    <!-- Quick Demo Buttons -->
    <text x="240" y="660" text-anchor="middle" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" letter-spacing="0.08em">AKSES CEPAT DEMO 1-KLIK</text>
    <rect x="36" y="676" width="196" height="44" rx="12" fill="#F0FDFA" stroke="#CCFBF1" stroke-width="1" />
    <text x="134" y="703" text-anchor="middle" fill="#0F766E" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">Demo: Tim Sukses</text>
    <rect x="248" y="676" width="196" height="44" rx="12" fill="#F0FDF4" stroke="#DCFCE7" stroke-width="1" />
    <text x="346" y="703" text-anchor="middle" fill="#15803D" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">Demo: Kader TPS</text>

    <!-- Security Info -->
    <text x="240" y="756" text-anchor="middle" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11">Sistem Terenkripsi &amp; Terverifikasi KPU RI</text>
  </g>
</svg>
`;

  const finalImg = await sharp(Buffer.from(mockupSvg))
    .jpeg({ quality: 96 })
    .toBuffer();

  fs.writeFileSync('public/images/swaraku_login_screen_mockup_1791277767336.jpg', finalImg);
  fs.writeFileSync('src/assets/images/swaraku_login_screen_mockup_1791277767336.jpg', finalImg);
  console.log('Successfully generated neat login mockup with SWARAKU text cleanly positioned below logo!');
}

generateNeatLoginMockup().catch(console.error);

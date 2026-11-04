import React, { useState } from 'react';
import { APP_IMAGES } from '../../assets/images';

interface SwarakuLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'full' | 'horizontal' | 'icon';
  theme?: 'light' | 'dark' | 'auto';
  showSubtitle?: boolean;
}

export const SwarakuLogo: React.FC<SwarakuLogoProps> = ({
  className = '',
  size = 36,
  variant = 'horizontal',
  theme = 'auto',
  showSubtitle = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const navyColor = theme === 'dark' ? '#FFFFFF' : '#081225';
  const cyanColor = '#00A4C6';
  const greyColor = theme === 'dark' ? '#94A3B8' : '#5B6B82';

  // Fallback SVG representation if image file encounters any issue
  const renderSvgFallback = (customWidth?: number | string, customHeight?: number | string) => (
    <svg
      viewBox="0 0 280 230"
      width={customWidth || size}
      height={customHeight || size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Soundwave Bars Left */}
      <rect x="24" y="95" width="9" height="22" rx="4.5" fill={greyColor} />
      <rect x="44" y="76" width="10.5" height="60" rx="5.25" fill={greyColor} />
      <rect x="66" y="52" width="10.5" height="108" rx="5.25" fill={cyanColor} />

      {/* Soundwave Bars Right */}
      <rect x="203" y="52" width="10.5" height="108" rx="5.25" fill={cyanColor} />
      <rect x="225" y="76" width="10.5" height="60" rx="5.25" fill={greyColor} />
      <rect x="247" y="95" width="9" height="22" rx="4.5" fill={greyColor} />

      {/* Centerpiece Modern 'S' */}
      <path
        d="M 186 64 C 180 46, 163 34, 140 34 C 107 34, 91 55, 91 80 C 91 106, 111 120, 137 131 L 165 142 L 185 110 C 165 101, 126 92, 126 78 C 126 67, 134 58, 144 58 C 157 58, 165 67, 168 76 Z"
        fill={navyColor}
      />
      <path
        d="M 165 142 L 137 131 L 112 168 C 130 178, 161 185, 161 197 C 161 206, 151 213, 138 213 C 120 213, 108 200, 106 186 L 89 196 L 93 203 C 100 224, 118 236, 142 236 C 174 236, 192 216, 192 192 C 192 168, 174 154, 156 142 Z"
        fill={cyanColor}
      />
    </svg>
  );

  // 1. VARIANT: ICON ONLY
  if (variant === 'icon') {
    const dim = typeof size === 'number' ? `${size}px` : size;
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {!imgError ? (
          <img
            src={APP_IMAGES.swarakuOfficialIcon || '/images/swaraku_icon.png'}
            alt="Logo SWARAKU"
            style={{ width: dim, height: dim }}
            className="object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          renderSvgFallback()
        )}
      </div>
    );
  }

  // 2. VARIANT: FULL (OFFICIAL SQUARE LOGO PHOTO EMBLEM + WORDMARK)
  if (variant === 'full') {
    const numSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 80;
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        {!imgError ? (
          <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-100 flex items-center justify-center">
            <img
              src={APP_IMAGES.swarakuOfficialLogo || '/images/swaraku_logo.png'}
              alt="Logo Resmi SWARAKU"
              style={{ width: `${numSize}px`, height: `${numSize}px` }}
              className="object-contain"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <>
            {renderSvgFallback(numSize, numSize * 0.8)}
            <div className="mt-2 flex flex-col items-center">
              <span
                className="font-black tracking-[0.2em] uppercase leading-none"
                style={{
                  color: navyColor,
                  fontSize: `${Math.max(16, numSize * 0.28)}px`,
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
              >
                SWARAKU
              </span>
            </div>
          </>
        )}
        {showSubtitle && (
          <span className="text-[9px] tracking-normal uppercase font-semibold text-slate-400 mt-1 text-center max-w-[220px] leading-tight">
            Sistem Wilayah Analisis Rekapitulasi Angka Kemenangan Utama
          </span>
        )}
      </div>
    );
  }

  // 3. VARIANT: HORIZONTAL (LOGO EMBLEM MARK LEFT + SWARAKU TEXT RIGHT)
  const imgSize = typeof size === 'number' ? size : 36;
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className="shrink-0 flex items-center justify-center bg-transparent">
        {!imgError ? (
          <img
            src={APP_IMAGES.swarakuOfficialIcon || '/images/swaraku_icon.png'}
            alt="SWARAKU"
            style={{ width: `${imgSize}px`, height: `${imgSize}px` }}
            className="object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          renderSvgFallback(imgSize, imgSize)
        )}
      </div>
      <div className="flex flex-col">
        <span
          className="font-black tracking-[0.14em] uppercase leading-tight"
          style={{
            color: navyColor,
            fontSize: typeof size === 'number' ? `${Math.max(14, size * 0.52)}px` : '1.15rem',
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          SWARAKU
        </span>
        {showSubtitle && (
          <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase -mt-0.5">
            Portal Pemenangan
          </span>
        )}
      </div>
    </div>
  );
};

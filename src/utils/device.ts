import { DeviceOS } from '../types/vore';

/**
 * Robustly detect the user's actual device OS
 */
export function detectActualDevice(): 'android' | 'ios' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const ua = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() || '';

  // 1. Detect iOS (iPhone, iPad, iPod, including iPadOS desktop userAgent)
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (platform.includes('mac') && window.navigator.maxTouchPoints > 1);

  if (isIOS) return 'ios';

  // 2. Detect Android
  const isAndroid = /android/.test(ua);
  if (isAndroid) return 'android';

  // 3. Otherwise Desktop (Windows, Mac, Linux, ChromeOS)
  return 'desktop';
}

/**
 * Check if the app is currently running in standalone PWA / App mode
 */
export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const isMatch = window.matchMedia('(display-mode: standalone)').matches;
  const isNav = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const urlParams = new URLSearchParams(window.location.search);
  const isUrlApp = urlParams.get('mode') === 'app' || urlParams.get('app') === 'true';

  return isMatch || isNav || isUrlApp;
}

/**
 * Get device name for friendly Indonesian display
 */
export function getDeviceDisplayName(os: DeviceOS): string {
  switch (os) {
    case 'android':
      return 'Android (HP / Tablet)';
    case 'ios':
      return 'iOS (iPhone / iPad)';
    case 'desktop':
    case 'responsive':
      return 'Desktop (Laptop / PC)';
    default:
      return 'Perangkat Anda';
  }
}

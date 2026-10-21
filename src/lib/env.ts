// In-app browsers of social apps block downloads and file sharing, which is where many users open links from.
export function inAppBrowser(): string | null {
  const ua = navigator.userAgent;
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook';
  if (/musical_ly|TikTok|BytedanceWebview/i.test(ua)) return 'TikTok';
  if (/Line\//i.test(ua)) return 'LINE';
  if (/Twitter/i.test(ua)) return 'X';
  if (/; wv\)/.test(ua) && /Android/.test(ua)) return 'aplikasi';
  return null;
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

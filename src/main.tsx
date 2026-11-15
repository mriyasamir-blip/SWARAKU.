import '@vitejs/plugin-react/preamble';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Google Maps Platform Client-Side Quota & Auth Failure Listener (Demo/GHP Key Case A)
(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  window.dispatchEvent(new CustomEvent('gmp-map-error', { detail: { reason: 'gm_authFailure' } }));
};

const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    window.dispatchEvent(new CustomEvent('gmp-map-error', { detail: { reason: 'quota' } }));
  } else if (
    msg.includes('InvalidKeyMapError') ||
    msg.includes('RefererNotAllowedMapError') ||
    msg.includes('BillingNotEnabledMapError') ||
    msg.includes('ApiNotActivatedMapError') ||
    msg.includes('LegacyApiNotActivatedMapError') ||
    msg.includes('ExpiredKeyMapError') ||
    msg.includes('NoApiKeys')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-map-error', { detail: { reason: msg } }));
  }
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

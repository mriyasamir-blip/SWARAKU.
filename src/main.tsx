import '@vitejs/plugin-react/preamble';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

export type MapsErrorCode =
  | 'referer_not_allowed'
  | 'billing_not_enabled'
  | 'api_not_activated'
  | 'invalid_key'
  | 'expired_key'
  | 'no_api_keys'
  | 'project_error'
  | 'quota_exceeded'
  | 'auth_failure';

interface GlobalMapsErrorState {
  code: MapsErrorCode;
  rawMessage: string;
  hostname: string;
  origin: string;
}

declare global {
  interface Window {
    gm_authFailure?: () => void;
    __SWARAKU_MAPS_ERROR__?: GlobalMapsErrorState;
  }
}

const NON_QUOTA_CONFIG_ERRORS = new Set<MapsErrorCode>([
  'referer_not_allowed',
  'api_not_activated',
  'invalid_key',
  'expired_key',
  'no_api_keys',
  'project_error',
]);

function recordMapsError(code: MapsErrorCode, rawMessage: string) {
  const existing = window.__SWARAKU_MAPS_ERROR__;
  // Jangan timpa error spesifik (misalnya referer_not_allowed) dengan auth_failure generik
  if (code === 'auth_failure' && existing && existing.code !== 'auth_failure') {
    return;
  }
  const detail: GlobalMapsErrorState = {
    code,
    rawMessage,
    hostname: typeof window !== 'undefined' ? window.location.hostname : '',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  };
  window.__SWARAKU_MAPS_ERROR__ = detail;
  window.dispatchEvent(new CustomEvent('gmp-map-error', { detail }));
}

// Google Maps Platform Client-Side Quota & Auth Failure Listener (Demo/GHP Key Case A)
window.gm_authFailure = () => {
  const existingCode = window.__SWARAKU_MAPS_ERROR__?.code;
  recordMapsError('auth_failure', 'gm_authFailure');
  if (!existingCode || !NON_QUOTA_CONFIG_ERRORS.has(existingCode)) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    recordMapsError('quota_exceeded', msg);
  } else if (msg.includes('RefererNotAllowedMapError')) {
    recordMapsError('referer_not_allowed', msg);
  } else if (msg.includes('BillingNotEnabledMapError')) {
    recordMapsError('billing_not_enabled', msg);
  } else if (
    msg.includes('ApiNotActivatedMapError') ||
    msg.includes('LegacyApiNotActivatedMapError')
  ) {
    recordMapsError('api_not_activated', msg);
  } else if (msg.includes('InvalidKeyMapError')) {
    recordMapsError('invalid_key', msg);
  } else if (msg.includes('ExpiredKeyMapError')) {
    recordMapsError('expired_key', msg);
  } else if (msg.includes('NoApiKeys')) {
    recordMapsError('no_api_keys', msg);
  } else if (msg.includes('ApiProjectMapError')) {
    recordMapsError('project_error', msg);
  }
};

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let hasReloadedForUpdate = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !hasReloadedForUpdate) {
      hasReloadedForUpdate = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        reg.update().catch(() => {});
      });
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

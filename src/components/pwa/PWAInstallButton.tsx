import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download } from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'compact';
  label?: string;
  onSelectDevice?: (os: 'android' | 'ios' | 'desktop') => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'primary',
  label = 'Download App',
  onSelectDevice,
}) => {
  const { isInstalled } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If running in standalone mode, still allow opening for info or hide
  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap ${
          variant === 'primary'
            ? 'px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs rounded-xl shadow-xs'
            : variant === 'outline'
            ? 'px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-800 text-xs rounded-xl border border-blue-200 shadow-xs'
            : 'p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg text-xs'
        } ${className}`}
        title="Pasang Swaraku sebagai Aplikasi PWA"
      >
        <Download className="w-3.5 h-3.5 text-current shrink-0" />
        <span className="truncate">{isInstalled ? 'Terpasang' : label}</span>
      </button>

      <PWAInstallModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelectDevice={onSelectDevice}
      />
    </>
  );
};

import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock } from 'lucide-react';

interface RealtimeClockBannerProps {
  variant?: 'light' | 'hero';
  className?: string;
}

function getIndonesiaTimeZoneLabel(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset();
  if (offsetMinutes === 420) return 'WIB';
  if (offsetMinutes === 480) return 'WITA';
  if (offsetMinutes === 540) return 'WIT';
  try {
    const parts = new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value;
    return tzPart || 'WIB';
  } catch {
    return 'WIB';
  }
}

export const RealtimeClockBanner: React.FC<RealtimeClockBannerProps> = ({
  variant = 'light',
  className = '',
}) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const tzLabel = getIndonesiaTimeZoneLabel(now);

  if (variant === 'hero') {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-white ${className}`}
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-50">
          <CalendarDays className="w-4 h-4 text-blue-200 shrink-0" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono tabular-nums text-sm sm:text-base font-extrabold tracking-tight">
          <Clock className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{formattedTime}</span>
          <span className="text-[11px] font-bold text-blue-200">{tzLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <CalendarDays className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 leading-tight">
            Tanggal Hari Ini
          </p>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
            {formattedDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white shrink-0">
        <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-mono tabular-nums text-sm sm:text-base font-extrabold tracking-wider">
          {formattedTime}
        </span>
        <span className="text-[11px] font-bold text-slate-300">{tzLabel}</span>
      </div>
    </div>
  );
};

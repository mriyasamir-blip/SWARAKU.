import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, MapPin, Search, X } from 'lucide-react';
import {
  getKecamatanByKota,
  getKelurahanByKecamatan,
  getKotaNames,
} from '../../data/wilayahIndonesia';

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  disabled?: boolean;
  required?: boolean;
  allowCustom?: boolean;
  onChange: (val: string) => void;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  placeholder,
  value,
  options,
  disabled = false,
  required = false,
  allowCustom = true,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query]);

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some(
    (o) => o.toLowerCase() === trimmedQuery.toLowerCase()
  );

  return (
    <div ref={wrapperRef} className="relative space-y-1">
      <label className="block text-xs font-bold text-slate-700">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
            setQuery('');
          }
        }}
        className={`w-full min-h-[42px] px-3 py-2 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-white border-slate-300 text-slate-900 hover:border-cyan-500 cursor-pointer'
        }`}
      >
        <span className={`truncate ${value ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onChange('');
                }
              }}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              aria-label={`Hapus pilihan ${label}`}
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 mt-1 z-40 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Cari ${label.toLowerCase()}...`}
              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
            {filtered.map((opt) => {
              const active = opt.toLowerCase() === value.toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    active
                      ? 'bg-cyan-50 text-cyan-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span>{opt}</span>
                  {active && <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                </button>
              );
            })}

            {filtered.length === 0 && !allowCustom && (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">
                Tidak ditemukan.
              </div>
            )}

            {allowCustom && trimmedQuery.length >= 2 && !hasExactMatch && (
              <button
                type="button"
                onClick={() => {
                  onChange(trimmedQuery);
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full px-3 py-2.5 text-left text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold cursor-pointer"
              >
                + Gunakan "{trimmedQuery}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface WilayahValue {
  kota: string;
  kecamatan: string;
  kelurahan: string;
}

interface WilayahSelectorProps {
  value: WilayahValue;
  onChange: (next: WilayahValue) => void;
  required?: boolean;
  compact?: boolean;
}

export const WilayahSelector: React.FC<WilayahSelectorProps> = ({
  value,
  onChange,
  required = true,
  compact = false,
}) => {
  const kotaOptions = useMemo(() => getKotaNames(), []);
  const kecamatanOptions = useMemo(
    () => (value.kota ? getKecamatanByKota(value.kota) : []),
    [value.kota]
  );
  const kelurahanOptions = useMemo(
    () => (value.kota && value.kecamatan ? getKelurahanByKecamatan(value.kota, value.kecamatan) : []),
    [value.kota, value.kecamatan]
  );

  return (
    <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-3 gap-2.5' : 'sm:grid-cols-3 gap-3'}`}>
      <SearchableDropdown
        label="Kota / Kabupaten"
        placeholder="Pilih atau cari Kota..."
        value={value.kota}
        options={kotaOptions}
        required={required}
        onChange={(kota) => onChange({ kota, kecamatan: '', kelurahan: '' })}
      />

      <SearchableDropdown
        label="Kecamatan"
        placeholder={value.kota ? 'Pilih atau cari Kecamatan...' : 'Pilih Kota dulu'}
        value={value.kecamatan}
        options={kecamatanOptions}
        disabled={!value.kota}
        required={required}
        onChange={(kecamatan) => onChange({ ...value, kecamatan, kelurahan: '' })}
      />

      <SearchableDropdown
        label="Kelurahan"
        placeholder={value.kecamatan ? 'Pilih atau cari Kelurahan...' : 'Pilih Kecamatan dulu'}
        value={value.kelurahan}
        options={kelurahanOptions}
        disabled={!value.kecamatan}
        required={required}
        onChange={(kelurahan) => onChange({ ...value, kelurahan })}
      />
    </div>
  );
};

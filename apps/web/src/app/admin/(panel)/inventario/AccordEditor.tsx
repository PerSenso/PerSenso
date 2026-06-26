'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { AccordItem } from '@persenso/shared';

const ACCORD_COLORS: Record<string, string> = {
  'aromático':        '#4E9E8E',
  'amaderado':        '#8B6343',
  'cítrico':          '#A8B742',
  'floral':           '#C4688F',
  'frutal':           '#E07B39',
  'afrutado':         '#D4736B',
  'especiado':        '#D4704A',
  'especiado suave':  '#C4905A',
  'cálido especiado': '#C4573A',
  'terrosos':         '#7A6E5F',
  'terroso':          '#7A6E5F',
  'lavanda':          '#8B6BB1',
  'ámbar':            '#C49A3C',
  'pachulí':          '#6B7A3C',
  'fresco':           '#5B9BB8',
  'fresco especiado': '#5B8A9E',
  'marino':           '#3B7EA6',
  'musgo':            '#5A7A5B',
  'vainilla':         '#C4A05E',
  'almizclado':       '#A08090',
  'verde':            '#5A9E5A',
  'ahumado':          '#7A7A7A',
  'dulce':            '#C47A8A',
  'balsámico':        '#8B5E3C',
  'polvoso':          '#B8A890',
  'oriental':         '#9B5C2E',
  'gourmand':         '#C48A5E',
};

const SUGGESTIONS = Object.keys(ACCORD_COLORS);

function getColor(name: string): string {
  const key = name.toLowerCase().trim();
  return ACCORD_COLORS[key] ?? '#C9A84C';
}

interface AccordEditorProps {
  accords: AccordItem[];
  onChange: (accords: AccordItem[]) => void;
}

export function AccordEditor({ accords, onChange }: AccordEditorProps) {
  const [name, setName] = useState('');
  const [intensity, setIntensity] = useState(80);

  const sorted = [...accords].sort((a, b) => b.intensity - a.intensity);

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (accords.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...accords, { name: trimmed, intensity, color: getColor(trimmed) }]);
    setName('');
    setIntensity(80);
  };

  const remove = (n: string) => onChange(accords.filter((a) => a.name !== n));

  const labelCls = 'text-[10px] font-bold uppercase tracking-widest mb-1 block';
  const fieldStyle = {
    background: 'var(--ps-input-bg)',
    border: '1px solid var(--ps-border)',
    color: 'var(--ps-input-text)',
  };

  return (
    <div className="space-y-3">
      <p className={labelCls} style={{ color: 'var(--ps-text-muted)' }}>Acordes olfativos</p>

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <p className="text-[10px] mb-1" style={{ color: 'var(--ps-text-muted)' }}>Nombre del acorde</p>
          <input
            list="accord-suggestions"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder="ej. aromático, floral…"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={fieldStyle}
          />
          <datalist id="accord-suggestions">
            {SUGGESTIONS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!name.trim()}
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-40 btn-gold"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <p className="text-[10px]" style={{ color: 'var(--ps-text-muted)' }}>Intensidad</p>
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--ps-gold)' }}>{intensity}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-full accent-[#C9A84C] h-1.5 rounded-full cursor-pointer"
          style={{ background: `linear-gradient(to right, var(--ps-gold) ${intensity}%, var(--ps-border) ${intensity}%)` }}
        />
      </div>

      {/* Preview color */}
      {name.trim() && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: getColor(name) }} />
          <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>
            Color: <span className="font-medium" style={{ color: 'var(--ps-text)' }}>{getColor(name) === '#C9A84C' ? 'dorado (genérico)' : 'asignado automáticamente'}</span>
          </span>
        </div>
      )}

      {/* Bars preview */}
      {sorted.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
            Acordes principales
          </p>
          {sorted.map((a) => (
            <div key={a.name} className="flex items-center gap-2 group">
              <div className="flex-1 relative h-7 rounded-lg overflow-hidden" style={{ background: 'var(--ps-surface)' }}>
                <div
                  className="h-full rounded-lg flex items-center px-3 transition-all"
                  style={{ width: `${a.intensity}%`, background: a.color, minWidth: 60 }}
                >
                  <span className="text-xs font-medium text-white truncate">{a.name}</span>
                </div>
              </div>
              <span className="text-xs tabular-nums w-8 text-right flex-shrink-0" style={{ color: 'var(--ps-text-muted)' }}>
                {a.intensity}%
              </span>
              <button
                type="button"
                onClick={() => remove(a.name)}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--ps-red)' }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

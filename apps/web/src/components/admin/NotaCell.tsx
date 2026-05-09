'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { AdminModal } from './AdminModal';

interface NotaCellProps {
  text: string | null | undefined;
  maxLength?: number;
}

export function NotaCell({ text, maxLength = 45 }: NotaCellProps) {
  const [open, setOpen] = useState(false);

  if (!text) {
    return <span style={{ color: 'var(--ps-text-muted)' }}>—</span>;
  }

  const isLong = text.length > maxLength;
  const preview = isLong ? text.slice(0, maxLength) + '…' : text;

  return (
    <>
      <div className="flex items-center gap-1.5">
        <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>
          {preview}
        </span>
        {isLong && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="flex-shrink-0 p-0.5 rounded transition-colors"
            style={{ color: 'var(--ps-text-muted)' }}
            title="Ver nota completa"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <AdminModal title="Nota" onClose={() => setOpen(false)} maxWidth="max-w-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ps-text)' }}>
            {text}
          </p>
        </AdminModal>
      )}
    </>
  );
}

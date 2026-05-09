'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { formatId } from '@/lib/id-format';

interface IdBadgeProps {
  id: string;
  /** Show full UUID in tooltip, short in badge. Default true. */
  showFull?: boolean;
}

export function IdBadge({ id, showFull = true }: IdBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={showFull ? id : undefined}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider transition-colors group"
      style={{
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.2)',
        color: 'var(--ps-text-muted)',
      }}
    >
      {formatId(id)}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        {copied
          ? <Check className="w-2.5 h-2.5" style={{ color: 'var(--ps-green)' }} />
          : <Copy className="w-2.5 h-2.5" />
        }
      </span>
    </button>
  );
}

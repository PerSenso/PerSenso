'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface AdminModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function AdminModal({ title, onClose, children, maxWidth = 'max-w-md' }: AdminModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={`card-persenso w-full ${maxWidth} relative z-10 flex flex-col`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--ps-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-0.5 h-5 rounded-full" style={{ background: 'var(--ps-gold)' }} />
            <h2 className="font-display text-base font-semibold" style={{ color: 'var(--ps-text)' }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface-hover)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/* Shared field style helpers — importar en cada modal */
export const fieldCls = 'w-full px-3 py-2.5 rounded-lg text-sm transition-colors';
export const fieldStyle = {
  background: 'var(--ps-input-bg)',
  border: '1px solid var(--ps-input-border)',
  color: 'var(--ps-input-text)',
};
export const labelCls = 'block text-[10px] font-bold uppercase tracking-widest mb-1.5';
export const labelStyle = { color: 'var(--ps-text-muted)' };

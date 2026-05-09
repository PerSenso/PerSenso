'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  color?: 'gold' | 'green' | 'red' | 'blue';
}

const colorMap = {
  gold: { bg: 'rgba(201, 168, 76, 0.08)', icon: 'var(--ps-gold)', border: 'rgba(201, 168, 76, 0.15)' },
  green: { bg: 'rgba(76, 175, 125, 0.08)', icon: 'var(--ps-green)', border: 'rgba(76, 175, 125, 0.15)' },
  red: { bg: 'rgba(224, 92, 92, 0.08)', icon: 'var(--ps-red)', border: 'rgba(224, 92, 92, 0.15)' },
  blue: { bg: 'rgba(92, 159, 224, 0.08)', icon: 'var(--ps-blue)', border: 'rgba(92, 159, 224, 0.15)' },
};

export function AdminStatCard({ title, value, subtitle, icon: Icon, trend, color = 'gold' }: AdminStatCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-persenso p-5 relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--ps-text-muted)' }}
          >
            {title}
          </p>
          <p className="text-2xl font-semibold" style={{ color: 'var(--ps-text)' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: 'var(--ps-text-muted)' }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p
              className="text-xs mt-1 font-medium"
              style={{ color: trend.positive ? 'var(--ps-green)' : 'var(--ps-red)' }}
            >
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
        >
          <Icon className="w-5 h-5" style={{ color: colors.icon }} />
        </div>
      </div>
    </motion.div>
  );
}

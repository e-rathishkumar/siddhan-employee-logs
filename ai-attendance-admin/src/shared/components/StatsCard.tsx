import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: { value: number; label: string };
  color?: 'indigo' | 'green' | 'red' | 'yellow' | 'blue';
  className?: string;
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  blue: 'bg-blue-50 text-blue-600',
};

export function StatsCard({ title, value, icon, change, color = 'indigo', className }: StatsCardProps) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={clsx('mt-1 text-sm', change.value >= 0 ? 'text-green-600' : 'text-red-600')}>
              {change.value >= 0 ? '↑' : '↓'} {Math.abs(change.value)}% {change.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-lg', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

import { clsx } from 'clsx';

interface BadgeProps {
  children: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

const variants = {
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-800',
};

export function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {children}
    </span>
  );
}

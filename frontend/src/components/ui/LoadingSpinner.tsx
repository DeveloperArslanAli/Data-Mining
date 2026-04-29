import React from 'react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap: Record<string, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className, label }) => {
  return (
    <div className={clsx('flex items-center gap-2', className)} role="status" aria-live="polite">
      <div
        className={clsx(
          'animate-spin rounded-full border-blue-500 border-t-transparent',
          sizeMap[size]
        )}
      />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
};

export default LoadingSpinner;

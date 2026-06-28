import {type ReactNode} from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  sm: 'p-2 sm:p-3',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export default function Card({children, className = '', padding = 'md'}: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-border
        bg-surface-elevated
        ${paddingStyles[padding]}
        shadow-sm
        dark:shadow-none
        ${className}
      `}
    >
      {children}
    </div>
  );
}


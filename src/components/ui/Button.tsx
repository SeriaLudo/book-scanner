import {type ReactNode} from 'react';
import {Button as AriaButton, type ButtonProps as AriaButtonProps} from 'react-aria-components';

interface ButtonProps extends AriaButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: ReactNode;
}

const variantStyles = {
  primary:
    'bg-accent text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
  secondary:
    'bg-surface border border-border text-text-primary hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
  ghost:
    'bg-transparent text-text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
  danger:
    'bg-error text-white hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2',
};

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      className={`
        px-4 py-2 rounded-lg font-medium
        min-h-[44px] md:min-h-[40px]
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-150
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </AriaButton>
  );
}

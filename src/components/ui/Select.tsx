import {
  Select as AriaSelect,
  SelectValue,
  Button as SelectButton,
  Popover,
  ListBox,
  ListBoxItem,
  Label,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components';
import {type ReactNode} from 'react';

interface SelectProps extends Omit<AriaSelectProps, 'children'> {
  label?: string;
  placeholder?: string;
  children: ReactNode;
  errorMessage?: string;
}

export default function Select({
  label,
  placeholder = 'Select...',
  children,
  errorMessage,
  className = '',
  ...props
}: SelectProps) {
  return (
    <AriaSelect className={`w-full ${className}`} {...props}>
      {label && (
        <Label className="block text-sm font-medium text-text-primary mb-1">{label}</Label>
      )}
      <SelectButton
        className={`
          w-full px-3 py-2 rounded-md border border-border
          bg-surface text-text-primary
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          min-h-[44px] md:min-h-[40px]
          transition-colors duration-150
          flex items-center justify-between
        `}
      >
        <SelectValue placeholder={placeholder} />
        <span aria-hidden="true" className="text-text-tertiary">
          ▼
        </span>
      </SelectButton>
      <Popover className="w-[--trigger-width]">
        <ListBox className="bg-surface-elevated border border-border rounded-md shadow-lg p-1 max-h-60 overflow-auto">
          {children}
        </ListBox>
      </Popover>
      {errorMessage && <div className="mt-1 text-sm text-error">{errorMessage}</div>}
    </AriaSelect>
  );
}

export function SelectItem({children, ...props}: {children: ReactNode; value: string}) {
  return (
    <ListBoxItem
      className={`
        px-3 py-2 rounded cursor-pointer
        text-text-primary
        focus:bg-accent focus:text-white
        selected:bg-accent selected:text-white
        hover:bg-surface
        transition-colors duration-150
      `}
      {...props}
    >
      {children}
    </ListBoxItem>
  );
}


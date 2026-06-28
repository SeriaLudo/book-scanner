import {
  TextField as AriaTextField,
  Input,
  Label,
  FieldError,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import {type ReactNode} from 'react';

interface TextFieldProps extends AriaTextFieldProps {
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  description?: ReactNode;
}

export default function TextField({
  label,
  placeholder,
  errorMessage,
  description,
  className = '',
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField className={`w-full ${className}`} {...props}>
      {label && (
        <Label className="block text-sm font-medium text-text-primary mb-1">{label}</Label>
      )}
      <Input
        placeholder={placeholder}
        className={`
          w-full px-3 py-2 rounded-md border border-border
          bg-surface text-text-primary
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
          placeholder:text-text-tertiary
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
        `}
      />
      {description && <div className="mt-1 text-sm text-text-secondary">{description}</div>}
      <FieldError className="mt-1 text-sm text-error">{errorMessage}</FieldError>
    </AriaTextField>
  );
}


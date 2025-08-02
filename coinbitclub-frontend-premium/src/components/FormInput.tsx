import React from 'react';
import { InputHTMLAttributes, forwardRef } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, errorMessage, disabled, className, ...props }, ref) => (
    <div>
      <input
        ref={ref}
        className={`
          w-full rounded border bg-gray-900 p-2 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400
          ${error ? 'border-red-500' : 'border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className || ''}
        `}
        aria-invalid={error}
        aria-disabled={disabled}
        disabled={disabled}
        {...props}
      />
      {error && errorMessage && (
        <span className="mt-1 block text-xs text-red-500">{errorMessage}</span>
      )}
    </div>
  )
);

FormInput.displayName = 'FormInput';

export default FormInput;




import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, errorMessage, disabled, ...props }, ref) => (
    <div>
      <input
        ref={ref}
        className={clsx(
          'w-full rounded border bg-gray-900 p-2 transition-all focus:outline-none focus:ring-2 focus:ring-accent',
          {
            'border-red-500': error,
            'opacity-50 cursor-not-allowed': disabled,
          }
        )}
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

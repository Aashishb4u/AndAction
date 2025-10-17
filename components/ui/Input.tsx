'use client';

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      leftIcon,
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = `
      w-full md:px-4 px-3 py-3 placeholder-text-gray
      border rounded-lg transition-all duration-200
      focus:outline-none focus:ring-0 focus:border-primary-pink
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantClasses = {
      default: `
        bg-[#1B1B1B] border-border-color
        hover:border-[#404040] focus:border-primary-pink
      `,
      filled: `
        bg-card border-border-color
        hover:border-[#404040] focus:border-primary-pink focus:bg-card
      `,
    };

    const errorClasses = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
      : '';

    const iconPadding = leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block section-text mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-gray">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              ${baseClasses}
              ${variantClasses[variant]}
              ${errorClasses}
              ${iconPadding}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-gray">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-2 text-sm text-text-gray">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Password Input Component
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      showToggle = true,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const rightIcon = showToggle ? (
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="text-text-gray hover:text-white transition-colors duration-200 focus:outline-none"
        tabIndex={-1}
      >
        {showPassword ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    ) : undefined;

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={rightIcon}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default Input;
export { PasswordInput };

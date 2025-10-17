'use client';

import React, { forwardRef } from 'react';

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      className = '',
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || `date-input-${Math.random().toString(36).substr(2, 9)}`;

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
          <input
            ref={ref}
            id={inputId}
            type="date"
            onChange={onChange}
            className={`
              ${baseClasses}
              ${variantClasses[variant]}
              ${errorClasses}
              ${className}
            `}
            {...props}
          />
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

DateInput.displayName = 'DateInput';

export default DateInput;

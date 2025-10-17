'use client';

import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
  rightIcon?: React.ReactNode;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      rightIcon,
      className = '',
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 11)}`;

    const baseClasses = `
      w-full md:px-4 px-3 py-3 text-white placeholder-text-gray
      border rounded-lg transition-all duration-200
      focus:outline-none focus:ring-0 focus:border-primary-pink
      disabled:opacity-50 disabled:cursor-not-allowed
      md:text-base text-sm resize-none
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
            htmlFor={textareaId}
            className="block text-sm font-medium text-white mb-2"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            className={`
              ${baseClasses}
              ${variantClasses[variant]}
              ${errorClasses}
              ${rightIcon ? 'pr-12' : ''}
              ${className}
            `}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-4 top-4 text-text-gray">
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

Textarea.displayName = 'Textarea';

export default Textarea;

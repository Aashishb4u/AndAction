'use client';
import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

export interface DateInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
  disabledDates?: Date[];
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
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
      value,
      disabledDates = [],
      placeholder = 'Select a date',
      disabled = false,
      required = false,
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
        
        <div className="relative date-picker-wrapper">
          <DatePicker
            selected={value}
            onChange={onChange}
            excludeDates={disabledDates}
            minDate={new Date()}
            placeholderText={placeholder}
            disabled={disabled}
            id={inputId}
            className={`
              ${baseClasses}
              ${variantClasses[variant]}
              ${errorClasses}
              ${className}
            `}
            wrapperClassName="w-full"
            calendarClassName="custom-datepicker"
            dateFormat="MMM dd, yyyy"
            showPopperArrow={false}
            required={required}
          />
          <Calendar 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
          />
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-text-gray">{helperText}</p>
        )}

        <style jsx global>{`
          .date-picker-wrapper .react-datepicker-wrapper {
            width: 100%;
          }

          .custom-datepicker {
            background-color: #1B1B1B !important;
            border: 1px solid #404040 !important;
            border-radius: 0.5rem !important;
            font-family: inherit !important;
          }

          .react-datepicker__header {
            background-color: #1B1B1B !important;
            border-bottom: 1px solid #404040 !important;
            padding-top: 1rem !important;
          }

          .react-datepicker__current-month,
          .react-datepicker__day-name {
            color: #ffffff !important;
          }

          .react-datepicker__day {
            color: #ffffff !important;
            border-radius: 0.375rem !important;
          }

          .react-datepicker__day:hover {
            background-color: #2A2A2A !important;
            border-radius: 0.375rem !important;
          }

          .react-datepicker__day--selected {
            background-color: #ff1493 !important;
            color: #ffffff !important;
            font-weight: 600 !important;
          }

          .react-datepicker__day--keyboard-selected {
            background-color: transparent !important;
            color: #ffffff !important;
          }

          .react-datepicker__day--disabled {
            color: #666666 !important;
            text-decoration: line-through !important;
            cursor: not-allowed !important;
          }

          .react-datepicker__day--disabled:hover {
            background-color: transparent !important;
          }

          .react-datepicker__day--today {
            border: 1px solid #ff1493 !important;
            background-color: transparent !important;
            font-weight: normal !important;
          }

          .react-datepicker__day--today.react-datepicker__day--selected {
            background-color: #ff1493 !important;
          }

          .react-datepicker__navigation {
            top: 1rem !important;
          }

          .react-datepicker__navigation-icon::before {
            border-color: #ffffff !important;
          }

          .react-datepicker__navigation:hover *::before {
            border-color: #ff1493 !important;
          }

          .react-datepicker__month {
            margin: 0.5rem !important;
          }

          .react-datepicker__triangle {
            display: none !important;
          }
        `}</style>
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';

export default DateInput;

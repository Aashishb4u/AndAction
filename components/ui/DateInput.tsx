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
  value?: string | null;
  onChange?: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  disabledDates?: Date[];
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
      placeholder = 'DD / MM / YYYY',
      disabled = false,
      required = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || `date-input-${Math.random().toString(36).substr(2, 9)}`;

    const selectedDate =
      value && !isNaN(Date.parse(value))
        ? new Date(value + "T00:00:00")
        : null;

    const handleChangeRaw = (e: any) => {
      if (!e?.target || typeof e.target.value !== "string") return;

      let val = e.target.value.replace(/\D/g, "");

      if (val.length >= 3 && val.length <= 4) {
        val = val.slice(0, 2) + "/" + val.slice(2);
      } else if (val.length >= 5) {
        val = val.slice(0, 2) + "/" + val.slice(2, 4) + "/" + val.slice(4, 8);
      }

      e.target.value = val;

      if (val.length === 10) {
        const [dd, mm, yyyy] = val.split("/");
        onChange?.(`${yyyy}-${mm}-${dd}`);
      }
    };




    const handlePickerChange = (date: Date | null) => {
      if (!date) return onChange?.("");

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");

      const formatted = `${yyyy}-${mm}-${dd}`;

      onChange?.(formatted);
    };

    const baseClasses = `
      w-full md:px-4 px-3 py-3 placeholder-text-gray
      border rounded-lg transition-all duration-200
      focus:outline-none focus:ring-0 focus:border-primary-pink
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantClasses = {
      default: `bg-[#1B1B1B] border-border-color`,
      filled: `bg-card border-border-color`,
    };

    const errorClasses = error ? 'border-red-500' : '';
    const allClasses = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${className}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block section-text mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          <DatePicker
            selected={selectedDate}
            onChange={handlePickerChange}
            onChangeRaw={handleChangeRaw}
            placeholderText={placeholder}
            disabled={disabled}
            id={inputId}
            className={allClasses}
            dateFormat="dd/MM/yyyy"
            wrapperClassName="w-full"
            required={required}
          />

          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm text-text-gray">{helperText}</p>
        )}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
export default DateInput;

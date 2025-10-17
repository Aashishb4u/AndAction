import React from 'react';
import { ButtonProps } from '@/types';

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background btn1';

  const variantClasses = {
    primary: 'gradient-button text-white hover:shadow-lg',
    secondary: 'bg-card hover:bg-[#404040] text-white border border-border-color',
    outline: 'border-2 border-primary-pink text-primary-pink hover:bg-primary-pink hover:text-white',
    ghost: 'text-text-light-gray hover:text-white hover:bg-card',
  };

  const sizeClasses = {
    xs: 'px-2 py-2 text-xs',
    sm: 'px-4 py-2 btn2',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 md:py-4 py-3 text-lg',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    }`;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;

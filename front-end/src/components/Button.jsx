import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  icon: Icon = null,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${
        fullWidth ? 'w-full' : ''
      } ${isLoading ? 'is-loading' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {Icon && !isLoading && <Icon className="btn-icon" />}
      {isLoading ? 'Chargement...' : children}
    </button>
  );
};

export default Button;

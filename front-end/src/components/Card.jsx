import React from 'react';
import './Card.css';

const Card = ({
  children,
  variant = 'default',
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`card card-${variant} ${hoverable ? 'is-hoverable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardImage = ({ src, alt = '', className = '' }) => (
  <div className={`card-image ${className}`}>
    <img src={src} alt={alt} />
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>{children}</div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`card-footer ${className}`}>{children}</div>
);

export default Card;

import React from 'react';

const Loader = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
    xl: 'h-16 w-16 border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`${sizeClasses[size] || sizeClasses['md']} border-t-2 border-primary-500 border-solid rounded-full animate-spin`}
        aria-label="Loading..."
      />
    </div>
  );
};

export default Loader;

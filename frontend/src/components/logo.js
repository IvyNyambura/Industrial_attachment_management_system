import React from 'react';

const Logo = ({ size = 'medium', style = {} }) => {
  const sizes = {
    small: { width: '40px', height: '40px' },
    medium: { width: '60px', height: '60px' },
    large: { width: '100px', height: '100px' }
  };

  return (
    <img 
      src="/logo.png" 
      alt="MUT IAMS Logo" 
      style={{
        ...sizes[size],
        objectFit: 'contain',
        ...style
      }}
      onError={(e) => {
        // Fallback if logo doesn't exist
        e.target.style.display = 'none';
      }}
    />
  );
};

export default Logo;
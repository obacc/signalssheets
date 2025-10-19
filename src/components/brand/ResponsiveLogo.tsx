import React from 'react';
import Logo from './Logo';

interface ResponsiveLogoProps {
  className?: string;
}

const ResponsiveLogo: React.FC<ResponsiveLogoProps> = ({ className = '' }) => {
  return (
    <>
      {/* Desktop: Logo completo */}
      <div className={`hidden lg:block ${className}`}>
        <Logo variant="full" size="md" />
      </div>
      
      {/* Tablet: Logo completo más pequeño */}
      <div className={`hidden md:block lg:hidden ${className}`}>
        <Logo variant="full" size="sm" />
      </div>
      
      {/* Mobile: Solo isotipo */}
      <div className={`block md:hidden ${className}`}>
        <Logo variant="compact" size="sm" />
      </div>
    </>
  );
};

export default ResponsiveLogo;

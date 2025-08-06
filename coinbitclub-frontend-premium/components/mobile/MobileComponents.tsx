import React from 'react';
import { FiX, FiMenu } from 'react-icons/fi';

interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  title?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ 
  isOpen, 
  onToggle, 
  children, 
  title = "⚡ CoinBitClub" 
}) => {
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-black/90 backdrop-blur-sm border-2 border-yellow-400/50 rounded-xl text-yellow-400 hover:text-pink-400 transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-black/95 backdrop-blur-sm border-r border-yellow-400/30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-b border-yellow-400/30">
          <h1 className="text-xl font-bold text-yellow-400">{title}</h1>
          <button
            onClick={onToggle}
            className="text-yellow-400 hover:text-pink-400 p-2"
            aria-label="Close menu"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation Content */}
        <div className="flex-1 overflow-y-auto py-4 px-4">
          {children}
        </div>
      </div>
    </>
  );
};

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const MobileCard: React.FC<MobileCardProps> = ({ 
  children, 
  className = '', 
  padding = 'md' 
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`bg-black/90 backdrop-blur-sm border-2 border-yellow-400/50 rounded-xl shadow-[0_0_30px_rgba(255,215,0,0.3)] ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = ''
}) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  const gridClasses = `grid grid-cols-${cols.mobile} md:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop} ${gapClasses[gap]} ${className}`;

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const MobileInput: React.FC<MobileInputProps> = ({ 
  label, 
  error, 
  icon, 
  fullWidth = true,
  className = '',
  ...props 
}) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-blue-400 text-sm font-bold mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors text-base ${className}`}
        />
      </div>
      {error && (
        <p className="mt-2 text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
};

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const MobileButton: React.FC<MobileButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props 
}) => {
  const variants = {
    primary: 'text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-400',
    secondary: 'text-blue-400 bg-transparent hover:bg-blue-400/10 border-2 border-blue-400/50',
    success: 'text-black bg-green-400 hover:bg-green-300 border-2 border-green-400',
    danger: 'text-red-400 bg-transparent hover:bg-red-400/10 border-2 border-red-400/50'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} rounded-lg transition-all duration-300 font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
      ) : (
        icon && <span>{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const MobileModal: React.FC<MobileModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = 'md'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full ${maxWidthClasses[maxWidth]} bg-black/90 backdrop-blur-sm border-2 border-yellow-400/50 rounded-xl shadow-[0_0_30px_rgba(255,215,0,0.3)] transform transition-all`}>
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-yellow-400/30">
              <h3 className="text-xl font-bold text-yellow-400">{title}</h3>
              <button
                onClick={onClose}
                className="text-red-400 hover:text-pink-400 transition-colors p-2"
                aria-label="Close modal"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MobileTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  scrollable?: boolean;
}

export const MobileTabs: React.FC<MobileTabsProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  scrollable = true 
}) => {
  return (
    <div className={`${scrollable ? 'overflow-x-auto' : ''} -mx-4 px-4 mb-6`}>
      <div className="flex space-x-2 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-bold transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-black bg-yellow-400 shadow-lg'
                : 'text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface MobileAlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

export const MobileAlert: React.FC<MobileAlertProps> = ({ 
  type = 'info',
  title,
  children,
  icon,
  closable = false,
  onClose
}) => {
  const typeClasses = {
    info: 'bg-blue-400/10 border-blue-400/50 text-blue-400',
    success: 'bg-green-400/10 border-green-400/50 text-green-400',
    warning: 'bg-orange-400/10 border-orange-400/50 text-orange-400',
    error: 'bg-red-400/10 border-red-400/50 text-red-400'
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${typeClasses[type]}`}>
      <div className="flex items-start">
        {icon && (
          <div className="flex-shrink-0 mr-3 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1">
          {title && (
            <h4 className="font-bold text-sm mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {closable && onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-3 hover:opacity-70 transition-opacity"
            aria-label="Close alert"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

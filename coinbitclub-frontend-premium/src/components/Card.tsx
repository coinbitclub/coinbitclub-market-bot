import React from 'react';
import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: string;
  subtitle?: string;
  highlight?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, padding = 'md', title, subtitle, highlight = false, children, ...props }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const baseClasses = 'rounded-lg bg-black text-white shadow-sm';
    const hoverClasses = hover ? 'transition-all duration-300 hover:shadow-md hover:scale-[1.02]' : '';
    const highlightClasses = highlight ? 'border-blue-500 shadow-blue-400/20' : 'border-border';
    
    const classes = [baseClasses, hoverClasses, highlightClasses, paddingClasses[padding], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {(title || subtitle) && (
          <div className="mb-4 border-b border-pink-500/30 pb-4">
            {title && <h3 className="text-xl font-semibold text-amber-400 glow-gold">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-blue-400">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    const classes = ['flex flex-col space-y-1.5 p-6', className].filter(Boolean).join(' ');
    
    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => {
    const classes = ['text-2xl font-semibold leading-none tracking-tight', className].filter(Boolean).join(' ');
    
    return (
      <Component
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    const classes = ['text-sm text-muted-foreground', className].filter(Boolean).join(' ');
    
    return (
      <p
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    const classes = ['p-6 pt-0', className].filter(Boolean).join(' ');
    
    return <div ref={ref} className={classes} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    const classes = ['flex items-center p-6 pt-0', className].filter(Boolean).join(' ');
    
    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
export default Card;



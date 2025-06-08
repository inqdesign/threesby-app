import { cn } from '../../lib/utils';

type TagVariant = 'default' | 'outline' | 'secondary';

type TagProps = {
  children: React.ReactNode;
  variant?: TagVariant;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  uppercase?: boolean;
};

export function Tag({
  children,
  variant = 'default',
  className,
  size = 'md',
  uppercase = false,
  ...props
}: TagProps) {
  const baseStyles = 'inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium';
  
  const variantStyles = {
    default: 'bg-[rgb(235,235,235)] text-gray-700',
    outline: 'bg-transparent border border-gray-200 text-gray-700',
    secondary: 'bg-gray-100 text-gray-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        uppercase && 'uppercase tracking-wide',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

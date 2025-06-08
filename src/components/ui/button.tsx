import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-normal transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        {
          'bg-[#252525] text-white hover:bg-[#111111] focus-visible:ring-[#252525]':
            variant === 'default',
          'border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-gray-500':
            variant === 'outline',
          'hover:bg-gray-100 focus-visible:ring-gray-500':
            variant === 'ghost',
          'text-sm px-3 py-1.5': size === 'sm',
          'text-base px-4 py-2': size === 'md',
          'text-lg px-6 py-3': size === 'lg',
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
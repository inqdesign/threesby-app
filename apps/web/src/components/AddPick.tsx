import React from 'react';
import { Globe2, Package, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const addPickVariants = cva(
  "relative aspect-square rounded-lg flex flex-col items-center justify-center transition-colors",
  {
    variants: {
      variant: {
        default: "border border-dashed border-[#9d9b9b] bg-[#f0ffcc] hover:bg-[#e5ffaa] cursor-pointer",
        empty: "bg-[#f3f2ed] cursor-default",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface AddPickProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof addPickVariants> {
  category: 'places' | 'products' | 'books';
  index: number;
  onClick: () => void;
}

export function AddPick({ category, index, onClick, className, variant, ...props }: AddPickProps) {
  return (
    <div
      className={cn(addPickVariants({ variant, className }))}
      onClick={variant === 'default' ? onClick : undefined}
      {...props}
    >
      {variant === 'default' && (
        <>
          <div className="absolute top-2 right-2 px-2 py-1 bg-[#8eff65] dark:bg-[#4a5d3a] rounded-md text-[10px] font-medium text-[#252525] dark:text-[#a0b998]">
            #{String(index + 1).padStart(2, '0')}
          </div>
          {category === 'places' && <Globe2 className="w-8 h-8 text-[#252525]" />}
          {category === 'products' && <Package className="w-8 h-8 text-[#252525]" />}
          {category === 'books' && <BookOpen className="w-8 h-8 text-[#252525]" />}
          <div className="absolute bottom-2 left-2 text-[#252525] font-medium text-sm">
            Add {category === 'products' ? 'Product' : category.slice(0, -1)}
          </div>
        </>
      )}
      
      {variant === 'empty' && (
        <div className="absolute bottom-4 right-4">
          {category === 'places' && <Globe2 className="w-5 h-5 text-[#9d9b9b]" />}
          {category === 'products' && <Package className="w-5 h-5 text-[#9d9b9b]" />}
          {category === 'books' && <BookOpen className="w-5 h-5 text-[#9d9b9b]" />}
        </div>
      )}
    </div>
  );
}
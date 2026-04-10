import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-[7px] text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 font-sans',
  {
    variants: {
      variant: {
        default: 'bg-navy text-white hover:bg-navy-light',
        secondary: 'bg-white text-navy border border-[#dde3ef] hover:bg-[#f8faff]',
        gold: 'bg-gold text-navy font-bold hover:bg-gold-light',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        ghost: 'hover:bg-[#f1f5f9] text-[#475569]',
        link: 'text-navy underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-3.5 py-1.5',
        sm: 'px-2.5 py-1 text-[11.5px] rounded-[5px]',
        lg: 'px-6 py-2.5 text-sm',
        icon: 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

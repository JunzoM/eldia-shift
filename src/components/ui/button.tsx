import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-[7px] text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 font-sans',
  {
    variants: {
      variant: {
        default: 'bg-[rgba(15,32,68,.88)] text-white hover:bg-[rgba(26,50,96,.92)] shadow-sm',
        secondary: 'bg-[rgba(255,255,255,.72)] text-navy border border-[rgba(255,255,255,.85)] backdrop-blur-sm hover:bg-[rgba(255,255,255,.9)]',
        gold: 'bg-gradient-to-br from-gold to-gold-light text-navy font-bold shadow-sm hover:brightness-105',
        danger: 'bg-gradient-to-br from-red-500 to-red-400 text-white hover:brightness-105 shadow-sm',
        ghost: 'hover:bg-[rgba(255,255,255,.6)] text-[#475569]',
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

import { cn } from '@/utilities/ui'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-base font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        clear: '',
        default: 'h-12 px-6 py-3',
        icon: 'h-12 w-12',
        lg: 'h-14 rounded-3xl px-10 text-lg',
        sm: 'h-10 rounded-xl px-4 text-sm',
      },
      variant: {
        default: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30',
        destructive: 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:bg-destructive/90',
        ghost: 'hover:bg-secondary hover:text-foreground',
        link: 'text-primary items-start justify-start underline-offset-4 hover:underline px-0 h-auto',
        outline: 'border-2 border-border bg-transparent hover:bg-secondary hover:text-foreground hover:border-primary/30',
        secondary: 'bg-secondary text-foreground shadow-sm hover:bg-secondary/80',
      },
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

const Button: React.FC<ButtonProps> = ({
  asChild = false,
  className,
  size,
  variant,
  ref,
  ...props
}) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />
}

export { Button, buttonVariants }

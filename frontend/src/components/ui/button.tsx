import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap hover:cursor-pointer rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-6 py-2.5 font-medium transition-all duration-300 hover:shadow-lg active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:shadow-primary/20",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500",
        outline:
          "bg-white border border-gray-200 text-white-foreground hover:shadow-white/20",
        secondary:
          "bg-secondary text-secondary-foreground px-6 py-2.5 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-secondary/20 active:scale-[0.98]",
        ghost: "hover:bg-gray-100 text-gray-900 focus-visible:ring-indigo-500",
        link: "text-indigo-600 underline-offset-4 hover:underline focus-visible:ring-indigo-500",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

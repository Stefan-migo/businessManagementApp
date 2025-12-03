import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-alkimya focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-body",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:-translate-y-0.5",
        outline:
          "border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        
        // Enhanced DA LUZ Brand Variants
        brand: "bg-brand-primary text-text-inverse shadow-alkimya hover:bg-brand-secondary hover:shadow-alkimya-lg hover:-translate-y-1 active:translate-y-0",
        "brand-outline": "border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary hover:text-text-inverse hover:-translate-y-1 active:translate-y-0",
        "brand-ghost": "text-brand-primary hover:bg-brand-primary/10 hover:text-brand-secondary hover:-translate-y-0.5",
        
        // Dynamic Line Theme Variants
        "line-primary": "bg-line-primary text-white shadow-line hover:bg-line-secondary hover:shadow-line-lg hover:-translate-y-1 active:translate-y-0",
        "line-outline": "border-2 border-line-primary text-line-primary bg-transparent hover:bg-line-primary hover:text-white hover:-translate-y-1 active:translate-y-0",
        "line-ghost": "text-line-primary hover:bg-line-primary/10 hover:text-line-secondary hover:-translate-y-0.5",
        "line-accent": "bg-line-accent text-white shadow-line hover:bg-line-primary hover:shadow-line-lg hover:-translate-y-1 active:translate-y-0",
        
        // Elegant Sophisticated Variants
        elegant: "bg-gradient-to-r from-brand-primary to-brand-secondary text-text-inverse shadow-alkimya-lg hover:shadow-alkimya-xl hover:-translate-y-1 hover:scale-105 active:scale-100 active:translate-y-0",
        "elegant-outline": "border-2 border-transparent bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-border text-transparent bg-clip-text hover:bg-clip-padding hover:text-text-inverse hover:-translate-y-1",
        
        // Product Line Specific Variants
        alma: "bg-alma-primary text-white shadow-alma hover:bg-alma-secondary hover:shadow-alma hover:-translate-y-1",
        ecos: "bg-ecos-primary text-white shadow-ecos hover:bg-ecos-secondary hover:shadow-ecos hover:-translate-y-1",
        jade: "bg-jade-primary text-white shadow-jade hover:bg-jade-secondary hover:shadow-jade hover:-translate-y-1",
        umbral: "bg-umbral-primary text-white shadow-umbral hover:bg-umbral-secondary hover:shadow-umbral hover:-translate-y-1",
        utopica: "bg-utopica-primary text-white shadow-utopica hover:bg-utopica-secondary hover:shadow-utopica hover:-translate-y-1",
      },
      size: {
        xs: "h-7 rounded px-2 text-xs",
        sm: "h-8 rounded-md px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-12 text-lg",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
        "icon-lg": "h-12 w-12",
      },
      theme: {
        default: "",
        sophisticated: "font-heading font-semibold tracking-wide",
        modern: "font-body font-medium",
        artisanal: "font-heading font-normal tracking-wider",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      theme: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  shimmer?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, theme, asChild = false, loading = false, shimmer = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // When asChild is true and we have loading, we need to ensure a single child element
    // For Slot component compatibility, wrap content in a single element if needed
    const renderContent = () => {
      if (loading && asChild) {
        // When using asChild with loading, wrap in a single span element
        return (
          <span className="inline-flex items-center justify-center gap-2">
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </span>
        )
      }
      
      // Normal rendering for non-asChild or non-loading states
      return (
        <>
          {loading && (
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {children}
        </>
      )
    }
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, theme }),
          loading && "cursor-wait opacity-80",
          shimmer && "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
          disabled && "transform-none hover:transform-none",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {renderContent()}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

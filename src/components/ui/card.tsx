import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow transition-all duration-300 ease-alkimya",
  {
    variants: {
      variant: {
        default: "border-border bg-card hover:shadow-md",
        elevated: "border-border bg-card shadow-md hover:shadow-lg hover:-translate-y-1",
        interactive: "border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-2 cursor-pointer active:translate-y-0 active:shadow-md",
        outline: "border-2 border-border bg-transparent hover:bg-card/50 hover:shadow-sm",
        ghost: "border-transparent bg-transparent hover:bg-card/50 hover:border-border",
        
        // Enhanced DA LUZ Brand Variants
        brand: "border-brand-primary/20 bg-gradient-to-br from-bg-cream to-bg-light shadow-alkimya hover:shadow-alkimya-lg hover:-translate-y-1",
        "brand-outline": "border-2 border-brand-primary bg-transparent hover:bg-brand-primary/5 hover:shadow-alkimya",
        "brand-subtle": "border-brand-primary/10 bg-bg-light/50 hover:bg-bg-light hover:shadow-soft",
        
        // Dynamic Line Theme Variants
        line: "border-line-primary/20 bg-gradient-to-br from-line-lightest to-line-light/30 shadow-line hover:shadow-line-lg hover:-translate-y-1",
        "line-outline": "border-2 border-line-primary/30 bg-transparent hover:bg-line-primary/5 hover:shadow-line",
        "line-subtle": "border-line-primary/10 bg-line-lightest/50 hover:bg-line-lightest hover:shadow-soft",
        "line-accent": "border-line-accent/30 bg-line-light/20 hover:bg-line-light/40 hover:shadow-line",
        
        // Product Line Specific Variants
        alma: "border-alma-primary/20 bg-gradient-to-br from-alma-lightest to-alma-light/30 shadow-alma hover:shadow-alma hover:-translate-y-1",
        ecos: "border-ecos-primary/20 bg-gradient-to-br from-ecos-lightest to-ecos-light/30 shadow-ecos hover:shadow-ecos hover:-translate-y-1",
        jade: "border-jade-primary/20 bg-gradient-to-br from-jade-lightest to-jade-light/30 shadow-jade hover:shadow-jade hover:-translate-y-1",
        umbral: "border-umbral-primary/20 bg-gradient-to-br from-umbral-lightest to-umbral-light/30 shadow-umbral hover:shadow-umbral hover:-translate-y-1",
        utopica: "border-utopica-primary/20 bg-gradient-to-br from-utopica-lightest to-utopica-light/30 shadow-utopica hover:shadow-utopica hover:-translate-y-1",
        
        // Elegant Sophisticated Variants
        elegant: "border-gradient bg-gradient-to-br from-bg-cream via-bg-light to-bg-cream shadow-alkimya-lg hover:shadow-alkimya-xl hover:-translate-y-2 hover:scale-[1.02] active:scale-100 active:translate-y-0",
        glass: "border-border/20 bg-white/10 backdrop-blur-md shadow-soft hover:bg-white/20 hover:shadow-medium",
        artisanal: "border-brand-primary/30 bg-bg-cream shadow-soft hover:shadow-alkimya hover:-translate-y-1 relative overflow-hidden before:absolute before:inset-0 before:bg-hero-pattern before:pointer-events-none",
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-12",
      },
      rounded: {
        default: "rounded-xl",
        sm: "rounded-lg",
        lg: "rounded-2xl",
        full: "rounded-3xl",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      rounded: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  shimmer?: boolean
  float?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, rounded, shimmer = false, float = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
        cardVariants({ variant, padding, rounded }),
        shimmer && "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-1000",
        float && "animate-alkimya-float",
      className
    )}
    {...props}
  />
  )
)
Card.displayName = "Card"

const cardHeaderVariants = cva(
  "flex flex-col space-y-1.5",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4 pb-2",
        default: "p-6 pb-3",
        lg: "p-8 pb-4",
        xl: "p-12 pb-6",
      },
      align: {
        left: "text-left",
        center: "text-center items-center",
        right: "text-right items-end",
      },
    },
    defaultVariants: {
      padding: "default",
      align: "left",
    },
  }
)

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding, align, ...props }, ref) => (
  <div
    ref={ref}
      className={cn(cardHeaderVariants({ padding, align }), className)}
    {...props}
  />
  )
)
CardHeader.displayName = "CardHeader"

const cardTitleVariants = cva(
  "font-semibold leading-none tracking-tight",
  {
    variants: {
      size: {
        sm: "text-lg",
        default: "text-xl",
        lg: "text-2xl",
        xl: "text-3xl",
      },
      theme: {
        default: "font-body",
        elegant: "font-heading",
        sophisticated: "font-heading font-bold",
        modern: "font-body font-medium",
      },
    },
    defaultVariants: {
      size: "default",
      theme: "default",
    },
  }
)

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardTitleVariants> {}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, size, theme, ...props }, ref) => (
  <div
    ref={ref}
      className={cn(cardTitleVariants({ size, theme }), className)}
    {...props}
  />
  )
)
CardTitle.displayName = "CardTitle"

const cardDescriptionVariants = cva(
  "text-muted-foreground",
  {
    variants: {
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
      theme: {
        default: "font-body",
        elegant: "font-body italic",
        sophisticated: "font-body",
      },
    },
    defaultVariants: {
      size: "default",
      theme: "default",
    },
  }
)

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardDescriptionVariants> {}

const CardDescription = React.forwardRef<HTMLDivElement, CardDescriptionProps>(
  ({ className, size, theme, ...props }, ref) => (
  <div
    ref={ref}
      className={cn(cardDescriptionVariants({ size, theme }), className)}
    {...props}
  />
  )
)
CardDescription.displayName = "CardDescription"

const cardContentVariants = cva(
  "",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4 pt-2",
        default: "p-6 pt-3",
        lg: "p-8 pt-4",
        xl: "p-12 pt-6",
      },
      spacing: {
        tight: "space-y-2",
        default: "space-y-4",
        relaxed: "space-y-6",
        loose: "space-y-8",
      },
    },
    defaultVariants: {
      padding: "default",
      spacing: "default",
    },
  }
)

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding, spacing, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(cardContentVariants({ padding, spacing }), className)} 
      {...props} 
    />
  )
)
CardContent.displayName = "CardContent"

const cardFooterVariants = cva(
  "flex items-center",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4 pt-2",
        default: "p-6 pt-3",
        lg: "p-8 pt-4",
        xl: "p-12 pt-6",
      },
      justify: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
      },
      direction: {
        row: "flex-row",
        column: "flex-col",
        "row-reverse": "flex-row-reverse",
        "column-reverse": "flex-col-reverse",
      },
    },
    defaultVariants: {
      padding: "default",
      justify: "start",
      direction: "row",
    },
  }
)

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding, justify, direction, ...props }, ref) => (
  <div
    ref={ref}
      className={cn(cardFooterVariants({ padding, justify, direction }), className)}
    {...props}
  />
  )
)
CardFooter.displayName = "CardFooter"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants,
  cardHeaderVariants,
  cardTitleVariants,
  cardDescriptionVariants,
  cardContentVariants,
  cardFooterVariants
}

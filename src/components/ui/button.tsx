import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// `border-transparent` lives in each variant, not in the base: links styled
// with `buttonVariants()` skip tailwind-merge, so a base `border-transparent`
// would win over the outline and destructive borders.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border bg-clip-padding text-sm font-medium whitespace-nowrap transition-colors duration-(--duration-fast) outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-(--focus-gap) active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:bg-(--disabled-bg) disabled:text-(--disabled-text) disabled:border-transparent aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** DS v2 primary: black, one per area. */
        default: "border-transparent bg-primary font-semibold text-primary-foreground hover:bg-(--primary-hover)",
        /** DS v2 secondary. */
        outline:
          "border-input bg-card text-foreground hover:border-(--text-secondary) hover:bg-muted aria-expanded:bg-muted",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "border-transparent hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        /** Always behind a confirmation. */
        destructive:
          "border-(--danger-border) bg-card font-semibold text-(--danger-text) hover:border-(--danger-text) hover:bg-(--danger-bg)",
        link: "border-transparent text-(--link) underline underline-offset-4 hover:text-(--link-hover)",
        /** DS v2 accent: brand orange, at most one per screen, for the action
         *  that moves the journey forward (send, start, create account). */
        brand:
          "border-transparent bg-(--accent-brand) font-semibold text-(--on-accent-brand) hover:bg-(--accent-brand-hover)",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-lg px-3 text-[0.8125rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        /** 44px: the minimum touch target on mobile. */
        lg: "h-11 gap-2 px-5 text-[0.9375rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-lg border border-input bg-card px-3 py-3 text-base leading-6 text-foreground transition-colors duration-(--duration-fast) outline-none placeholder:text-(--text-placeholder) focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-(--focus-gap) disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-2 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

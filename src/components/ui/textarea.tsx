import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[64px] w-full rounded-lg border border-white/5 bg-[#2c2c2e]/40 px-3 py-2 text-xs transition-colors outline-none placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:bg-[#2c2c2e]/80 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

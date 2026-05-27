"use client"

import { Check, Copy } from "lucide-react"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { cn } from "@/lib/utils"

export function CopyButton({
  text,
  label,
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const { copy, copied } = useCopyToClipboard()

  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={label ?? "Copy"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        copied && "text-emerald-600 hover:text-emerald-600",
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  )
}

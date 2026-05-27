"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useCopyToClipboard(resetMs = 1500) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        if (timer.current !== null) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(false), resetMs)
      } catch (err) {
        console.error("clipboard copy failed", err)
      }
    },
    [resetMs]
  )

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    []
  )

  return { copy, copied }
}

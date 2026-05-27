"use client"

import { useEffect, useRef, useState } from "react"
import { History as HistoryIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearHistory, getRecentReports } from "@/lib/history"
import { scoreClasses } from "@/lib/score-color"
import type { StoredReport } from "@/types/history"

export function HistorySidebar() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<StoredReport[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setItems(getRecentReports())
  }, [open])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  function onClear() {
    clearHistory()
    setItems([])
  }

  return (
    <div ref={ref} className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        <HistoryIcon className="mr-1.5 h-3.5 w-3.5" />
        History
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
          {items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No analyses yet.
            </p>
          ) : (
            <>
              <ul className="max-h-96 overflow-y-auto">
                {items.map((item) => {
                  const classes = scoreClasses(item.score.overallScore)
                  return (
                    <li key={item.id}>
                      <a
                        href={`/analyze?report=${item.id}`}
                        className="block rounded-sm px-2 py-2 hover:bg-accent"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {item.title || item.url || "Untitled analysis"}
                          </span>
                          <span className={`shrink-0 text-sm font-semibold ${classes.text}`}>
                            {item.score.overallScore}
                          </span>
                        </div>
                        {item.url && (
                          <p className="truncate text-xs text-muted-foreground">{item.url}</p>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-1 border-t pt-1">
                <button
                  type="button"
                  onClick={onClear}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear history
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

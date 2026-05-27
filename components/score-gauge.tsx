"use client"

import { useEffect, useState } from "react"
import { scoreClasses } from "@/lib/score-color"

export function ScoreGauge({ value, label }: { value: number; label?: string }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(value))
    return () => cancelAnimationFrame(raf)
  }, [value])

  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated / 100) * circumference
  const classes = scoreClasses(value)

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className={classes.stroke}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-5xl font-semibold ${classes.text}`}>{value}</div>
        <div className="text-xs text-muted-foreground">/ 100</div>
      </div>
      {label && <div className="mt-3 text-sm font-medium text-muted-foreground">{label}</div>}
    </div>
  )
}

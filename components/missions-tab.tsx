"use client"

import type { Mission } from "@/lib/swarm-data"

interface MissionsTabProps {
  missions: Mission[]
  onSelect: (mission: Mission) => void
}

const STATUS_STYLES: Record<string, string> = {
  running: "text-yellow-500",
  error: "text-destructive",
  complete: "text-muted-foreground",
}

export function MissionsTab({ missions, onSelect }: MissionsTabProps) {
  if (missions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        No missions yet. Launch one from the Activate tab.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {missions.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m)}
          className="flex w-full flex-col gap-1.5 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40"
        >
          {/* Top row: type badge + date + cost */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium ${
                  m.type === "R"
                    ? "bg-primary/10 text-primary"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {m.type === "R" ? "Research" : "Engineering"}
              </span>
              {m.status === "running" && (
                <span className="font-mono text-xs text-yellow-500">running…</span>
              )}
              {m.status === "error" && (
                <span className="font-mono text-xs text-destructive">error</span>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
              <span>{m.date}</span>
              {m.cost > 0 && <span>${m.cost.toFixed(2)}</span>}
            </div>
          </div>
          {/* Topic — full text, wraps on mobile */}
          <p className="text-sm text-foreground">{m.topic}</p>
          {/* ID */}
          <p className="font-mono text-[11px] text-muted-foreground/60">{m.id}</p>
        </button>
      ))}
    </div>
  )
}

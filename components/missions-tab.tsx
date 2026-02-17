"use client"

import type { Mission } from "@/lib/swarm-data"

interface MissionsTabProps {
  missions: Mission[]
  onSelect: (mission: Mission) => void
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
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-card">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Topic / Spec
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Date
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Cost
            </th>
          </tr>
        </thead>
        <tbody>
          {missions.map((m) => (
            <tr
              key={m.id}
              onClick={() => onSelect(m)}
              className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-card"
            >
              <td className="px-4 py-3 font-mono text-sm text-foreground">{m.id}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium ${
                    m.type === "R"
                      ? "bg-primary/10 text-primary"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {m.type}
                </span>
              </td>
              <td className="max-w-[400px] truncate px-4 py-3 text-sm text-foreground">
                {m.topic}
              </td>
              <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{m.date}</td>
              <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                ${m.cost.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

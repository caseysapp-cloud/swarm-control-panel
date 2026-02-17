"use client"

import type { Mission } from "@/lib/swarm-data"

interface CostsTabProps {
  activeMission: Mission | null
  missions: Mission[]
}

function fmtCost(cost: number, status?: string): string {
  if (status === "running") return "running…"
  if (cost === 0) return "—"
  return `$${cost.toFixed(2)}`
}

export function CostsTab({ activeMission, missions }: CostsTabProps) {
  const completedMissions = missions.filter((m) => m.status !== "running" && m.cost > 0)
  const totalCost = completedMissions.reduce((sum, m) => sum + m.cost, 0)

  // Use activeMission if it has model cost data; otherwise prompt to select one
  const showBreakdown =
    activeMission && (activeMission.modelCosts ?? []).length > 0

  return (
    <div className="flex flex-col gap-8">
      {/* Selected Run */}
      <section>
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Selected Run
        </h3>
        {activeMission && activeMission.status === "running" ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Mission running — cost will appear when complete.
          </div>
        ) : showBreakdown ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 font-mono text-sm text-foreground">
              {activeMission!.id} — Total: ${activeMission!.cost.toFixed(2)}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Model
                  </th>
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                  <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tokens
                  </th>
                  <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeMission!.modelCosts.map((mc, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    <td className="py-2 font-mono text-sm text-foreground">{mc.model}</td>
                    <td className="py-2 text-sm text-muted-foreground">{mc.role}</td>
                    <td className="py-2 text-right font-mono text-sm text-muted-foreground">
                      {mc.tokens.toLocaleString()}
                    </td>
                    <td className="py-2 text-right font-mono text-sm text-foreground">
                      {fmtCost(mc.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Select a completed mission from the Missions tab to see per-model cost breakdown.
          </div>
        )}
      </section>

      {/* Run History */}
      <section>
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Run History
        </h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="max-h-[320px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Topic
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {missions.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2 font-mono text-sm text-muted-foreground">
                      {m.date}
                    </td>
                    <td className="px-4 py-2">
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
                    <td className="px-4 py-2 text-sm text-foreground">
                      {m.topic}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm text-foreground">
                      {fmtCost(m.cost, m.status)}
                    </td>
                  </tr>
                ))}
                {completedMissions.length > 0 && (
                  <tr className="bg-card">
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-foreground">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium text-foreground">
                      ${totalCost.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

"use client"

import { useState } from "react"
import type { Mission, ProviderKey } from "@/lib/swarm-data"

interface CostsTabProps {
  activeMission: Mission | null
  missions: Mission[]
}

const PROVIDER_LABELS: Record<ProviderKey, string> = {
  swarm: "Custom",
  openai: "OpenAI",
  crewai: "CrewAI",
  pydantic: "Pydantic",
  agno: "Agno",
  langgraph: "LangGraph",
}

const PROVIDER_FILTER_OPTIONS: Array<{ value: "all" | ProviderKey; label: string }> = [
  { value: "all", label: "All" },
  { value: "swarm", label: "Custom" },
  { value: "openai", label: "OpenAI" },
  { value: "crewai", label: "CrewAI" },
  { value: "pydantic", label: "Pydantic" },
  { value: "agno", label: "Agno" },
  { value: "langgraph", label: "LangGraph" },
]

function fmtCost(cost: number, status?: string): string {
  if (status === "running") return "running…"
  if (cost === 0) return "—"
  return `$${cost.toFixed(2)}`
}

export function CostsTab({ activeMission, missions }: CostsTabProps) {
  const [providerFilter, setProviderFilter] = useState<"all" | ProviderKey>("all")

  const filteredMissions =
    providerFilter === "all"
      ? missions
      : missions.filter((m) => (m.provider ?? "swarm") === providerFilter)

  const completedMissions = filteredMissions.filter((m) => m.status !== "running" && m.cost > 0)
  const totalCost = completedMissions.reduce((sum, m) => sum + m.cost, 0)

  const showBreakdown = activeMission && (activeMission.modelCosts ?? []).length > 0

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
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-sm text-foreground">
                {activeMission!.id} — Total: ${activeMission!.cost.toFixed(2)}
              </span>
              {activeMission!.provider && (
                <span className="font-mono text-xs text-muted-foreground">
                  [{PROVIDER_LABELS[(activeMission!.provider as ProviderKey)] ?? activeMission!.provider}]
                </span>
              )}
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
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Run History
          </h3>
          {/* Provider filter */}
          <div className="flex gap-1">
            {PROVIDER_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setProviderFilter(opt.value)}
                className={`rounded-md px-2 py-1 font-mono text-[11px] transition-colors ${
                  providerFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

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
                    Provider
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
                {filteredMissions.map((m) => {
                  const providerKey = (m.provider ?? "swarm") as ProviderKey
                  return (
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
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {PROVIDER_LABELS[providerKey] ?? providerKey}
                      </td>
                      <td className="px-4 py-2 text-sm text-foreground">
                        {m.topic}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-sm text-foreground">
                        {fmtCost(m.cost, m.status)}
                      </td>
                    </tr>
                  )
                })}
                {completedMissions.length > 0 && (
                  <tr className="bg-card">
                    <td colSpan={4} className="px-4 py-3 text-sm font-medium text-foreground">
                      Total {providerFilter !== "all" ? `(${PROVIDER_LABELS[providerFilter as ProviderKey]})` : ""}
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

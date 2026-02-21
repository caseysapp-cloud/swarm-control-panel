"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { type MissionType, type ProviderKey, type SwarmOutputData, activateProvider } from "@/lib/swarm-data"

const SDK_PROVIDERS = ["openai", "crewai", "pydantic", "agno", "langgraph"] as const
type SdkProvider = (typeof SDK_PROVIDERS)[number]

const SDK_LABELS: Record<SdkProvider, string> = {
  openai: "OpenAI",
  crewai: "CrewAI",
  pydantic: "Pydantic AI",
  agno: "Agno",
  langgraph: "LangGraph",
}

type SdkStatus = "idle" | "running" | "complete" | "error"

interface SdkResult {
  mission_id: string
  status: SdkStatus
  swarmOutput?: SwarmOutputData
  cost?: number
  error?: string
}

function ConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return <span className="text-muted-foreground">—</span>
  const colors = {
    high: "text-green-500 bg-green-500/10 border-green-500/30",
    medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
    low: "text-red-500 bg-red-500/10 border-red-500/30",
  }
  const color = colors[confidence as keyof typeof colors] ?? "text-muted-foreground"
  return (
    <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${color}`}>
      {confidence}
    </span>
  )
}

function ScoreBar({ score }: { score?: number }) {
  if (score === undefined || score === 0) return <span className="text-muted-foreground">—</span>
  const color = score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-400"
  return <span className={`font-mono text-sm font-semibold ${color}`}>{score}</span>
}

interface CompareTabProps {
  apiUrl: string
}

export function CompareTab({ apiUrl }: CompareTabProps) {
  const [topic, setTopic] = useState("")
  const [type, setType] = useState<MissionType>("R")
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<Record<SdkProvider, SdkResult | null>>({
    openai: null,
    crewai: null,
    pydantic: null,
    agno: null,
    langgraph: null,
  })
  const [error, setError] = useState<string | null>(null)
  const pollRefs = useRef<Partial<Record<SdkProvider, ReturnType<typeof setInterval>>>>({})

  // Stop all polling on unmount
  useEffect(() => {
    return () => {
      Object.values(pollRefs.current).forEach((id) => id && clearInterval(id))
    }
  }, [])

  const pollMission = useCallback(
    (provider: SdkProvider, missionId: string) => {
      if (pollRefs.current[provider]) clearInterval(pollRefs.current[provider])

      pollRefs.current[provider] = setInterval(async () => {
        if (!apiUrl) return
        try {
          const res = await fetch(`${apiUrl}/api/swarm/status/${missionId}`)
          if (!res.ok) return
          const { status } = await res.json()

          if (status === "complete") {
            clearInterval(pollRefs.current[provider])
            delete pollRefs.current[provider]
            const full = await fetch(`${apiUrl}/api/swarm/missions/${missionId}`)
            if (full.ok) {
              const mission = await full.json()
              setResults((prev) => ({
                ...prev,
                [provider]: {
                  mission_id: missionId,
                  status: "complete",
                  swarmOutput: mission.swarmOutput,
                  cost: mission.cost ?? mission.swarmOutput?.total_cost ?? 0,
                },
              }))
            }
          } else if (status === "error") {
            clearInterval(pollRefs.current[provider])
            delete pollRefs.current[provider]
            setResults((prev) => ({
              ...prev,
              [provider]: {
                mission_id: missionId,
                status: "error",
                error: "Mission failed",
              },
            }))
          }
        } catch {
          // network hiccup — keep polling
        }
      }, 3000)
    },
    [apiUrl],
  )

  async function handleRunAll() {
    if (!topic.trim() || !apiUrl) return
    setRunning(true)
    setError(null)
    setResults({
      openai: null,
      crewai: null,
      pydantic: null,
      agno: null,
      langgraph: null,
    })

    // Fire all 5 SDKs in parallel
    await Promise.all(
      SDK_PROVIDERS.map(async (provider) => {
        setResults((prev) => ({
          ...prev,
          [provider]: { mission_id: "", status: "running" },
        }))
        try {
          const { mission_id } = await activateProvider(apiUrl, provider as Exclude<ProviderKey, "swarm">, topic.trim(), type)
          setResults((prev) => ({
            ...prev,
            [provider]: { mission_id, status: "running" },
          }))
          pollMission(provider, mission_id)
        } catch (err) {
          setResults((prev) => ({
            ...prev,
            [provider]: {
              mission_id: "",
              status: "error",
              error: err instanceof Error ? err.message : "Launch failed",
            },
          }))
        }
      }),
    )
    setRunning(false)
  }

  const allDone = SDK_PROVIDERS.every((p) => results[p]?.status === "complete" || results[p]?.status === "error")
  const hasResults = SDK_PROVIDERS.some((p) => results[p] !== null)
  const completeCount = SDK_PROVIDERS.filter((p) => results[p]?.status === "complete").length

  return (
    <div className="flex flex-col gap-6">
      {/* Input row */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !running) void handleRunAll() }}
            placeholder="e.g. Silver futures institutional flow Feb 2026"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-1">
            {(["R", "E"] as MissionType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  type === t
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "R" ? "Research" : "Engineer"}
              </button>
            ))}
          </div>
          <button
            onClick={() => void handleRunAll()}
            disabled={!topic.trim() || running}
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {running ? "Launching…" : "Run All →"}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Fires all 5 SDKs simultaneously on the same prompt. Compare outputs side-by-side.
          {hasResults && !allDone && (
            <span className="ml-2 text-primary">
              {completeCount}/5 complete…
            </span>
          )}
        </p>
      </div>

      {/* Scorecard table */}
      {hasResults && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  SDK
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Confidence
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Findings
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Gaps
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Quality
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cost
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {SDK_PROVIDERS.map((provider) => {
                const r = results[provider]
                const out = r?.swarmOutput
                return (
                  <tr key={provider} className="border-b border-border last:border-0 hover:bg-card/50">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {SDK_LABELS[provider]}
                    </td>
                    <td className="px-3 py-3">
                      {!r && <span className="text-muted-foreground opacity-40">○ idle</span>}
                      {r?.status === "running" && (
                        <span className="flex items-center gap-1 text-primary">
                          <span className="h-2 w-2 animate-spin rounded-full border border-primary border-t-transparent" />
                          running
                        </span>
                      )}
                      {r?.status === "complete" && (
                        <span className="text-green-500">● done</span>
                      )}
                      {r?.status === "error" && (
                        <span className="text-destructive">✗ error</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <ConfidenceBadge confidence={out?.confidence} />
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-foreground">
                      {out ? out.key_findings.length : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-foreground">
                      {out ? out.gaps.length : "—"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ScoreBar score={out?.quality_score} />
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-muted-foreground">
                      {r?.cost !== undefined && r.cost > 0 ? `$${r.cost.toFixed(3)}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-muted-foreground">
                      {out?.duration_sec ? `${out.duration_sec.toFixed(0)}s` : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Key findings comparison (when all done) */}
      {allDone && SDK_PROVIDERS.some((p) => results[p]?.swarmOutput?.key_findings.length) && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Key Findings by SDK
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SDK_PROVIDERS.map((provider) => {
              const out = results[provider]?.swarmOutput
              if (!out?.key_findings.length) return null
              return (
                <div key={provider} className="rounded-lg border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{SDK_LABELS[provider]}</span>
                    <ConfidenceBadge confidence={out.confidence} />
                  </div>
                  <ul className="space-y-1">
                    {out.key_findings.slice(0, 4).map((f, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground leading-snug">
                        • {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

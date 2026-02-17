"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ActivateTab } from "@/components/activate-tab"
import { MissionsTab } from "@/components/missions-tab"
import { OutputTab } from "@/components/output-tab"
import { CostsTab } from "@/components/costs-tab"
import { type Mission, type MissionType } from "@/lib/swarm-data"

const TABS = ["ACTIVATE", "MISSIONS", "OUTPUT", "COSTS"] as const
type Tab = (typeof TABS)[number]

// Backend API URL — set NEXT_PUBLIC_API_URL in Vercel environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

export function SwarmPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("ACTIVATE")
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [dailyBudgetUsed, setDailyBudgetUsed] = useState(0)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null) // null = checking
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningMissionIdRef = useRef<string | null>(null)

  // ── Load missions on mount ──────────────────────────────────────────────
  const loadMissions = useCallback(async () => {
    if (!API_URL) return
    try {
      const res = await fetch(`${API_URL}/api/swarm/missions`)
      if (!res.ok) return
      const data = await res.json()
      const list: Mission[] = (data.missions ?? []).map((m: Mission) => ({
        ...m,
        synthesis: m.synthesis ?? "",
        rawOutputs: m.rawOutputs ?? {},
        modelCosts: m.modelCosts ?? [],
      }))
      setMissions(list)
      const totalCost = list.reduce((s, m) => s + (m.cost ?? 0), 0)
      setDailyBudgetUsed(totalCost)
      setApiOnline(true)
    } catch {
      setApiOnline(false)
    }
  }, [])

  useEffect(() => {
    loadMissions()
  }, [loadMissions])

  // ── Poll running mission ────────────────────────────────────────────────
  const startPolling = useCallback(
    (missionId: string) => {
      runningMissionIdRef.current = missionId
      if (pollingRef.current) clearInterval(pollingRef.current)

      pollingRef.current = setInterval(async () => {
        if (!API_URL) return
        try {
          const res = await fetch(`${API_URL}/api/swarm/status/${missionId}`)
          if (!res.ok) return
          const { status } = await res.json()

          if (status === "complete") {
            clearInterval(pollingRef.current!)
            pollingRef.current = null
            runningMissionIdRef.current = null

            // Fetch full mission record
            const full = await fetch(`${API_URL}/api/swarm/missions/${missionId}`)
            if (full.ok) {
              const fullMission: Mission = await full.json()
              setMissions((prev) =>
                prev.map((m) => (m.id === missionId ? { ...fullMission } : m))
              )
              setSelectedMission(fullMission)
            }
          } else if (status === "error") {
            clearInterval(pollingRef.current!)
            pollingRef.current = null
            runningMissionIdRef.current = null
            setMissions((prev) =>
              prev.map((m) => (m.id === missionId ? { ...m, status: "error" } : m))
            )
            setSelectedMission((prev) => (prev?.id === missionId ? { ...prev, status: "error" } : prev))
          }
        } catch {
          // Network hiccup — keep polling
        }
      }, 3000)
    },
    []
  )

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // ── Mission select ──────────────────────────────────────────────────────
  const handleMissionSelect = useCallback(
    async (mission: Mission) => {
      // If it's a running mission, select it as-is and let polling update it
      if (mission.status === "running") {
        setSelectedMission(mission)
        setActiveTab("OUTPUT")
        if (runningMissionIdRef.current !== mission.id) {
          startPolling(mission.id)
        }
        return
      }
      // If complete but rawOutputs not loaded yet, fetch full record
      if (!API_URL || Object.keys(mission.rawOutputs ?? {}).length > 0) {
        setSelectedMission(mission)
        setActiveTab("OUTPUT")
        return
      }
      try {
        const res = await fetch(`${API_URL}/api/swarm/missions/${mission.id}`)
        if (res.ok) {
          const full: Mission = await res.json()
          setSelectedMission(full)
          setMissions((prev) => prev.map((m) => (m.id === mission.id ? full : m)))
        } else {
          setSelectedMission(mission)
        }
      } catch {
        setSelectedMission(mission)
      }
      setActiveTab("OUTPUT")
    },
    [startPolling]
  )

  // ── Launch mission ──────────────────────────────────────────────────────
  const handleLaunch = useCallback(
    async (type: MissionType, topic: string, tier: string) => {
      if (!API_URL) {
        // API not configured — show placeholder mission
        const placeholder: Mission = {
          id: `swm-offline-${Date.now()}`,
          type,
          topic,
          date: new Date().toISOString().split("T")[0],
          cost: 0,
          status: "error",
          synthesis: "API not configured. Set NEXT_PUBLIC_API_URL in Vercel environment variables.",
          rawOutputs: {},
          modelCosts: [],
        }
        setMissions((prev) => [placeholder, ...prev])
        setSelectedMission(placeholder)
        setActiveTab("OUTPUT")
        return
      }

      try {
        const res = await fetch(`${API_URL}/api/swarm/activate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, topic, tier }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Unknown error" }))
          throw new Error(err.detail ?? `HTTP ${res.status}`)
        }

        const { mission_id }: { mission_id: string } = await res.json()

        // Create optimistic 'running' mission in UI
        const running: Mission = {
          id: mission_id,
          type,
          topic,
          date: new Date().toISOString().split("T")[0],
          cost: 0,
          status: "running",
          synthesis: "",
          rawOutputs: {},
          modelCosts: [],
        }

        setMissions((prev) => [running, ...prev])
        setSelectedMission(running)
        setActiveTab("OUTPUT")
        startPolling(mission_id)
      } catch (err) {
        const errorMission: Mission = {
          id: `swm-error-${Date.now()}`,
          type,
          topic,
          date: new Date().toISOString().split("T")[0],
          cost: 0,
          status: "error",
          synthesis: `Launch failed: ${err instanceof Error ? err.message : String(err)}`,
          rawOutputs: {},
          modelCosts: [],
        }
        setMissions((prev) => [errorMission, ...prev])
        setSelectedMission(errorMission)
        setActiveTab("OUTPUT")
      }
    },
    [startPolling]
  )

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Swarm Control Panel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Orchestrate parallel AI model runs
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
          {apiOnline === null && <span className="text-muted-foreground">connecting…</span>}
          {apiOnline === true && <span className="text-green-500">● api online</span>}
          {apiOnline === false && (
            <span className="text-yellow-500" title="Set NEXT_PUBLIC_API_URL to connect to backend">
              ● api offline (mock)
            </span>
          )}
          <span>{missions.length} missions</span>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="mb-6 flex border-b border-border" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-3 text-sm font-medium tracking-wide transition-colors ${
              activeTab === tab
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <main className="flex-1" role="tabpanel">
        {activeTab === "ACTIVATE" && (
          <ActivateTab
            dailyBudgetUsed={dailyBudgetUsed}
            dailyBudgetTotal={10}
            onLaunch={handleLaunch}
          />
        )}
        {activeTab === "MISSIONS" && (
          <MissionsTab missions={missions} onSelect={handleMissionSelect} />
        )}
        {activeTab === "OUTPUT" && <OutputTab mission={selectedMission} />}
        {activeTab === "COSTS" && (
          <CostsTab activeMission={selectedMission} missions={missions} />
        )}
      </main>
    </div>
  )
}

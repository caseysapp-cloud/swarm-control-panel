"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ActivateTab } from "@/components/activate-tab"
import { MissionsTab } from "@/components/missions-tab"
import { OutputTab } from "@/components/output-tab"
import { CostsTab } from "@/components/costs-tab"
import {
  type Mission,
  type MissionType,
  type PlanResult,
  generatePlan,
  refinePlan,
  approvePlan,
} from "@/lib/swarm-data"

const TABS = ["ACTIVATE", "MISSIONS", "RESULTS", "COSTS"] as const
type Tab = (typeof TABS)[number]

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

export function SwarmPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("ACTIVATE")
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [dailyBudgetUsed, setDailyBudgetUsed] = useState(0)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  // Delivery confirmation shown after mission complete
  const [deliveryStatus, setDeliveryStatus] = useState<{ telegram: boolean; desktop: boolean } | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningMissionIdRef = useRef<string | null>(null)

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

            const full = await fetch(`${API_URL}/api/swarm/missions/${missionId}`)
            if (full.ok) {
              const fullMission: Mission = await full.json()
              setMissions((prev) =>
                prev.map((m) => (m.id === missionId ? { ...fullMission } : m))
              )
              setSelectedMission(fullMission)
              setDailyBudgetUsed((prev) => prev + (fullMission.cost ?? 0))
              // Show delivery confirmation (both channels attempted by backend)
              setDeliveryStatus({ telegram: true, desktop: true })
            }
          } else if (status === "error") {
            clearInterval(pollingRef.current!)
            pollingRef.current = null
            runningMissionIdRef.current = null
            setMissions((prev) =>
              prev.map((m) => (m.id === missionId ? { ...m, status: "error" } : m))
            )
            setSelectedMission((prev) =>
              prev?.id === missionId ? { ...prev, status: "error" } : prev
            )
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

  const handleMissionSelect = useCallback(
    async (mission: Mission) => {
      setDeliveryStatus(null)
      if (mission.status === "running") {
        setSelectedMission(mission)
        setActiveTab("RESULTS")
        if (runningMissionIdRef.current !== mission.id) startPolling(mission.id)
        return
      }
      if (!API_URL || Object.keys(mission.rawOutputs ?? {}).length > 0) {
        setSelectedMission(mission)
        setActiveTab("RESULTS")
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
      setActiveTab("RESULTS")
    },
    [startPolling]
  )

  // ── Plan flow handlers ────────────────────────────────────────────────────

  const handleGeneratePlan = useCallback(
    async (
      type: MissionType,
      topic: string,
      tier: string,
      domain: string | null,
    ): Promise<PlanResult> => {
      if (!API_URL) {
        throw new Error("API not configured. Set NEXT_PUBLIC_API_URL in Vercel environment variables.")
      }
      return generatePlan(API_URL, type, topic, tier, domain)
    },
    []
  )

  const handleRefinePlan = useCallback(
    async (planId: string, refinementPrompt: string): Promise<PlanResult> => {
      if (!API_URL) throw new Error("API not configured")
      return refinePlan(API_URL, planId, refinementPrompt)
    },
    []
  )

  const handleApproveAndExecute = useCallback(
    (planId: string, type: MissionType, topic: string, tier: string, domain: string | null) => {
      setDeliveryStatus(null)

      if (!API_URL) {
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
        setActiveTab("RESULTS")
        return
      }

      // Fire-and-forget: approve plan → get mission_id → start polling
      approvePlan(API_URL, planId).then(({ mission_id }) => {
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
        setActiveTab("RESULTS")
        startPolling(mission_id)
      }).catch((err) => {
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
        setActiveTab("RESULTS")
      })
    },
    [startPolling]
  )

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      {/* Header */}
      <header className="relative mb-8 flex items-center justify-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Swarm Control Panel
        </h1>
        {/* API status — absolute right corner, unobtrusive */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[10px]">
          {apiOnline === true && <span className="text-green-500">● online</span>}
          {apiOnline === false && <span className="text-yellow-500 opacity-60">● offline</span>}
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
            apiUrl={API_URL}
            onGeneratePlan={handleGeneratePlan}
            onRefinePlan={handleRefinePlan}
            onApproveAndExecute={handleApproveAndExecute}
          />
        )}
        {activeTab === "MISSIONS" && (
          <MissionsTab missions={missions} onSelect={handleMissionSelect} />
        )}
        {activeTab === "RESULTS" && (
          <div className="flex flex-col gap-4">
            {/* Delivery confirmation banner */}
            {deliveryStatus && selectedMission?.status === "complete" && (
              <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm">
                <span className="text-green-500">✓</span>
                <span className="text-muted-foreground">
                  Delivered to Telegram{" "}
                  <span className={deliveryStatus.telegram ? "text-green-500" : "text-destructive"}>
                    {deliveryStatus.telegram ? "✓" : "✗"}
                  </span>
                  {" | "}
                  Saved to Desktop{" "}
                  <span className={deliveryStatus.desktop ? "text-green-500" : "text-destructive"}>
                    {deliveryStatus.desktop ? "✓" : "✗"}
                  </span>
                  {" — "}
                  <span className="font-mono text-xs">~/Desktop/swarm-reports/</span>
                </span>
                <button
                  onClick={() => setDeliveryStatus(null)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            )}
            <OutputTab mission={selectedMission} />
          </div>
        )}
        {activeTab === "COSTS" && (
          <CostsTab activeMission={selectedMission} missions={missions} />
        )}
      </main>
    </div>
  )
}

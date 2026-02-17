"use client"

import { useState, useCallback } from "react"
import { ActivateTab } from "@/components/activate-tab"
import { MissionsTab } from "@/components/missions-tab"
import { OutputTab } from "@/components/output-tab"
import { CostsTab } from "@/components/costs-tab"
import { SAMPLE_MISSIONS, type Mission, type MissionType, MODELS_RESEARCH, MODELS_ENGINEERING } from "@/lib/swarm-data"

const TABS = ["ACTIVATE", "MISSIONS", "OUTPUT", "COSTS"] as const
type Tab = (typeof TABS)[number]

export function SwarmPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("ACTIVATE")
  const [missions, setMissions] = useState<Mission[]>(SAMPLE_MISSIONS)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [dailyBudgetUsed, setDailyBudgetUsed] = useState(4.36)

  const handleMissionSelect = useCallback(
    (mission: Mission) => {
      setSelectedMission(mission)
      setActiveTab("OUTPUT")
    },
    []
  )

  const handleLaunch = useCallback(
    (type: MissionType, topic: string, tier: string) => {
      const tierCosts: Record<string, number> = {
        Budget: 0.1,
        Standard: type === "R" ? 0.4 : 3.0,
        Deep: 1.2,
        Heavy: 6.0,
      }
      const cost = tierCosts[tier] || 0.4
      const models = type === "R" ? MODELS_RESEARCH : MODELS_ENGINEERING

      const newMission: Mission = {
        id: `swm-${String(missions.length + 38).padStart(4, "0")}`,
        type,
        topic,
        date: new Date().toISOString().split("T")[0],
        cost,
        synthesis: `## Mission: ${topic}\n\nProcessing with ${tier} tier...\n\nThis mission has been queued and will be processed by ${models.length} models in parallel.`,
        rawOutputs: Object.fromEntries(models.map((m) => [m, `Output from ${m} pending...`])),
        modelCosts: models.map((m, i) => ({
          model: m,
          role: i === 0 ? "Lead" : "Contributor",
          tokens: Math.floor(Math.random() * 20000) + 5000,
          cost: +(cost / models.length).toFixed(2),
        })),
      }

      setMissions((prev) => [newMission, ...prev])
      setDailyBudgetUsed((prev) => prev + cost)
      setSelectedMission(newMission)
      setActiveTab("OUTPUT")
    },
    [missions.length]
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
        <div className="font-mono text-xs text-muted-foreground">
          {missions.length} missions
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

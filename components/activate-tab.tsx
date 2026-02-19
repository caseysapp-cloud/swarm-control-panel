"use client"

import { useState } from "react"
import { PlanReview } from "@/components/plan-review"
import { PromptNavigator } from "@/components/prompt-navigator"
import { type MissionType, type PlanResult, type ProviderKey } from "@/lib/swarm-data"

interface ActivateTabProps {
  dailyBudgetUsed: number
  dailyBudgetTotal: number
  apiUrl: string
  onGeneratePlan: (
    type: MissionType,
    topic: string,
    tier: string,
    domain: string | null,
  ) => Promise<PlanResult>
  onRefinePlan: (planId: string, refinementPrompt: string) => Promise<PlanResult>
  onApproveAndExecute: (
    planId: string,
    type: MissionType,
    topic: string,
    tier: string,
    domain: string | null,
  ) => void
  onActivateProvider: (
    provider: Exclude<ProviderKey, "swarm">,
    topic: string,
    type: MissionType,
  ) => void
}

// ── Provider card definitions ─────────────────────────────────────────────────

type CardDef = {
  key: ProviderKey
  name: string
  description: string
  researchCost: string
  engineeringCost: string
  tag?: string
}

const PROVIDER_CARDS: CardDef[] = [
  {
    key: "swarm",
    name: "Custom Swarm",
    description: "6 parallel LLMs + live web",
    researchCost: "~$0.19",
    engineeringCost: "~$0.00",
    tag: "Plan / Approve",
  },
  {
    key: "openai",
    name: "OpenAI",
    description: "GPT-4o + web search",
    researchCost: "~$0.10",
    engineeringCost: "~$0.15",
  },
  {
    key: "crewai",
    name: "CrewAI",
    description: "3-agent sequential crew",
    researchCost: "~$0.20",
    engineeringCost: "~$0.25",
  },
  {
    key: "pydantic",
    name: "Pydantic AI",
    description: "Type-safe 2-agent pipeline",
    researchCost: "~$0.10",
    engineeringCost: "~$0.15",
  },
  {
    key: "agno",
    name: "Agno",
    description: "Multi-agent team + tools",
    researchCost: "~$0.15",
    engineeringCost: "~$0.20",
  },
  {
    key: "langgraph",
    name: "LangGraph",
    description: "Graph-based with QA loop",
    researchCost: "~$0.18",
    engineeringCost: "~$0.22",
  },
]

// ── Domain packs (Custom Swarm only) ─────────────────────────────────────────

const DOMAIN_PACKS = [
  { key: "general", label: "General Research" },
  { key: "health_science", label: "Health / Science" },
  { key: "trading_finance", label: "Trading / Finance" },
] as const

const researchTiers = [
  { label: "Budget", cost: "~$0.10" },
  { label: "Standard", cost: "~$0.40" },
  { label: "Deep", cost: "~$1.20" },
]

const engineeringTiers = [
  { label: "Standard", cost: "~$3.00" },
  { label: "Heavy", cost: "~$6.00" },
]

type SwarmStep = "input" | "generating" | "review"

type ActiveCard = {
  provider: ProviderKey
  type: MissionType
}

export function ActivateTab({
  dailyBudgetUsed,
  dailyBudgetTotal,
  apiUrl,
  onGeneratePlan,
  onRefinePlan,
  onApproveAndExecute,
  onActivateProvider,
}: ActivateTabProps) {
  // Which card + type is expanded
  const [activeCard, setActiveCard] = useState<ActiveCard | null>(null)

  // Shared topic input across all cards
  const [topic, setTopic] = useState("")

  // Custom Swarm specific state
  const [tier, setTier] = useState("Budget")
  const [domain, setDomain] = useState<string | null>("general")
  const [swarmStep, setSwarmStep] = useState<SwarmStep>("input")
  const [plan, setPlan] = useState<PlanResult | null>(null)
  const [isRefining, setIsRefining] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [showNavigator, setShowNavigator] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // External provider launch state
  const [isLaunching, setIsLaunching] = useState(false)

  const remaining = dailyBudgetTotal - dailyBudgetUsed
  const budgetColor =
    remaining > 5 ? "text-success" : remaining >= 2 ? "text-warning" : "text-destructive"

  // ── Card click handlers ───────────────────────────────────────────────────

  function handleCardClick(provider: ProviderKey, type: MissionType) {
    if (activeCard?.provider === provider && activeCard.type === type) {
      // Same card + type → collapse
      handleReset()
      return
    }
    setActiveCard({ provider, type })
    setTopic("")
    setError(null)
    setSwarmStep("input")
    setPlan(null)
    setIsLaunching(false)
    if (provider === "swarm") {
      setTier(type === "R" ? "Budget" : "Standard")
      setDomain("general")
      setShowNavigator(type === "R")
    }
  }

  function handleReset() {
    setActiveCard(null)
    setTopic("")
    setTier("Budget")
    setDomain("general")
    setSwarmStep("input")
    setPlan(null)
    setIsRefining(false)
    setIsApproving(false)
    setShowNavigator(false)
    setError(null)
    setIsLaunching(false)
  }

  // ── Custom Swarm handlers ─────────────────────────────────────────────────

  async function handleGeneratePlan() {
    if (!topic.trim() || !activeCard) return
    setError(null)
    setSwarmStep("generating")
    try {
      const launchDomain = activeCard.type === "R" ? domain : null
      const generated = await onGeneratePlan(activeCard.type, topic.trim(), tier, launchDomain)
      setPlan(generated)
      setSwarmStep("review")
    } catch (err) {
      setError(`Plan failed: ${err instanceof Error ? err.message : String(err)}`)
      setSwarmStep("input")
    }
  }

  async function handleRefinePlan(refinementPrompt: string) {
    if (!plan) return
    setIsRefining(true)
    setError(null)
    try {
      const refined = await onRefinePlan(plan.id, refinementPrompt)
      setPlan(refined)
    } catch (err) {
      setError(`Refinement failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsRefining(false)
    }
  }

  function handleApproveAndExecute() {
    if (!plan || !activeCard) return
    setIsApproving(true)
    const launchDomain = activeCard.type === "R" ? domain : null
    onApproveAndExecute(plan.id, activeCard.type, topic.trim(), tier, launchDomain)
    setTimeout(handleReset, 300)
  }

  // ── External provider launch ──────────────────────────────────────────────

  function handleProviderRun() {
    if (!topic.trim() || !activeCard || activeCard.provider === "swarm") return
    setIsLaunching(true)
    setError(null)
    onActivateProvider(
      activeCard.provider as Exclude<ProviderKey, "swarm">,
      topic.trim(),
      activeCard.type,
    )
    setTimeout(handleReset, 300)
  }

  // ── Plan review step ──────────────────────────────────────────────────────

  if (swarmStep === "review" && plan && activeCard?.provider === "swarm") {
    return (
      <PlanReview
        plan={plan}
        onRefinePlan={handleRefinePlan}
        onApproveAndExecute={handleApproveAndExecute}
        onBack={handleReset}
        isRefining={isRefining}
        isApproving={isApproving}
      />
    )
  }

  if (swarmStep === "generating" && activeCard?.provider === "swarm") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Planning mission...</p>
        <p className="max-w-xs text-center text-xs text-muted-foreground opacity-60">
          Mission Architect is analyzing your topic and assigning agents
        </p>
      </div>
    )
  }

  // ── Budget display ─────────────────────────────────────────────────────────

  const budgetBar = (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2">
      <span className="text-xs text-muted-foreground">Daily budget</span>
      <span className={`font-mono text-sm ${budgetColor}`}>
        ${remaining.toFixed(2)} remaining of ${dailyBudgetTotal.toFixed(2)}
      </span>
    </div>
  )

  // ── 6-card 2×3 grid ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {budgetBar}

      <div className="grid grid-cols-3 gap-3">
        {PROVIDER_CARDS.map((card) => {
          const isResearchActive = activeCard?.provider === card.key && activeCard.type === "R"
          const isEngineerActive = activeCard?.provider === card.key && activeCard.type === "E"
          const isAnyActive = isResearchActive || isEngineerActive

          return (
            <div key={card.key} className="flex flex-col gap-0">
              {/* Card */}
              <div
                className={`flex flex-col gap-2 rounded-lg border p-4 transition-colors ${
                  isAnyActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{card.name}</span>
                  <span className="text-xs text-muted-foreground">{card.description}</span>
                  {card.tag && (
                    <span className="mt-1 w-fit rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                      {card.tag}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleCardClick(card.key, "R")}
                    className={`flex flex-1 items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      isResearchActive
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span>Research</span>
                    <span className="font-mono opacity-70">{card.researchCost}</span>
                  </button>

                  <button
                    onClick={() => handleCardClick(card.key, "E")}
                    className={`flex flex-1 items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      isEngineerActive
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span>Engineer</span>
                    <span className="font-mono opacity-70">{card.engineeringCost}</span>
                  </button>
                </div>
              </div>

              {/* Inline expansion — only shows for the active card */}
              {isAnyActive && (
                <div className="rounded-b-lg border border-t-0 border-primary/30 bg-card px-4 pb-4 pt-3">
                  {/* Topic input */}
                  <div className="mb-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">
                        {activeCard.type === "R" ? "What to research" : "What to build or design"}
                      </label>
                      {card.key === "swarm" && activeCard.type === "R" && (
                        <button
                          onClick={() => setShowNavigator((v) => !v)}
                          className="text-[11px] text-primary hover:underline"
                        >
                          {showNavigator ? "Hide prompts" : "Browse prompts"}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (card.key === "swarm") {
                            void handleGeneratePlan()
                          } else {
                            handleProviderRun()
                          }
                        }
                      }}
                      placeholder={
                        activeCard.type === "R"
                          ? "e.g. Silver futures institutional flow Feb 2026"
                          : "e.g. Real-time dashboard with WebSocket feeds"
                      }
                      autoFocus
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    {card.key === "swarm" && activeCard.type === "R" && showNavigator && (
                      <div className="mt-2">
                        <PromptNavigator
                          domain={domain}
                          type="R"
                          onTopicSelect={(t) => {
                            setTopic(t)
                            setShowNavigator(false)
                          }}
                          currentTopic={topic}
                          apiUrl={apiUrl}
                        />
                      </div>
                    )}
                  </div>

                  {/* Custom Swarm: tier + domain selectors */}
                  {card.key === "swarm" && (
                    <>
                      <div className="mb-3 flex gap-2">
                        {(activeCard.type === "R" ? researchTiers : engineeringTiers).map((t) => (
                          <button
                            key={t.label}
                            onClick={() => setTier(t.label)}
                            className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                              tier === t.label
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {t.label} {t.cost}
                          </button>
                        ))}
                      </div>

                      {activeCard.type === "R" && (
                        <div className="mb-3 flex gap-2">
                          {DOMAIN_PACKS.map((d) => (
                            <button
                              key={String(d.key)}
                              onClick={() => setDomain(d.key)}
                              className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                                domain === d.key
                                  ? "bg-primary text-primary-foreground"
                                  : "border border-border bg-background text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {error && (
                    <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {error}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {card.key === "swarm" ? (
                      <button
                        onClick={() => void handleGeneratePlan()}
                        disabled={!topic.trim()}
                        className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        Generate Plan →
                      </button>
                    ) : (
                      <button
                        onClick={handleProviderRun}
                        disabled={!topic.trim() || isLaunching}
                        className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        {isLaunching ? "Launching…" : "Run →"}
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      className="rounded-md px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

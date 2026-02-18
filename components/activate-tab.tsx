"use client"

import { useState } from "react"

interface ActivateTabProps {
  dailyBudgetUsed: number
  dailyBudgetTotal: number
  onLaunch: (type: "R" | "E", topic: string, tier: string, domain: string | null) => void
}

const DOMAIN_PACKS = [
  { key: null, label: "General" },
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

export function ActivateTab({ dailyBudgetUsed, dailyBudgetTotal, onLaunch }: ActivateTabProps) {
  const [selected, setSelected] = useState<"research" | "engineering" | null>(null)
  const [topic, setTopic] = useState("")
  const [tier, setTier] = useState<string>("")
  const [domain, setDomain] = useState<string | null>(null)

  const remaining = dailyBudgetTotal - dailyBudgetUsed
  const budgetColor =
    remaining > 5 ? "text-success" : remaining >= 2 ? "text-warning" : "text-destructive"

  function handleSelect(mode: "research" | "engineering") {
    setSelected(mode)
    setTopic("")
    setTier(mode === "research" ? "Budget" : "Standard")
  }

  function handleCancel() {
    setSelected(null)
    setTopic("")
    setTier("")
    setDomain(null)
  }

  function handleApprove() {
    if (!topic.trim()) return
    const launchDomain = selected === "research" ? domain : null
    onLaunch(selected === "research" ? "R" : "E", topic.trim(), tier, launchDomain)
    handleCancel()
  }

  const tiers = selected === "research" ? researchTiers : engineeringTiers

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect("research")}
          className={`flex flex-col gap-3 rounded-lg border p-6 text-left transition-colors ${
            selected === "research"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <span className="text-lg font-medium text-foreground">Research & Discovery</span>
          <span className="text-sm text-muted-foreground">
            Runs 5 AI researchers + live web discovery in parallel
          </span>
        </button>

        <button
          onClick={() => handleSelect("engineering")}
          className={`flex flex-col gap-3 rounded-lg border p-6 text-left transition-colors ${
            selected === "engineering"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <span className="text-lg font-medium text-foreground">Engineering & Build</span>
          <span className="text-sm text-muted-foreground">
            Decomposes a spec and builds it with parallel agents
          </span>
        </button>
      </div>

      {selected && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
          <div>
            <label htmlFor="topic-input" className="mb-2 block text-sm text-muted-foreground">
              {selected === "research"
                ? "What do you want to research?"
                : "Spec path or describe what to build"}
            </label>
            <input
              id="topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApprove()}
              placeholder={
                selected === "research"
                  ? "e.g. Quantum error correction advances 2025-2026"
                  : "e.g. ./specs/auth-proxy.md or describe the project"
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <div className="flex gap-2">
              {tiers.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setTier(t.label)}
                  className={`rounded-md px-4 py-2 font-mono text-sm transition-colors ${
                    tier === t.label
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label} {t.cost}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Team is pre-configured for each tier
            </p>
          </div>

          {selected === "research" && (
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Domain specialization</p>
              <div className="flex gap-2">
                {DOMAIN_PACKS.map((d) => (
                  <button
                    key={String(d.key)}
                    onClick={() => setDomain(d.key)}
                    className={`rounded-md px-4 py-2 font-mono text-sm transition-colors ${
                      domain === d.key
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Swaps each model&apos;s persona and angle for the selected domain
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={!topic.trim()}
                className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Approve
              </button>
              <button
                onClick={handleCancel}
                className="rounded-md px-5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <span className={`font-mono text-sm ${budgetColor}`}>
              Daily budget remaining: ${remaining.toFixed(2)} of ${dailyBudgetTotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

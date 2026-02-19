"use client"

import { useState } from "react"
import { type PlanResult } from "@/lib/swarm-data"

interface PlanReviewProps {
  plan: PlanResult
  onRefinePlan: (refinementPrompt: string) => Promise<void>
  onApproveAndExecute: () => void
  onBack: () => void
  isRefining: boolean
  isApproving: boolean
}

export function PlanReview({
  plan,
  onRefinePlan,
  onApproveAndExecute,
  onBack,
  isRefining,
  isApproving,
}: PlanReviewProps) {
  const [refinementInput, setRefinementInput] = useState("")

  async function handleRefinePlan() {
    const prompt = refinementInput.trim()
    if (!prompt) return
    await onRefinePlan(prompt)
    setRefinementInput("")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back
        </button>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm text-foreground">Mission Plan Review</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{plan.id}</span>
      </div>

      {/* Topic */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Topic</p>
        <p className="text-base font-medium text-foreground">{plan.topic}</p>
        <div className="mt-2 flex gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {plan.type === "R" ? "Research" : "Engineering"}
          </span>
          <span className="font-mono text-xs text-muted-foreground">·</span>
          <span className="font-mono text-xs text-muted-foreground">{plan.tier}</span>
          {plan.domain && (
            <>
              <span className="font-mono text-xs text-muted-foreground">·</span>
              <span className="font-mono text-xs text-muted-foreground">
                {plan.domain.replace("_", " ")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Outcome */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
          Outcome — What Success Looks Like
        </p>
        <p className="text-sm text-foreground">{plan.outcome}</p>
      </div>

      {/* Goals */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Goals</p>
        <ul className="flex flex-col gap-2">
          {plan.goals.map((goal, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground">
              <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{goal}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Agent assignments table */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
          Agent Assignments
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Agent</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 pr-4 font-medium">Focus</th>
                <th className="pb-2 font-medium">Why</th>
              </tr>
            </thead>
            <tbody>
              {plan.agent_assignments.map((a, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/50 last:border-0 ${
                    i % 2 === 0 ? "" : "bg-muted/20"
                  }`}
                >
                  <td className="py-2.5 pr-4 font-mono text-xs text-foreground">{a.agent}</td>
                  <td className="py-2.5 pr-4 text-xs font-medium text-foreground">{a.role}</td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                    <span>{a.focus}</span>
                    {a.avoid && (
                      <span className="mt-0.5 block italic text-muted-foreground/60">
                        avoid: {a.avoid}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground">{a.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget + ETA */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Budget Estimate</p>
          <p className="mt-1 font-mono text-lg text-foreground">
            ~${plan.budget_estimate.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Estimated Time</p>
          <p className="mt-1 font-mono text-lg text-foreground">
            ~{plan.estimated_time_sec}s
          </p>
        </div>
        {plan.type === "E" && (
          <div className="flex-1 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-center">
            <p className="text-xs text-amber-500">Engineering Note</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Execution queued for Phase 3
            </p>
          </div>
        )}
      </div>

      {/* Refinement input */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="mb-2 text-sm text-muted-foreground">
          Want to adjust the plan? Describe what to change.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={refinementInput}
            onChange={(e) => setRefinementInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isRefining && handleRefinePlan()}
            placeholder='e.g. "Focus more on COT data" or "Add a bear case perspective"'
            disabled={isRefining || isApproving}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={handleRefinePlan}
            disabled={!refinementInput.trim() || isRefining || isApproving}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            {isRefining ? "Re-planning..." : "Re-plan"}
          </button>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isRefining || isApproving}
          className="rounded-md px-5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={onApproveAndExecute}
          disabled={isRefining || isApproving}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isApproving ? "Launching..." : "Approve & Execute →"}
        </button>
      </div>
    </div>
  )
}

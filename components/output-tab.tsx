"use client"

import { useState } from "react"
import type { Mission } from "@/lib/swarm-data"

interface OutputTabProps {
  mission: Mission | null
}

export function OutputTab({ mission }: OutputTabProps) {
  const [view, setView] = useState<"synthesis" | "raw">("synthesis")
  const [selectedModel, setSelectedModel] = useState<string>("")

  if (!mission) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Select a mission from the Missions tab to view output.
      </div>
    )
  }

  // Running state
  if (mission.status === "running") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <div className="text-center">
          <p className="font-medium text-foreground">{mission.topic}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dispatching to 4 models in parallel…
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Claude Sonnet · GPT-4o · Gemini Flash · Groq Llama
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">{mission.id}</p>
      </div>
    )
  }

  // Error state
  if (mission.status === "error") {
    return (
      <div className="flex flex-col gap-4 py-10">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">Mission failed</p>
          <p className="mt-2 whitespace-pre-wrap font-mono text-sm text-foreground/80">
            {mission.synthesis || "Unknown error"}
          </p>
        </div>
      </div>
    )
  }

  const models = Object.keys(mission.rawOutputs ?? {})
  const activeModel = selectedModel || models[0] || ""

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-foreground">{mission.id}</span>
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium ${
              mission.type === "R"
                ? "bg-primary/10 text-primary"
                : "bg-warning/10 text-warning"
            }`}
          >
            {mission.type === "R" ? "Research" : "Engineering"}
          </span>
          <span className="font-mono text-sm text-muted-foreground">{mission.date}</span>
          <span className="font-mono text-sm text-muted-foreground">
            ${(mission.cost ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="flex rounded-md border border-border">
          <button
            onClick={() => setView("synthesis")}
            className={`px-4 py-1.5 text-sm transition-colors ${
              view === "synthesis"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Synthesis
          </button>
          <button
            onClick={() => setView("raw")}
            className={`px-4 py-1.5 text-sm transition-colors ${
              view === "raw"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Raw Output
          </button>
        </div>
      </div>

      {/* Model sub-selector for raw view */}
      {view === "raw" && models.length > 0 && (
        <div className="flex gap-2 border-b border-border py-3">
          {models.map((model) => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                activeModel === model
                  ? "border border-border bg-card text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      <div className="min-h-0 flex-1 overflow-auto py-4">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
          {view === "synthesis" ? (mission.synthesis || "") : (mission.rawOutputs?.[activeModel] || "")}
        </pre>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4 font-mono text-xs text-muted-foreground">
        <span>workspace/missions/{mission.id}/synthesis.md</span>
        <span>{mission.id}</span>
      </div>
    </div>
  )
}

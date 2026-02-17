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

  const models = Object.keys(mission.rawOutputs)
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
            ${mission.cost.toFixed(2)}
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
                  ? "bg-card text-foreground border border-border"
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
          {view === "synthesis" ? mission.synthesis : mission.rawOutputs[activeModel] || ""}
        </pre>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4 font-mono text-xs text-muted-foreground">
        <span>
          Saved to: ~/Desktop/missions/{mission.id}/synthesis.md
        </span>
        <span>
          GitHub: workspace/projects/{mission.topic.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}/missions/{mission.id}/
        </span>
      </div>
    </div>
  )
}

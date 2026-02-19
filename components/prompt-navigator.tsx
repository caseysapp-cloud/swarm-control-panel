"use client"

import { useState } from "react"
import { type SuggestResponse, type SuggestionItem, suggestTopics } from "@/lib/swarm-data"

// ── Static template library ────────────────────────────────────────────────

interface TemplateCategory {
  label: string
  templates: string[]
}

const TRADING_FINANCE_TEMPLATES: TemplateCategory[] = [
  {
    label: "Earnings Catalysts",
    templates: [
      "[TICKER] earnings tonight — IV at [X]%, put/call ratio [Y]. Analyze potential 1SD move and sector positioning implications",
      "Pre-earnings UOA on [TICKER]: unusual options activity in [expiry]. Bull or bear thesis validity",
    ],
  },
  {
    label: "Macro Catalysts",
    templates: [
      "FOMC [date] — Fed Funds Futures pricing [X]% cut. Analyze SPY, DXY, and 10Y yield next 5 days",
      "CPI [actual] vs [estimate] — stress test rate-sensitive sectors for next session",
    ],
  },
  {
    label: "Commodity / Metals",
    templates: [
      "Silver SI futures — CFTC COT shows managed money [net long/short]. Convergence with spot price and ETF flow thesis",
      "Gold holding $[level] support — EIA storage data out today. Energy-to-metals rotation thesis",
    ],
  },
  {
    label: "Technical Setups",
    templates: [
      "[TICKER] at key support [level] — options OI clustering at [strike]. Bull or bear case for next 5 trading days",
      "SPY [pattern] at [level] — VIX term structure [shape]. Risk-off signal validity check",
    ],
  },
  {
    label: "Social / Sentiment",
    templates: [
      "X/Twitter sentiment on [ticker] vs COT positioning — is crowd consensus contra-indicator right now?",
      "Retail vs institutional positioning divergence on [ticker] — squeeze setup thesis",
    ],
  },
]

const GENERAL_TEMPLATES: TemplateCategory[] = [
  {
    label: "Technology",
    templates: [
      "[TECHNOLOGY] advances in [year] — key breakthroughs and production timeline implications",
      "Comparison of [A] vs [B] for [use case] — performance, cost, adoption tradeoffs",
    ],
  },
  {
    label: "Research",
    templates: [
      "State of [field] research in [year] — what changed in the last 12 months?",
      "[TOPIC] clinical data [year] — efficacy signals, safety profile, market implications",
    ],
  },
]

function getTemplates(domain: string | null): TemplateCategory[] {
  if (domain === "trading_finance") return TRADING_FINANCE_TEMPLATES
  return GENERAL_TEMPLATES
}

// ── Highlight [brackets] in template text ──────────────────────────────────

function HighlightedTemplate({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={i} className="rounded bg-primary/20 px-0.5 font-mono text-primary">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  )
}

// ── Quality badge ──────────────────────────────────────────────────────────

function QualityBadge({ quality }: { quality: SuggestResponse["quality"] }) {
  if (quality === "good") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
        Good topic
      </span>
    )
  }
  if (quality === "vague") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
        Vague — consider sharpening
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
      Too broad — pick a specific angle
    </span>
  )
}

// ── Suggestion card ────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onSelect,
}: {
  suggestion: SuggestionItem
  onSelect: (template: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(suggestion.template)}
      className="w-full rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
    >
      <p className="mb-1 text-sm font-medium text-foreground">{suggestion.title}</p>
      <p className="mb-2 text-xs text-muted-foreground">{suggestion.why_better}</p>
      <p className="text-xs text-muted-foreground/80">
        <HighlightedTemplate text={suggestion.template} />
      </p>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export interface PromptNavigatorProps {
  domain: string | null
  type: "R" | "E"
  onTopicSelect: (topic: string) => void
  currentTopic?: string
  apiUrl: string
}

type NavMode = "templates" | "ai-check"
type CheckState = "idle" | "loading" | "done" | "error"

export function PromptNavigator({
  domain,
  type,
  onTopicSelect,
  currentTopic,
  apiUrl,
}: PromptNavigatorProps) {
  const [activeMode, setActiveMode] = useState<NavMode>("templates")
  const [checkState, setCheckState] = useState<CheckState>("idle")
  const [checkResult, setCheckResult] = useState<SuggestResponse | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)

  const categories = getTemplates(domain)

  async function handleCheckTopic() {
    const topicToCheck = currentTopic?.trim()
    if (!topicToCheck) return
    if (!apiUrl) {
      setActiveMode("ai-check")
      setCheckState("error")
      setCheckResult(null)
      setCheckError("API not configured. Set NEXT_PUBLIC_API_URL.")
      return
    }
    setActiveMode("ai-check")
    setCheckState("loading")
    setCheckResult(null)
    setCheckError(null)
    try {
      const result = await suggestTopics(apiUrl, topicToCheck, domain, type)
      setCheckResult(result)
      setCheckState("done")
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : String(err))
      setCheckState("error")
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header tabs */}
      <div className="flex items-center gap-0 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveMode("templates")}
          className={`px-4 py-2.5 text-xs font-medium transition-colors ${
            activeMode === "templates"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Browse templates
        </button>
        <button
          type="button"
          onClick={handleCheckTopic}
          disabled={!currentTopic?.trim() || checkState === "loading"}
          className={`px-4 py-2.5 text-xs font-medium transition-colors disabled:opacity-40 ${
            activeMode === "ai-check"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {checkState === "loading" ? "Evaluating..." : "Check my topic"}
        </button>
      </div>

      <div className="p-4">
        {/* Template library mode */}
        {activeMode === "templates" && (
          <div className="flex flex-col gap-4">
            {categories.map((cat) => (
              <div key={cat.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {cat.label}
                </p>
                <div className="flex flex-col gap-1.5">
                  {cat.templates.map((tmpl, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => onTopicSelect(tmpl)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    >
                      <HighlightedTemplate text={tmpl} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI check mode */}
        {activeMode === "ai-check" && (
          <div className="flex flex-col gap-3">
            {checkState === "loading" && (
              <div className="flex items-center gap-2 py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Evaluating topic specificity...</p>
              </div>
            )}

            {checkState === "error" && (
              <p className="text-sm text-destructive">Check failed: {checkError}</p>
            )}

            {checkState === "done" && checkResult && (
              <>
                <div className="flex items-center gap-2">
                  <QualityBadge quality={checkResult.quality} />
                  {checkResult.issues.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {checkResult.issues.join(" · ")}
                    </p>
                  )}
                </div>

                {checkResult.quality === "good" && checkResult.suggestions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Your topic is well-specified. The swarm should produce strong signal.
                  </p>
                )}

                {checkResult.suggestions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                      Click a suggestion to use it as your topic:
                    </p>
                    {checkResult.suggestions.map((s, i) => (
                      <SuggestionCard
                        key={i}
                        suggestion={s}
                        onSelect={onTopicSelect}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

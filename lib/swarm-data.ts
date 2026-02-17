export type MissionType = "R" | "E"

export interface ModelCost {
  model: string
  role: string
  tokens: number
  cost: number
}

export interface Mission {
  id: string
  type: MissionType
  topic: string
  date: string
  cost: number
  synthesis: string
  rawOutputs: Record<string, string>
  modelCosts: ModelCost[]
}

export const MODELS_RESEARCH = ["Claude Sonnet", "GPT-4o", "Gemini Pro", "Groq Llama"]
export const MODELS_ENGINEERING = ["Claude Sonnet", "GPT-4o", "Gemini Pro"]

export const SAMPLE_MISSIONS: Mission[] = [
  {
    id: "swm-0042",
    type: "R",
    topic: "Quantum error correction advances 2025-2026",
    date: "2026-02-17",
    cost: 0.38,
    synthesis:
      "## Quantum Error Correction: Recent Advances\n\nThe landscape of quantum error correction (QEC) has shifted dramatically in the past 18 months. Key developments include:\n\n### Surface Codes at Scale\nGoogle's Willow processor demonstrated below-threshold error rates on a 105-qubit surface code, achieving logical error rates of 10^-6 per round. This represents a 10x improvement over their 2024 results.\n\n### Hardware-Efficient Codes\nBosonic codes, particularly the GKP (Gottesman-Kitaev-Preskill) encoding, have shown promise in reducing qubit overhead. AWS's Ocelot chip achieved break-even error correction using cat qubits with only 1/10th the physical qubit overhead of surface codes.\n\n### Real-Time Decoding\nMajor progress in decoder speed: Microsoft's Floquet code decoders now operate at sub-microsecond latencies, enabling real-time error correction for the first time in a practical quantum computing context.\n\n### Implications\nThese advances suggest fault-tolerant quantum computing may arrive 3-5 years earlier than 2023 projections indicated. The remaining bottleneck is scaling physical qubit counts while maintaining coherence times.",
    rawOutputs: {
      "Claude Sonnet":
        "Based on my analysis of recent publications and preprints, the most significant advance in quantum error correction has been the demonstration of below-threshold performance on surface codes. Google's December 2025 paper showed their 105-qubit Willow processor achieving logical error rates of approximately 10^-6...\n\nThe GKP encoding approach being pursued by AWS and others represents a potentially disruptive alternative. By encoding quantum information in the continuous variables of bosonic modes, these approaches dramatically reduce the physical qubit overhead required for fault tolerance.\n\nKey papers to review:\n- Acharya et al. (2025) Nature Physics\n- Sivak et al. (2025) PRX Quantum\n- Ryan-Anderson et al. (2026) arXiv preprint",
      "GPT-4o":
        "Quantum error correction in 2025-2026 has seen three major threads of development:\n\n1. **Surface code scaling**: The Google Quantum AI team demonstrated a critical milestone with their Willow chip. Error rates scaled favorably as code distance increased from d=3 to d=7, definitively proving the theoretical predictions about surface code scaling.\n\n2. **Alternative architectures**: Microsoft's topological approach using Floquet codes showed real-time decoding capability. This is crucial because practical quantum computing requires decoders that can keep pace with physical error rates.\n\n3. **Hybrid approaches**: Several groups are now exploring combinations of hardware-efficient (bosonic) codes with concatenated surface codes, potentially offering the best of both worlds.",
      "Gemini Pro":
        "My analysis of the quantum error correction landscape reveals a field in rapid transition. The key developments center around three axes:\n\nPerformance: Below-threshold demonstrations are now reproducible across multiple platforms (superconducting, trapped ion, photonic). This was not the case even 12 months ago.\n\nEfficiency: New code families and encoding strategies are reducing resource requirements. The most notable is the cat qubit approach used in AWS Ocelot, which achieved break-even with dramatically fewer physical qubits.\n\nSpeed: Real-time decoding has moved from theoretical possibility to experimental reality, with latencies now compatible with the coherence times of the best qubits.",
      "Groq Llama":
        "Here's a summary of QEC advances:\n\n- Surface codes are working at scale (Google Willow, 105 qubits, below threshold)\n- Bosonic codes reducing overhead by 10x (AWS Ocelot)\n- Real-time decoding achieved (Microsoft Floquet codes, sub-microsecond)\n- Multiple platforms showing below-threshold performance\n- Fault-tolerant QC timeline moved up by 3-5 years vs 2023 estimates\n\nMain remaining challenges: scaling qubit counts while maintaining coherence, improving classical control systems, reducing cryogenic cooling requirements.",
    },
    modelCosts: [
      { model: "Claude Sonnet", role: "Analyst", tokens: 12400, cost: 0.11 },
      { model: "GPT-4o", role: "Analyst", tokens: 11800, cost: 0.10 },
      { model: "Gemini Pro", role: "Analyst", tokens: 10200, cost: 0.09 },
      { model: "Groq Llama", role: "Summarizer", tokens: 8600, cost: 0.08 },
    ],
  },
  {
    id: "swm-0041",
    type: "E",
    topic: "CLI dashboard tool with real-time metrics",
    date: "2026-02-16",
    cost: 4.52,
    synthesis:
      "## CLI Dashboard Tool: Build Complete\n\nSuccessfully built a terminal-based dashboard tool with the following components:\n\n### Architecture\n- Rust-based CLI using `ratatui` for TUI rendering\n- Async runtime with `tokio` for concurrent metric collection\n- Plugin system for custom metric sources\n\n### Features Implemented\n- Real-time CPU, memory, disk, and network monitoring\n- Configurable layout via TOML files\n- Sparkline and bar chart visualizations\n- Alert thresholds with terminal notifications\n- Cross-platform support (Linux, macOS, Windows)\n\n### Testing\n- 47 unit tests, all passing\n- Integration tests covering metric collection and rendering\n- Benchmarks showing <2ms render time per frame at 60fps",
    rawOutputs: {
      "Claude Sonnet":
        "I've designed the architecture for the CLI dashboard tool. The key decisions:\n\n1. Language: Rust for performance and cross-platform support\n2. TUI Framework: ratatui (successor to tui-rs)\n3. Async: tokio for non-blocking metric collection\n4. Config: TOML for layout and alert configuration\n\nProject structure:\n```\nsrc/\n  main.rs\n  app.rs\n  metrics/\n    cpu.rs\n    memory.rs\n    disk.rs\n    network.rs\n  ui/\n    layout.rs\n    widgets.rs\n    sparkline.rs\n  config/\n    mod.rs\n    schema.rs\n  plugins/\n    mod.rs\n    loader.rs\n```",
      "GPT-4o":
        "Implementation of core metric collection modules complete. Each module follows the async trait pattern:\n\n```rust\n#[async_trait]\npub trait MetricSource {\n    async fn collect(&self) -> Result<MetricData>;\n    fn name(&self) -> &str;\n    fn interval(&self) -> Duration;\n}\n```\n\nAll four metric sources (CPU, memory, disk, network) are implemented and tested. The plugin system allows external metric sources via dynamic loading.",
      "Gemini Pro":
        "UI rendering layer complete. Key widgets implemented:\n\n- Sparkline: Compact time-series visualization\n- BarChart: Comparative metric display\n- AlertBadge: Color-coded threshold indicators\n- StatusLine: System summary footer\n\nThe layout engine reads TOML config and dynamically arranges widgets. Tested render performance: consistently under 2ms per frame.",
    },
    modelCosts: [
      { model: "Claude Sonnet", role: "Architect", tokens: 45200, cost: 1.62 },
      { model: "GPT-4o", role: "Implementer", tokens: 38100, cost: 1.45 },
      { model: "Gemini Pro", role: "Implementer", tokens: 32400, cost: 1.22 },
      { model: "Groq Llama", role: "Tester", tokens: 5800, cost: 0.23 },
    ],
  },
  {
    id: "swm-0040",
    type: "R",
    topic: "Comparison of vector database architectures",
    date: "2026-02-15",
    cost: 1.15,
    synthesis:
      "## Vector Database Architecture Comparison\n\nAnalyzed five major vector database architectures across performance, scalability, and cost dimensions.\n\n### Key Findings\n\n| Database | Index Type | QPS (1M vectors) | P99 Latency | Cost/month |\n|----------|-----------|-------------------|-------------|------------|\n| Pinecone | Proprietary | 12,000 | 8ms | $70 |\n| Weaviate | HNSW | 9,500 | 12ms | $45 |\n| Qdrant | HNSW+Quantization | 11,200 | 9ms | $35 |\n| Milvus | IVF_FLAT/HNSW | 10,800 | 10ms | $40 |\n| pgvector | IVF_FLAT/HNSW | 4,200 | 25ms | $20 |\n\n### Recommendations\n- High-throughput production: Qdrant or Pinecone\n- Cost-sensitive: pgvector with proper indexing\n- Hybrid search needs: Weaviate\n- Self-hosted flexibility: Milvus",
    rawOutputs: {
      "Claude Sonnet": "Detailed architectural analysis of vector database indexing strategies...",
      "GPT-4o": "Performance benchmarking results across standardized workloads...",
      "Gemini Pro": "Cost analysis and scaling characteristics for each platform...",
      "Groq Llama": "Quick summary of recommendations based on use case categories...",
    },
    modelCosts: [
      { model: "Claude Sonnet", role: "Analyst", tokens: 28400, cost: 0.42 },
      { model: "GPT-4o", role: "Analyst", tokens: 24100, cost: 0.31 },
      { model: "Gemini Pro", role: "Analyst", tokens: 19800, cost: 0.24 },
      { model: "Groq Llama", role: "Summarizer", tokens: 12600, cost: 0.18 },
    ],
  },
  {
    id: "swm-0039",
    type: "R",
    topic: "State of WebAssembly in production 2026",
    date: "2026-02-14",
    cost: 0.41,
    synthesis:
      "## WebAssembly in Production: 2026 State of the Art\n\nWasm adoption has reached an inflection point in production environments.\n\n### Browser Adoption\n- Wasm GC is now supported in all major browsers, enabling languages like Kotlin, Dart, and Java to compile directly to Wasm without bundling a GC runtime.\n- Component Model is in Stage 3, enabling true polyglot component composition.\n\n### Server-Side\n- Spin 3.0 and Wasmtime have achieved near-native performance for HTTP workloads.\n- Cold start times of <1ms make Wasm competitive with pre-warmed containers.\n\n### Edge Computing\n- Cloudflare Workers, Fastly Compute, and Vercel Edge Functions all support Wasm modules.\n- Average latency reduction of 40% compared to equivalent Node.js implementations.",
    rawOutputs: {
      "Claude Sonnet": "Comprehensive overview of browser and server-side Wasm developments...",
      "GPT-4o": "Analysis of production deployment patterns and performance metrics...",
      "Gemini Pro": "Edge computing use cases and benchmark comparisons...",
      "Groq Llama": "Summary of adoption trends and developer ecosystem growth...",
    },
    modelCosts: [
      { model: "Claude Sonnet", role: "Analyst", tokens: 11200, cost: 0.12 },
      { model: "GPT-4o", role: "Analyst", tokens: 10400, cost: 0.11 },
      { model: "Gemini Pro", role: "Analyst", tokens: 9100, cost: 0.10 },
      { model: "Groq Llama", role: "Summarizer", tokens: 7200, cost: 0.08 },
    ],
  },
  {
    id: "swm-0038",
    type: "E",
    topic: "OAuth2 proxy service with PKCE support",
    date: "2026-02-13",
    cost: 3.18,
    synthesis:
      "## OAuth2 Proxy Service: Build Complete\n\nDelivered a lightweight OAuth2 proxy that handles PKCE flows, token refresh, and multi-provider support.\n\n### Stack\n- Go 1.23, net/http stdlib\n- Redis for session storage\n- YAML configuration for provider registration\n\n### Supported Providers\n- Google, GitHub, Microsoft, Apple, Generic OIDC\n\n### Security Features\n- PKCE (S256) for all authorization code flows\n- Encrypted session cookies (AES-256-GCM)\n- CSRF protection via state parameter\n- Token rotation on refresh",
    rawOutputs: {
      "Claude Sonnet": "Architecture design and security model for the OAuth2 proxy...",
      "GPT-4o": "Core implementation of PKCE flow and token management...",
      "Gemini Pro": "Provider adapter layer and configuration system...",
    },
    modelCosts: [
      { model: "Claude Sonnet", role: "Architect", tokens: 38200, cost: 1.15 },
      { model: "GPT-4o", role: "Implementer", tokens: 34100, cost: 1.08 },
      { model: "Gemini Pro", role: "Implementer", tokens: 28400, cost: 0.95 },
    ],
  },
]

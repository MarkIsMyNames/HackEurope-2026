import { PromptEntry } from "@/data/mockData";
import { CheckCircle, XCircle, Brain, Scan, AlertTriangle, ShieldX } from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";

interface AnalysisPanelProps {
  prompt: PromptEntry | null;
}

function ValidationRow({ label, status }: { label: string; status: "pass" | "fail" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {status === "pass" ? (
          <>
            <CheckCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono text-primary">PASS</span>
          </>
        ) : (
          <>
            <XCircle className="w-3.5 h-3.5 text-danger" />
            <span className="text-xs font-mono text-danger">FAIL</span>
          </>
        )}
      </div>
    </div>
  );
}

export function AnalysisPanel({ prompt }: AnalysisPanelProps) {
  if (!prompt) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <Scan className="w-10 h-10 opacity-30" />
        <p className="text-sm">Submit text to analyse it</p>
      </div>
    );
  }

  const radarData = [
    { metric: "Length",     value: prompt.heuristics.length },
    { metric: "Complexity", value: prompt.heuristics.complexity },
    { metric: "Ctx Shift",  value: prompt.heuristics.contextualShift },
    { metric: "Entropy",    value: prompt.heuristics.entropy },
    { metric: "Repetition", value: prompt.heuristics.repetition },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Detailed Analysis</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">Risk Score:</span>
          <span className={`text-sm font-mono font-bold ${
            prompt.riskScore > 60 ? "text-danger" : prompt.riskScore > 30 ? "text-warning" : "text-primary"
          }`}>
            {prompt.riskScore}/100
          </span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Original input */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Original Input</h3>
          <div className="bg-secondary rounded-md p-3 border border-border">
            <p className="text-sm font-mono text-foreground leading-relaxed break-all">{prompt.snippet}</p>
          </div>
        </div>

        {/* Sanitized output */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sanitized Output</h3>
          <div className={`rounded-md p-3 border ${prompt.flagged ? "bg-secondary border-danger/30" : "gradient-safe border-primary/20"}`}>
            <p className="text-sm font-mono text-foreground leading-relaxed break-all">
              {prompt.sanitized || <span className="text-muted-foreground italic">Empty — entire input was injection</span>}
            </p>
          </div>
        </div>

        {/* Injections removed */}
        {prompt.injections.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldX className="w-3.5 h-3.5 text-danger" />
              Injections Removed ({prompt.injections.length})
            </h3>
            <div className="space-y-2">
              {prompt.injections.map((inj, i) => (
                <div key={i} className="gradient-danger border border-danger/20 rounded-md px-3 py-2">
                  <p className="text-xs font-mono text-danger break-all">{inj}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Validation */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" />
            Input Validation
          </h3>
          <div className="bg-secondary rounded-md border border-border px-4 py-1">
            <ValidationRow label="Character Filtering" status={prompt.validation.characterFiltering} />
            <ValidationRow label="Encoding Check"      status={prompt.validation.encodingCheck} />
          </div>
        </div>

        {/* Heuristic Radar */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Heuristic Analysis
          </h3>
          <div className="bg-secondary rounded-md border border-border p-4">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(215 28% 20%)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "hsl(215 20% 55%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke={prompt.riskScore > 60 ? "hsl(347 77% 50%)" : "hsl(160 84% 39%)"}
                  fill={prompt.riskScore > 60 ? "hsl(347 77% 50%)" : "hsl(160 84% 39%)"}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ML Insight */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5" />
            ML Model Insight
          </h3>
          <div className={`rounded-md border p-4 ${prompt.flagged ? "gradient-danger border-danger/20" : "gradient-safe border-primary/20"}`}>
            <p className="text-sm text-foreground leading-relaxed">{prompt.mlInsight}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                prompt.flagged ? "bg-danger/20 text-danger" : "bg-primary/20 text-primary"
              }`}>
                {prompt.flagged ? "FLAGGED" : "CLEAR"}
              </span>
            </div>
          </div>
        </div>

        {/* Downstream model output */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Downstream LLM Output</h3>
          <div className="bg-secondary rounded-md p-3 border border-border">
            <p className="text-sm font-mono text-foreground leading-relaxed break-all">
              {prompt.downstreamOutput?.trim() || <span className="text-muted-foreground italic">Unavailable — downstream model not configured</span>}
            </p>
          </div>
        </div>

        {/* Safety review */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Output Safety Review</h3>
          <div className={`rounded-md border p-4 ${prompt.safetyReview?.safe ? "gradient-safe border-primary/20" : "gradient-danger border-danger/20"}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-foreground leading-relaxed">{prompt.safetyReview?.reason || "Safety review unavailable"}</p>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded whitespace-nowrap ${prompt.safetyReview?.safe ? "bg-primary/20 text-primary" : "bg-danger/20 text-danger"}`}>
                {(prompt.safetyReview?.verdict || "unknown").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

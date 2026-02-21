import { ShieldCheck, ShieldAlert, Gauge, BrainCircuit } from "lucide-react";

interface MetricCardsProps {
  totalPrompts: number;
  threatsBlocked: number;
  avgRiskScore: number;
  anomalyConfidence: number;
}

export function MetricCards({ totalPrompts, threatsBlocked, avgRiskScore, anomalyConfidence }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 p-6">
      {/* Total Prompts */}
      <div className="gradient-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Analyzed</span>
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <p className="text-3xl font-semibold font-mono text-foreground animate-counter">
          {totalPrompts.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">+12.3% from last hour</p>
      </div>

      {/* Threats Blocked */}
      <div className="gradient-danger rounded-lg border border-danger/20 p-5 glow-danger">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Threats Blocked</span>
          <ShieldAlert className="w-4 h-4 text-danger" />
        </div>
        <p className="text-3xl font-semibold font-mono text-danger animate-counter">
          {threatsBlocked}
        </p>
        <p className="text-xs text-danger/70 mt-1">3 in the last 5 minutes</p>
      </div>

      {/* Avg Risk Score */}
      <div className="gradient-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Risk Score</span>
          <Gauge className="w-4 h-4 text-warning" />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-3xl font-semibold font-mono text-foreground animate-counter">{avgRiskScore}</p>
          <div className="flex-1">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${avgRiskScore}%`,
                  background: avgRiskScore > 60
                    ? "hsl(var(--danger))"
                    : avgRiskScore > 30
                    ? "hsl(var(--warning))"
                    : "hsl(var(--safe))",
                }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Scale: 0–100</p>
      </div>

      {/* Anomaly Confidence */}
      <div className="gradient-safe rounded-lg border border-primary/20 p-5 glow-safe">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Anomaly Detection</span>
          <BrainCircuit className="w-4 h-4 text-primary" />
        </div>
        <p className="text-3xl font-semibold font-mono text-primary animate-counter">
          {anomalyConfidence}%
        </p>
        <p className="text-xs text-primary/70 mt-1">Model v2.4 — Active</p>
      </div>
    </div>
  );
}

import { ShieldCheck, ShieldAlert, Gauge } from "lucide-react";

interface MetricCardsProps {
  totalPrompts: number;
  threatsBlocked: number;
  avgRiskScore: number;
  totalInjections: number;
}

export function MetricCards({ totalPrompts, threatsBlocked, avgRiskScore, totalInjections }: MetricCardsProps) {
  const threatRate = totalPrompts > 0 ? Math.round((threatsBlocked / totalPrompts) * 100) : 0;
  const riskLabel = avgRiskScore > 60 ? "High" : avgRiskScore > 30 ? "Medium" : "Low";
  const riskLabelColor = avgRiskScore > 60 ? "text-danger" : avgRiskScore > 30 ? "text-warning" : "text-primary";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 w-full">

      {/* Total Prompts */}
      <div className="gradient-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Analyzed</span>
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <p className="text-3xl font-semibold font-mono text-foreground">
          {totalPrompts.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {totalInjections > 0
            ? `${totalInjections} injection${totalInjections !== 1 ? "s" : ""} stripped`
            : totalPrompts > 0 ? "No injections found" : "No submissions yet"}
        </p>
      </div>

      {/* Threats Blocked */}
      <div className="gradient-danger rounded-lg border border-danger/20 p-5 glow-danger">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Threats Blocked</span>
          <ShieldAlert className="w-4 h-4 text-danger" />
        </div>
        <p className="text-3xl font-semibold font-mono text-danger">
          {threatsBlocked}
        </p>
        <p className="text-xs text-danger/70 mt-1">
          {totalPrompts > 0 ? `${threatRate}% of submissions` : "No submissions yet"}
        </p>
      </div>

      {/* Avg Risk Score */}
      <div className="gradient-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Risk Score</span>
          <Gauge className="w-4 h-4 text-warning" />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-3xl font-semibold font-mono text-foreground">{avgRiskScore}</p>
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
        <p className={`text-xs mt-1 font-mono ${totalPrompts > 0 ? riskLabelColor : "text-muted-foreground"}`}>
          {totalPrompts > 0 ? `${riskLabel} risk average` : "No submissions yet"}
        </p>
      </div>

    </div>
  );
}

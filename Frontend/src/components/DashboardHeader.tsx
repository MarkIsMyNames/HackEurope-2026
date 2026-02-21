import { Shield, Activity, Zap } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Guardian LLM
          </h1>
          <p className="text-xs text-muted-foreground">Prompt Injection Defense</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <span>Live Monitoring</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-sm">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">System Health:</span>
          <span className="text-primary font-mono font-medium">98.7%</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-sm">
          <Zap className="w-3.5 h-3.5 text-warning" />
          <span className="text-muted-foreground">Latency:</span>
          <span className="text-foreground font-mono font-medium">12ms</span>
        </div>
      </div>
    </header>
  );
}

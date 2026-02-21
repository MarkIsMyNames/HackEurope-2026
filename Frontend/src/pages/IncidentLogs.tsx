import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { fetchInjections } from "@/lib/api";
import { ShieldX, Inbox } from "lucide-react";

const IncidentLogs = () => {
  const { data: injections = [], isLoading } = useQuery({
    queryKey: ["injections"],
    queryFn: fetchInjections,
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <div className="p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Incident Logs</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              All unique injection fragments detected and removed across every run.
            </p>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : injections.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 mt-24 text-muted-foreground">
              <Inbox className="w-10 h-10 opacity-30" />
              <p className="text-sm">No injections logged yet.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <ShieldX className="w-3.5 h-3.5 text-danger" />
                  Detected Injections
                </span>
                <span className="text-xs font-mono text-muted-foreground">{injections.length} unique</span>
              </div>
              <div className="divide-y divide-border">
                {injections.map((inj, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-start gap-4">
                    <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5 w-6 text-right">
                      {i + 1}
                    </span>
                    <p className="text-sm font-mono text-danger break-all">{inj}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentLogs;

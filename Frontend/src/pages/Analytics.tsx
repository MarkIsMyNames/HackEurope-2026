import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { fetchHistory } from "@/lib/api";
import { PromptEntry } from "@/data/mockData";

const chartConfig = {
  totalAnalysed: { label: "Total Analysed", color: "hsl(217 91% 60%)" },
  threatsBlocked: { label: "Threats Blocked", color: "hsl(347 77% 50%)" },
  avgRiskScore: { label: "Avg Risk Score", color: "hsl(38 92% 50%)" },
  highestRisk: { label: "Highest Risk Score", color: "hsl(347 77% 65%)" },
};

interface DayBucket {
  day: string;
  totalAnalysed: number;
  threatsBlocked: number;
  avgRiskScore: number;
  highestRisk: number;
}

function aggregateByDay(entries: PromptEntry[]): DayBucket[] {
  const dayMap = new Map<
    string,
    { label: string; totalAnalysed: number; threatsBlocked: number; riskScores: number[] }
  >();

  for (const entry of entries) {
    const date = new Date(entry.timestamp);
    const isoDay = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    if (!dayMap.has(isoDay)) {
      dayMap.set(isoDay, { label, totalAnalysed: 0, threatsBlocked: 0, riskScores: [] });
    }
    const bucket = dayMap.get(isoDay)!;
    bucket.totalAnalysed++;
    if (entry.riskLevel === "high") bucket.threatsBlocked++;
    bucket.riskScores.push(entry.riskScore);
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) => ({
      day: bucket.label,
      totalAnalysed: bucket.totalAnalysed,
      threatsBlocked: bucket.threatsBlocked,
      avgRiskScore:
        bucket.riskScores.length > 0
          ? Math.round(
              bucket.riskScores.reduce((a, b) => a + b, 0) / bucket.riskScores.length
            )
          : 0,
      highestRisk:
        bucket.riskScores.length > 0 ? Math.max(...bucket.riskScores) : 0,
    }));
}

const Analytics = () => {
  const { data: history = [], isLoading, isError } = useQuery({
    queryKey: ["history"],
    queryFn: fetchHistory,
    refetchInterval: 10000,
  });

  const chartData = aggregateByDay(history);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {history.length} total entries
            </span>
          </div>

          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading history...</p>
          )}
          {isError && (
            <p className="text-sm text-danger">Failed to load history from backend.</p>
          )}

          {!isLoading && !isError && chartData.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No data yet. Submit some prompts on the dashboard to see analytics here.
            </p>
          )}

          {chartData.length > 0 && (
            <>
              {/* Total Analysed */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Prompts Analysed</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 16%)" />
                      <XAxis dataKey="day" stroke="hsl(215 20% 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215 20% 55%)" fontSize={12} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="totalAnalysed" fill="var(--color-totalAnalysed)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Threats Blocked & Highest Risk */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Threats Blocked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[220px] w-full">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 16%)" />
                        <XAxis dataKey="day" stroke="hsl(215 20% 55%)" fontSize={12} />
                        <YAxis stroke="hsl(215 20% 55%)" fontSize={12} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="threatsBlocked" fill="var(--color-threatsBlocked)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Highest Risk Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[220px] w-full">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 16%)" />
                        <XAxis dataKey="day" stroke="hsl(215 20% 55%)" fontSize={12} />
                        <YAxis stroke="hsl(215 20% 55%)" fontSize={12} domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="highestRisk"
                          stroke="var(--color-highestRisk)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-highestRisk)", r: 4 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Avg Risk Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Risk Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 16%)" />
                      <XAxis dataKey="day" stroke="hsl(215 20% 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215 20% 55%)" fontSize={12} domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="avgRiskScore"
                        stroke="var(--color-avgRiskScore)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-avgRiskScore)", r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;

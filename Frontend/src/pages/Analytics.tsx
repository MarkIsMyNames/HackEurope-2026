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
  Cell,
} from "recharts";
import { fetchHistory } from "@/lib/api";
import { PromptEntry } from "@/data/mockData";
import { BarChart3, ShieldX } from "lucide-react";

const GRID = "hsl(215 28% 16%)";
const AXIS = "hsl(215 20% 55%)";

const chartConfig = {
  totalAnalysed: { label: "Total Analysed",    color: "hsl(217 91% 60%)"  },
  threatsBlocked:{ label: "Threats Blocked",   color: "hsl(347 77% 50%)"  },
  avgRiskScore:  { label: "Avg Risk Score",    color: "hsl(38 92% 50%)"   },
  highestRisk:   { label: "Highest Risk Score",color: "hsl(347 77% 65%)"  },
  riskScore:     { label: "Risk Score",        color: "hsl(38 92% 50%)"   },
  injections:    { label: "Injections",        color: "hsl(347 77% 50%)"  },
  pass:          { label: "Pass",              color: "hsl(160 84% 39%)"  },
  fail:          { label: "Fail",              color: "hsl(347 77% 50%)"  },
  count:         { label: "Count",             color: "hsl(217 91% 60%)"  },
};

const RISK_COLORS: Record<string, string> = {
  Low:    "hsl(160 84% 39%)",
  Medium: "hsl(38 92% 50%)",
  High:   "hsl(347 77% 50%)",
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
          ? Math.round(bucket.riskScores.reduce((a, b) => a + b, 0) / bucket.riskScores.length)
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

  // Per-submission data (chronological)
  const submissionData = [...history].reverse().map((p, i) => ({
    index: i + 1,
    riskScore: p.riskScore,
    injections: p.injections.length,
  }));

  // Risk level distribution
  const riskLevelData = [
    { level: "Low",    count: history.filter((p) => p.riskLevel === "low").length    },
    { level: "Medium", count: history.filter((p) => p.riskLevel === "medium").length },
    { level: "High",   count: history.filter((p) => p.riskLevel === "high").length   },
  ];

  // Flagged rate
  const flaggedCount = history.filter((p) => p.flagged).length;
  const flaggedRate  = history.length > 0 ? Math.round((flaggedCount / history.length) * 100) : 0;

  // Validation failure rates
  const validationData = [
    {
      check: "Char Filtering",
      pass: history.filter((p) => p.validation.characterFiltering === "pass").length,
      fail: history.filter((p) => p.validation.characterFiltering === "fail").length,
    },
    {
      check: "Encoding Check",
      pass: history.filter((p) => p.validation.encodingCheck === "pass").length,
      fail: history.filter((p) => p.validation.encodingCheck === "fail").length,
    },
  ];

  // Top injection strings by frequency
  const injectionFreq = new Map<string, number>();
  history.forEach((p) =>
    p.injections.forEach((inj) =>
      injectionFreq.set(inj, (injectionFreq.get(inj) ?? 0) + 1)
    )
  );
  const topInjections = [...injectionFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([text, count]) => ({ text, count }));

  const hasInjections = topInjections.length > 0;

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
            <p className="text-sm text-muted-foreground">Loading history…</p>
          )}
          {isError && (
            <p className="text-sm text-danger">Failed to load history from backend.</p>
          )}

          {!isLoading && !isError && history.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 mt-24 text-muted-foreground">
              <BarChart3 className="w-12 h-12 opacity-20" />
              <p className="text-sm">No data yet. Submit some prompts on the dashboard to see analytics here.</p>
            </div>
          )}

          {history.length > 0 && (
            <>
              {/* Daily totals */}
              {chartData.length > 0 && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Prompts Analysed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                          <XAxis dataKey="day" stroke={AXIS} fontSize={12} />
                          <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="totalAnalysed" fill="var(--color-totalAnalysed)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Threats Blocked</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-[220px] w-full">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                            <XAxis dataKey="day" stroke={AXIS} fontSize={12} />
                            <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
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
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                            <XAxis dataKey="day" stroke={AXIS} fontSize={12} />
                            <YAxis stroke={AXIS} fontSize={12} domain={[0, 100]} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="highestRisk" stroke="var(--color-highestRisk)" strokeWidth={2} dot={{ fill: "var(--color-highestRisk)", r: 4 }} />
                          </LineChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Average Risk Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[220px] w-full">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                          <XAxis dataKey="day" stroke={AXIS} fontSize={12} />
                          <YAxis stroke={AXIS} fontSize={12} domain={[0, 100]} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="avgRiskScore" stroke="var(--color-avgRiskScore)" strokeWidth={2} dot={{ fill: "var(--color-avgRiskScore)", r: 4 }} />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Risk level distribution + Flagged rate */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Risk Level Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[240px] w-full">
                      <BarChart data={riskLevelData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                        <XAxis dataKey="level" stroke={AXIS} fontSize={12} />
                        <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {riskLevelData.map((entry) => (
                            <Cell key={entry.level} fill={RISK_COLORS[entry.level]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-center h-[240px] gap-5 px-6">
                    <div className="flex items-end gap-3">
                      <span className={`text-6xl font-mono font-bold ${flaggedRate > 50 ? "text-danger" : flaggedRate > 20 ? "text-warning" : "text-primary"}`}>
                        {flaggedRate}%
                      </span>
                      <span className="text-sm text-muted-foreground mb-2">of submissions flagged</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${flaggedRate}%`,
                            background: flaggedRate > 50
                              ? "hsl(var(--danger))"
                              : flaggedRate > 20
                              ? "hsl(var(--warning))"
                              : "hsl(var(--safe))",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-mono text-muted-foreground">
                        <span>{flaggedCount} flagged</span>
                        <span>{history.length - flaggedCount} clean</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Validation check results */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Validation Check Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <BarChart data={validationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis type="number" stroke={AXIS} fontSize={12} allowDecimals={false} />
                      <YAxis type="category" dataKey="check" stroke={AXIS} fontSize={12} width={96} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="pass" fill="var(--color-pass)" radius={[0, 4, 4, 0]} stackId="a" />
                      <Bar dataKey="fail" fill="var(--color-fail)" radius={[0, 4, 4, 0]} stackId="a" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Top injection strings */}
              {hasInjections && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ShieldX className="w-3.5 h-3.5 text-danger" />
                      Top Injection Strings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topInjections.map(({ text, count }, i) => {
                        const pct = Math.round((count / topInjections[0].count) * 100);
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1 gap-3">
                                <p className="text-xs font-mono text-danger truncate">{text}</p>
                                <span className="text-xs font-mono text-muted-foreground shrink-0">×{count}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-danger/60 transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Injections per submission */}
              {hasInjections && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Injections Detected per Submission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[220px] w-full">
                      <BarChart data={submissionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                        <XAxis dataKey="index" stroke={AXIS} fontSize={12} label={{ value: "#", position: "insideRight", offset: 8, fill: AXIS, fontSize: 11 }} />
                        <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="injections" fill="var(--color-injections)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Analytics;

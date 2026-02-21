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
  ResponsiveContainer,
} from "recharts";

const weeklyData = [
  { week: "Week 1", totalAnalysed: 1842, threatsBlocked: 38, avgRiskScore: 27, anomalyConfidence: 94, highestRisk: 97 },
  { week: "Week 2", totalAnalysed: 2105, threatsBlocked: 45, avgRiskScore: 31, anomalyConfidence: 95, highestRisk: 99 },
  { week: "Week 3", totalAnalysed: 1967, threatsBlocked: 29, avgRiskScore: 22, anomalyConfidence: 96, highestRisk: 88 },
  { week: "Week 4", totalAnalysed: 2340, threatsBlocked: 52, avgRiskScore: 34, anomalyConfidence: 93, highestRisk: 100 },
  { week: "Week 5", totalAnalysed: 2198, threatsBlocked: 41, avgRiskScore: 29, anomalyConfidence: 97, highestRisk: 95 },
  { week: "Week 6", totalAnalysed: 2456, threatsBlocked: 48, avgRiskScore: 32, anomalyConfidence: 96, highestRisk: 98 },
  { week: "Week 7", totalAnalysed: 1924, threatsBlocked: 33, avgRiskScore: 25, anomalyConfidence: 95, highestRisk: 91 },
  { week: "Week 8", totalAnalysed: 2610, threatsBlocked: 57, avgRiskScore: 36, anomalyConfidence: 94, highestRisk: 100 },
];

const chartConfig = {
  totalAnalysed: { label: "Total Analysed", color: "hsl(217 91% 60%)" },
  threatsBlocked: { label: "Threats Blocked", color: "hsl(347 77% 50%)" },
  avgRiskScore: { label: "Avg Risk Score", color: "hsl(38 92% 50%)" },
  anomalyConfidence: { label: "Anomaly Confidence %", color: "hsl(160 84% 39%)" },
  highestRisk: { label: "Highest Risk Score", color: "hsl(347 77% 65%)" },
};

const Analytics = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Weekly Analytics</h2>

          {/* Total Analysed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Prompts Analysed</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 16%)" />
                  <XAxis dataKey="week" stroke="hsl(215 20% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
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
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 16%)" />
                    <XAxis dataKey="week" stroke="hsl(215 20% 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
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
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 16%)" />
                    <XAxis dataKey="week" stroke="hsl(215 20% 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215 20% 55%)" fontSize={12} domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="highestRisk" stroke="var(--color-highestRisk)" strokeWidth={2} dot={{ fill: "var(--color-highestRisk)", r: 4 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Avg Risk Score & Anomaly Confidence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Risk Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 16%)" />
                    <XAxis dataKey="week" stroke="hsl(215 20% 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215 20% 55%)" fontSize={12} domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="avgRiskScore" stroke="var(--color-avgRiskScore)" strokeWidth={2} dot={{ fill: "var(--color-avgRiskScore)", r: 4 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Anomaly Detection Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 16%)" />
                    <XAxis dataKey="week" stroke="hsl(215 20% 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215 20% 55%)" fontSize={12} domain={[80, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="anomalyConfidence" stroke="var(--color-anomalyConfidence)" strokeWidth={2} dot={{ fill: "var(--color-anomalyConfidence)", r: 4 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MetricCards } from "@/components/MetricCards";
import { PromptFeed } from "@/components/PromptFeed";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { AppSidebar } from "@/components/AppSidebar";
import { PromptEntry } from "@/data/mockData";
import { sanitizeText, fetchHistory } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

const Index = () => {
  const queryClient = useQueryClient();
  const [selectedPrompt, setSelectedPrompt] = useState<PromptEntry | null>(null);
  const [inputText, setInputText] = useState("");

  const { data: history = [] } = useQuery({
    queryKey: ["history"],
    queryFn: fetchHistory,
  });

  const mutation = useMutation({
    mutationFn: sanitizeText,
    onSuccess: (entry) => {
      setSelectedPrompt(entry);
      setInputText("");
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const handleSubmit = () => {
    const text = inputText.trim();
    if (!text || mutation.isPending) return;
    mutation.mutate(text);
  };

  const threatsBlocked  = history.filter((p) => p.riskLevel === "high").length;
  const avgRiskScore    = history.length > 0
    ? Math.round(history.reduce((s, p) => s + p.riskScore, 0) / history.length)
    : 0;
  const totalInjections = history.reduce((s, p) => s + p.injections.length, 0);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <MetricCards
          totalPrompts={history.length}
          threatsBlocked={threatsBlocked}
          avgRiskScore={avgRiskScore}
          totalInjections={totalInjections}
        />

        {/* Input row */}
        <div className="mx-6 mb-4 flex gap-3 items-end">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Paste or type text to analyse for prompt injection…"
            className="resize-none font-mono text-sm min-h-[72px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={!inputText.trim() || mutation.isPending}
            className="shrink-0 h-[72px] px-5"
          >
            {mutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {mutation.isError && (
          <p className="mx-6 mb-3 text-xs text-danger font-mono">
            Error: {(mutation.error as Error).message}
          </p>
        )}

        <div className="flex-1 flex border-t border-border mx-6 mb-6 rounded-lg border border-border overflow-hidden bg-card">
          <div className="w-[45%] border-r border-border">
            <PromptFeed
              prompts={[...history].reverse()}
              selectedId={selectedPrompt?.id ?? null}
              onSelect={setSelectedPrompt}
            />
          </div>
          <div className="w-[55%]">
            <AnalysisPanel prompt={selectedPrompt} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MetricCards } from "@/components/MetricCards";
import { PromptFeed } from "@/components/PromptFeed";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { AppSidebar } from "@/components/AppSidebar";
import { PromptEntry } from "@/data/mockData";
import { sanitizeText } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

const Index = () => {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptEntry | null>(null);
  const [inputText, setInputText] = useState("");

  const mutation = useMutation({
    mutationFn: sanitizeText,
    onSuccess: (entry) => {
      setPrompts((prev) => [entry, ...prev]);
      setSelectedPrompt(entry);
      setInputText("");
    },
  });

  const handleSubmit = () => {
    const text = inputText.trim();
    if (!text || mutation.isPending) return;
    mutation.mutate(text);
  };

  const threatsBlocked = prompts.filter((p) => p.riskLevel === "high").length;
  const avgRiskScore =
    prompts.length > 0
      ? Math.round(prompts.reduce((s, p) => s + p.riskScore, 0) / prompts.length)
      : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <MetricCards
          totalPrompts={prompts.length}
          threatsBlocked={threatsBlocked}
          avgRiskScore={avgRiskScore}
          anomalyConfidence={96}
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
              prompts={prompts}
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

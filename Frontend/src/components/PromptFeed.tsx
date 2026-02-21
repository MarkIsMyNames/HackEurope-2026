import { PromptEntry } from "@/data/mockData";
import { Clock, ArrowRight } from "lucide-react";

interface PromptFeedProps {
  prompts: PromptEntry[];
  selectedId: string | null;
  onSelect: (prompt: PromptEntry) => void;
}

function riskBadge(level: PromptEntry["riskLevel"]) {
  const styles = {
    low: "bg-primary/10 text-primary border-primary/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    high: "bg-danger/10 text-danger border-danger/20",
  };
  return (
    <span className={`text-[10px] font-mono font-medium uppercase px-2 py-0.5 rounded border ${styles[level]}`}>
      {level}
    </span>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function PromptFeed({ prompts, selectedId, onSelect }: PromptFeedProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Real-time Feed</h2>
        <span className="text-xs text-muted-foreground font-mono">{prompts.length} prompts</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onSelect(prompt)}
            className={`w-full text-left px-5 py-3.5 border-b border-border transition-colors hover:bg-secondary/50 animate-slide-up ${
              selectedId === prompt.id ? "bg-secondary border-l-2 border-l-primary" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <p className="text-sm text-foreground truncate flex-1 font-mono leading-relaxed">
                {prompt.snippet.slice(0, 60)}
                {prompt.snippet.length > 60 ? "…" : ""}
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{formatTime(prompt.timestamp)}</span>
              </div>
              {riskBadge(prompt.riskLevel)}
              <span className="text-[10px] text-muted-foreground">{prompt.source}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchPrompt, savePrompt,
  fetchDownstreamPrompt, saveDownstreamPrompt,
  fetchSafetyPrompt, saveSafetyPrompt,
  fetchParserConfig, saveParserConfig,
  type ParserConfig,
} from "@/lib/api";
import { Save, Loader2, CheckCircle, Plus, X } from "lucide-react";

// ── Prompt tab ────────────────────────────────────────────────────────────────

function PromptTab({
  queryKey,
  fetcher,
  saver,
  label,
  description,
}: {
  queryKey: string;
  fetcher: () => Promise<string>;
  saver: (c: string) => Promise<void>;
  label: string;
  description: string;
}) {
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: remote, isLoading } = useQuery({ queryKey: [queryKey], queryFn: fetcher });
  const content = local ?? remote ?? "";

  const mutation = useMutation({
    mutationFn: saver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{description}</p>
        <Button
          onClick={() => mutation.mutate(content)}
          disabled={mutation.isPending || isLoading}
          className="gap-2"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Saved" : `Save ${label}`}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : (
        <Textarea
          value={content}
          onChange={(e) => setLocal(e.target.value)}
          className="flex-1 font-mono text-sm resize-none min-h-[540px]"
          placeholder={`${label} content…`}
        />
      )}

      {mutation.isError && (
        <p className="text-xs text-destructive font-mono">
          Failed to save: {(mutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

// ── Parser rules tab ──────────────────────────────────────────────────────────

function ParserRulesTab() {
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState<ParserConfig | null>(null);
  const [newPattern, setNewPattern] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: remote, isLoading } = useQuery({
    queryKey: ["parser_config"],
    queryFn: fetchParserConfig,
  });

  const config: ParserConfig = localConfig ?? remote ?? { whitelist: "", blacklist_patterns: [] };

  const mutation = useMutation({
    mutationFn: saveParserConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parser_config"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function addPattern() {
    const trimmed = newPattern.trim();
    if (!trimmed || config.blacklist_patterns.includes(trimmed)) return;
    setLocalConfig({ ...config, blacklist_patterns: [...config.blacklist_patterns, trimmed] });
    setNewPattern("");
  }

  function removePattern(pattern: string) {
    setLocalConfig({
      ...config,
      blacklist_patterns: config.blacklist_patterns.filter((p) => p !== pattern),
    });
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 flex-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Changes take effect on the next request.
        </p>
        <Button
          onClick={() => mutation.mutate(config)}
          disabled={mutation.isPending}
          className="gap-2"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Saved" : "Save Rules"}
        </Button>
      </div>

      {/* Character whitelist */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-medium text-foreground">Character whitelist</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Regex character-class expression. Any character not matched here is stripped before AI analysis.
          </p>
        </div>
        <Textarea
          value={config.whitelist}
          onChange={(e) => setLocalConfig({ ...config, whitelist: e.target.value })}
          className="font-mono text-sm resize-none min-h-[80px]"
          spellCheck={false}
        />
      </div>

      {/* Blacklist patterns */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-medium text-foreground">Blocked patterns</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Any input containing one of these strings is flagged as a threat.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[36px]">
          {config.blacklist_patterns.map((pattern) => (
            <Badge
              key={pattern}
              variant="secondary"
              className="gap-1.5 font-mono text-xs pr-1"
            >
              {pattern}
              <button
                onClick={() => removePattern(pattern)}
                className="hover:text-destructive transition-colors"
                aria-label={`Remove ${pattern}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {config.blacklist_patterns.length === 0 && (
            <span className="text-xs text-muted-foreground">No patterns yet.</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPattern()}
            placeholder="Add a pattern…"
            className="font-mono text-sm max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={addPattern} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {mutation.isError && (
        <p className="text-xs text-destructive font-mono">
          Failed to save: {(mutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const RuleConfig = () => (
  <div className="flex min-h-screen bg-background">
    <AppSidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <DashboardHeader />
      <div className="p-6 flex flex-col gap-4 flex-1">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Rule Configuration</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure prompts and parser rules used by the detection pipeline.
          </p>
        </div>

        <Tabs defaultValue="sanitize" className="flex flex-col flex-1 gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="sanitize">Sanitize Prompt</TabsTrigger>
            <TabsTrigger value="downstream">Postprocessing Prompt</TabsTrigger>
            <TabsTrigger value="safety">Safety Prompt</TabsTrigger>
            <TabsTrigger value="parser">Parser Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="sanitize" className="flex flex-col flex-1 mt-0">
            <PromptTab
              queryKey="prompt"
              fetcher={fetchPrompt}
              saver={savePrompt}
              label="Prompt"
              description="System prompt sent to Claude for injection detection. Returns { sanitized, injections[] }."
            />
          </TabsContent>

          <TabsContent value="downstream" className="flex flex-col flex-1 mt-0">
            <PromptTab
              queryKey="downstream_prompt"
              fetcher={fetchDownstreamPrompt}
              saver={saveDownstreamPrompt}
              label="Postprocessing Prompt"
              description="System prompt for the downstream LLM that processes sanitized user input before safety review."
            />
          </TabsContent>

          <TabsContent value="safety" className="flex flex-col flex-1 mt-0">
            <PromptTab
              queryKey="safety_prompt"
              fetcher={fetchSafetyPrompt}
              saver={saveSafetyPrompt}
              label="Safety Prompt"
              description="System prompt for the safety classifier. Must return { safe, verdict, reason } JSON."
            />
          </TabsContent>

          <TabsContent value="parser" className="flex flex-col flex-1 mt-0">
            <ParserRulesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
);

export default RuleConfig;

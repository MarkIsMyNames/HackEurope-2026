import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fetchPrompt, savePrompt } from "@/lib/api";
import { Save, Loader2, CheckCircle } from "lucide-react";

const RuleConfig = () => {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [localContent, setLocalContent] = useState<string | null>(null);

  const { data: remoteContent, isLoading } = useQuery({
    queryKey: ["prompt"],
    queryFn: fetchPrompt,
  });

  const content = localContent ?? remoteContent ?? "";

  const mutation = useMutation({
    mutationFn: savePrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <div className="p-6 flex flex-col gap-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Rule Configuration</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Edit the system prompt used by Claude to detect prompt injection.
              </p>
            </div>
            <Button
              onClick={() => mutation.mutate(content)}
              disabled={mutation.isPending || isLoading}
              className="gap-2"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle className="w-4 h-4 text-primary" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? "Saved" : "Save Prompt"}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Loading prompt…
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setLocalContent(e.target.value)}
              className="flex-1 font-mono text-sm resize-none min-h-[600px]"
              placeholder="System prompt content…"
            />
          )}

          {mutation.isError && (
            <p className="text-xs text-danger font-mono">
              Failed to save: {(mutation.error as Error).message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RuleConfig;

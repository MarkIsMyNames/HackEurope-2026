import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { createCheckoutSession } from "@/lib/api";
import { Shield, CheckCircle, Loader2 } from "lucide-react";

const FEATURES = [
  "Unlimited prompt sanitization requests",
  "AI-powered injection detection via Claude",
  "Real-time risk scoring and heuristics",
  "Persistent injection memory across sessions",
  "Rule configuration and incident logs",
  "Priority support",
];

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await createCheckoutSession();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start checkout");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <div className="p-6 flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Pricing</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              One-time payment for full access to PromptSecure.
            </p>
          </div>

          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">PromptSecure</p>
                <p className="text-xs text-muted-foreground">Enterprise licence</p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-foreground">€300</span>
              <span className="text-xs text-muted-foreground mb-1">one-time</span>
            </div>

            {/* Features */}
            <ul className="flex flex-col gap-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Error */}
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
            )}

            {/* CTA */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to Stripe…
                </>
              ) : (
                "Buy now"
              )}
            </button>

            <p className="text-[10px] text-center text-muted-foreground">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { createCheckoutSession } from "@/lib/api";
import { Shield, CheckCircle, Loader2, Zap, Building2 } from "lucide-react";

type Tier = "person" | "business" | "enterprise";

const TIERS: {
  id: Tier;
  name: string;
  price: string;
  period: string;
  tokens: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  highlighted: boolean;
}[] = [
  {
    id: "person",
    name: "Person",
    price: "€19",
    period: "/ month",
    tokens: "Up to 10M tokens",
    description: "For individual developers",
    features: [
      "Up to 10M tokens per month",
      "AI-powered injection detection",
      "Real-time risk scoring",
      "Rule configuration",
      "Incident logs",
    ],
    icon: Shield,
    highlighted: false,
  },
  {
    id: "business",
    name: "Business",
    price: "€79",
    period: "/ month",
    tokens: "Up to 50M tokens",
    description: "For teams",
    features: [
      "Up to 50M tokens per month",
      "AI-powered injection detection",
      "Real-time risk scoring",
      "Rule configuration",
      "Incident logs",
      "Priority support",
    ],
    icon: Zap,
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "€17",
    period: "/ million tokens",
    tokens: "Pay as you go",
    description: "For organisations",
    features: [
      "Metered billing — pay only for what you use",
      "AI-powered injection detection",
      "Real-time risk scoring",
      "Rule configuration",
      "Incident logs",
      "Priority support",
      "Dedicated account manager",
    ],
    icon: Building2,
    highlighted: false,
  },
];

const Pricing = () => {
  const [loading, setLoading] = useState<Tier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (tier: Tier) => {
    setLoading(tier);
    setError(null);
    try {
      const url = await createCheckoutSession(tier);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start checkout");
      setLoading(null);
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
              Monthly subscriptions — cancel any time.
            </p>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
            {TIERS.map(({ id, name, price, period, tokens, description, features, icon: Icon, highlighted }) => (
              <div
                key={id}
                className={`relative rounded-xl border bg-card p-6 flex flex-col gap-5 ${
                  highlighted ? "border-primary shadow-md" : "border-border"
                }`}
              >
                {highlighted && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-foreground">{price}</span>
                  <span className="text-xs text-muted-foreground mb-1">{period}</span>
                </div>

                <p className="text-xs text-muted-foreground -mt-3">{tokens}</p>

                {/* Features */}
                <ul className="flex flex-col gap-2 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(id)}
                  disabled={loading !== null}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {loading === id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    "Get started"
                  )}
                </button>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

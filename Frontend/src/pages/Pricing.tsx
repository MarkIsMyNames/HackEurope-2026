import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { createCheckoutSession, createSolanaPaymentRequest, verifySolanaPayment, SolanaPaymentRequest } from "@/lib/api";
import { Shield, CheckCircle, Loader2, Zap, Building2, RefreshCw } from "lucide-react";
import QRCode from "react-qr-code";

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState<Tier | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Solana state
  const [solanaRequest, setSolanaRequest] = useState<SolanaPaymentRequest | null>(null);
  const [solanaLoading, setSolanaLoading] = useState(false);
  const [solanaError, setSolanaError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

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

  const handleSolanaCheckout = async () => {
    setSolanaLoading(true);
    setSolanaError(null);
    try {
      const req = await createSolanaPaymentRequest();
      setSolanaRequest(req);
    } catch (e) {
      setSolanaError(e instanceof Error ? e.message : "Failed to create payment request");
    } finally {
      setSolanaLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!solanaRequest) return;
    setVerifying(true);
    setVerifyMessage(null);
    setSolanaError(null);
    try {
      const result = await verifySolanaPayment(solanaRequest.reference);
      if (result.paid) {
        navigate("/payment/success");
      } else {
        setVerifyMessage("Payment not found yet — please wait a moment after sending and try again.");
      }
    } catch (e) {
      setSolanaError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
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

          {/* Solana Pay section */}
          <div className="w-full max-w-4xl">
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 border-t border-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">or pay with crypto</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {!solanaRequest ? (
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-xs text-muted-foreground text-center">
                  One-time payment via Solana Pay — includes 10M tokens, no subscription required.
                </p>
                <button
                  onClick={handleSolanaCheckout}
                  disabled={solanaLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {solanaLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      {/* Solana gradient diamond logo */}
                      <svg width="16" height="16" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.4 93.6a4 4 0 0 1 2.8-1.2h98.6c1.8 0 2.7 2.1 1.4 3.4l-21.2 21.2a4 4 0 0 1-2.8 1.2H1.6c-1.8 0-2.7-2.1-1.4-3.4L21.4 93.6Z" fill="url(#a)"/>
                        <path d="M21.4 11.2A4 4 0 0 1 24.2 10h98.6c1.8 0 2.7 2.1 1.4 3.4L103 34.6a4 4 0 0 1-2.8 1.2H1.6C-.2 35.8-1.1 33.7.2 32.4L21.4 11.2Z" fill="url(#b)"/>
                        <path d="M100.2 52.2a4 4 0 0 0-2.8-1.2H1.6c-1.8 0-2.7 2.1-1.4 3.4L21.4 75.6a4 4 0 0 0 2.8 1.2h98.6c1.8 0 2.7-2.1 1.4-3.4L100.2 52.2Z" fill="url(#c)"/>
                        <defs>
                          <linearGradient id="a" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#9945FF"/><stop offset="1" stopColor="#14F195"/>
                          </linearGradient>
                          <linearGradient id="b" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#9945FF"/><stop offset="1" stopColor="#14F195"/>
                          </linearGradient>
                          <linearGradient id="c" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#9945FF"/><stop offset="1" stopColor="#14F195"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      Pay with Solana
                    </>
                  )}
                </button>
                {solanaError && (
                  <p className="text-xs text-destructive">{solanaError}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 bg-card border border-border rounded-xl p-6 mt-2">
                <p className="text-sm font-medium text-foreground">Solana Pay — one-time access</p>
                <p className="text-xs text-muted-foreground text-center">
                  Send exactly{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {solanaRequest.amount_sol} SOL
                  </span>{" "}
                  to receive{" "}
                  <span className="font-semibold text-foreground">
                    {solanaRequest.token_grant}
                  </span>
                  . Scan the QR code with a Solana-compatible wallet (Phantom, Solflare, etc.)
                </p>

                {/* QR code on white background so it's always scannable */}
                <div className="p-3 bg-white rounded-lg">
                  <QRCode value={solanaRequest.url} size={180} />
                </div>

                <p className="text-[10px] text-muted-foreground text-center max-w-xs">
                  The QR code encodes a Solana Pay request. Your wallet will auto-fill the recipient address and amount.
                </p>

                {/* Verify button */}
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      I've sent the payment — verify
                    </>
                  )}
                </button>

                {verifyMessage && (
                  <p className="text-xs text-muted-foreground text-center">{verifyMessage}</p>
                )}
                {solanaError && (
                  <p className="text-xs text-destructive">{solanaError}</p>
                )}

                <button
                  onClick={() => { setSolanaRequest(null); setSolanaError(null); setVerifyMessage(null); }}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "./contexts/SessionContext";
import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import RuleConfig from "./pages/RuleConfig";
import IncidentLogs from "./pages/IncidentLogs";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"                element={<Index />} />
            <Route path="/analytics"       element={<Analytics />} />
            <Route path="/rules"           element={<RuleConfig />} />
            <Route path="/incidents"       element={<IncidentLogs />} />
            <Route path="/pricing"         element={<Pricing />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel"  element={<PaymentCancel />} />
            <Route path="*"                element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

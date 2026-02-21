import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const PaymentSuccess = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-5 text-center max-w-sm px-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/15">
        <CheckCircle className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-foreground">Payment successful</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Thank you for purchasing PromptSecure. Your licence is now active.
        </p>
      </div>
      <Link
        to="/"
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Go to dashboard
      </Link>
    </div>
  </div>
);

export default PaymentSuccess;

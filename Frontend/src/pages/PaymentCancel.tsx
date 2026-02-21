import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

const PaymentCancel = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-5 text-center max-w-sm px-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/15">
        <XCircle className="w-8 h-8 text-destructive" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-foreground">Payment cancelled</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your payment was not completed. You have not been charged.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          to="/pricing"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Try again
        </Link>
        <Link
          to="/"
          className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-sidebar-accent transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  </div>
);

export default PaymentCancel;

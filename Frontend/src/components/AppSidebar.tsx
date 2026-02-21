import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  SlidersHorizontal,
  FileText,
  Shield,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Rule Config", icon: SlidersHorizontal, path: "/rules" },
  { label: "Incident Logs", icon: FileText, path: "/incidents" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-16 lg:w-56 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground hidden lg:block">Guardian</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : ""}`} />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">G</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-medium text-foreground">Guardian v1.0</p>
            <p className="text-[10px] text-muted-foreground">Enterprise Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { Link, useLocation } from "react-router-dom";
import { Sparkles, ScanLine, User, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/scan", icon: ScanLine, label: "Scan" },
  { to: "/result", icon: Sparkles, label: "Insights" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-full px-2 py-2 flex items-center gap-1 animate-fade-in">
      {items.map(({ to, icon: Icon, label }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            className={cn(
              "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-300",
              active
                ? "bg-gradient-brand text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            <span className={cn("hidden sm:inline", active && "font-semibold")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

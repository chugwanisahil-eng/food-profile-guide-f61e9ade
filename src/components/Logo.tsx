import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const Logo = ({ to = "/" }: { to?: string }) => (
  <Link to={to} className="flex items-center gap-2 group">
    <span className="relative flex size-8 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
      <Sparkles className="size-4 text-primary-foreground" />
      <span className="absolute inset-0 rounded-xl bg-gradient-brand blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
    </span>
    <span className="font-display text-xl font-bold tracking-tight">
      Aura<span className="text-gradient">Scan</span>
    </span>
  </Link>
);

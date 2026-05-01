import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ShieldCheck, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");

  return (
    <main className="min-h-dvh grid lg:grid-cols-2">
      {/* Left — illustration */}
      <section className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-aura opacity-80" aria-hidden />
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 right-0 size-[28rem] rounded-full bg-accent/15 blur-3xl" aria-hidden />

        <Logo />

        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="space-y-4 animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-primary">
              <Sparkles className="size-3" /> AI Nutrition Intelligence
            </span>
            <h1 className="font-display text-5xl font-bold leading-[1.05]">
              Eat smarter with food that <span className="text-gradient">knows you</span>.
            </h1>
            <p className="text-muted-foreground text-lg">
              Scan any product. AuraScan reads the label, weighs your goals and conditions, and tells you if it truly fits — in seconds.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              { icon: ShieldCheck, t: "Personal allergy & condition awareness" },
              { icon: Activity, t: "Fitness-aware macro guidance" },
              { icon: Sparkles, t: "Friendly AI assistant for follow-ups" },
            ].map(({ icon: Icon, t }, i) => (
              <div
                key={t}
                className="glass rounded-2xl p-4 flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="size-9 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
                  <Icon className="size-4 text-primary-foreground" />
                </span>
                <p className="text-sm">{t}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground">© 2026 AuraScan · Built for trust</p>
      </section>

      {/* Right — form */}
      <section className="flex flex-col justify-center p-6 sm:p-10">
        <div className="lg:hidden mb-8">
          <Logo />
        </div>

        <div className="w-full max-w-md mx-auto glass-strong rounded-3xl p-8 animate-scale-in">
          <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/50 mb-6 text-sm">
            {(["signup", "signin"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full py-2 transition-all ${
                  mode === m ? "bg-gradient-brand text-primary-foreground shadow-glow font-semibold" : "text-muted-foreground"
                }`}
              >
                {m === "signup" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold mb-1">
            {mode === "signup" ? "Get started" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "signup"
              ? "Build your taste profile in under a minute."
              : "Pick up your nutrition journey where you left it."}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/profile");
            }}
            className="space-y-4"
          >
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Avery Chen" className="h-12 bg-secondary/40 border-border/60" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@aurascan.app" className="h-12 bg-secondary/40 border-border/60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" className="h-12 bg-secondary/40 border-border/60" />
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full">
              Get Started
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="glass" className="h-11">Google</Button>
              <Button type="button" variant="glass" className="h-11">Apple</Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By continuing you agree to our <Link to="/" className="underline hover:text-foreground">Terms</Link> and <Link to="/" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;

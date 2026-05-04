import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ScanLine, Sparkles, ShieldCheck, Activity, ArrowRight, Camera, Barcode, BadgeCheck } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const Index = () => {
  return (
    <main className="min-h-dvh pb-32">
      {/* Header */}
      <header className="container max-w-6xl flex items-center justify-between py-6">
        <Logo />
        <nav className="hidden sm:flex items-center gap-1 text-sm">
          <Link to="/scan" className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">Scan</Link>
          <Link to="/profile" className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">Profile</Link>
          <Link to="/result" className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">Insights</Link>
          <Button asChild variant="hero" size="sm" className="ml-2 rounded-full">
            <Link to="/login">Get Started <ArrowRight className="size-4" /></Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="container max-w-6xl pt-10 pb-16 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div className="space-y-8 animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-primary">
            <Sparkles className="size-3" /> Personalized food intelligence
          </span>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02]">
            Know if it's <span className="text-gradient">right for you</span>, in one scan.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            AuraScan reads any food label, weighs it against your goals, conditions, and allergies — and gives you a clear, human verdict.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/login">Get Started <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild variant="glass" size="xl" className="rounded-full">
              <Link to="/scan"><Camera className="size-4" /> Try the scanner</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground pt-2">
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-3.5 text-primary" /> Verified nutrition sources</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-accent" /> Allergy-aware by default</span>
          </div>
        </div>

        {/* Visual preview */}
        <div className="relative animate-scale-in">
          <div className="absolute -inset-10 bg-gradient-aura blur-2xl opacity-90" aria-hidden />
          <div className="relative glass-strong rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Last scan</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-verdict-warn/15 border border-verdict-warn/30 px-2 py-0.5 text-[10px] font-semibold text-verdict-warn">
                ⚠ Moderate
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl glass grid place-items-center text-3xl">🍫</div>
              <div>
                <p className="font-display text-xl font-bold">Choco Oat Crunch</p>
                <p className="text-xs text-muted-foreground">Snack bar · 45g</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Calories", v: "210" },
                { l: "Sugar", v: "18g" },
                { l: "Protein", v: "4g" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-secondary/40 p-3 text-center border border-border/40">
                  <p className="font-display text-lg font-bold tabular-nums">{s.v}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-verdict-bad/40 bg-verdict-bad/10 p-3 text-xs flex items-center gap-2">
              <span className="text-verdict-bad">●</span>
              <span className="text-verdict-bad font-medium">Contains tree nuts — flagged in your profile</span>
            </div>
            <div className="rounded-2xl bg-secondary/50 border border-border/40 p-3 flex items-start gap-3">
              <span className="size-7 rounded-lg bg-gradient-brand grid place-items-center shrink-0">
                <Sparkles className="size-3.5 text-primary-foreground" />
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                "Sugar is high for your weight-loss goal. I found two cleaner alternatives — want to see them?"
              </p>
            </div>
          </div>

          {/* floating chip */}
          <div className="absolute -top-4 -right-2 glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 animate-float">
            <span className="size-1.5 rounded-full bg-verdict-good" /> Live · 2.4s
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-6xl py-12">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: ScanLine, t: "One-tap scanning", d: "Camera, image upload, or barcode — whatever's fastest." },
            { icon: Activity, t: "Built around your goals", d: "Weight loss, muscle gain, or steady energy — we adapt." },
            { icon: ShieldCheck, t: "Allergy-aware verdicts", d: "Critical restrictions are always front and center." },
          ].map(({ icon: Icon, t, d }, i) => (
            <div key={t} className="glass-strong rounded-3xl p-6 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="size-11 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow">
                <Icon className="size-5 text-primary-foreground" />
              </span>
              <h3 className="font-display text-xl font-semibold mt-4">{t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section className="container max-w-6xl py-12">
        <div className="glass-strong rounded-[2rem] p-8 sm:p-12">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">How it works</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">From label to verdict, in three seconds.</h2>
            </div>
            <Button asChild variant="hero" size="lg">
              <Link to="/scan">Open scanner <Camera className="size-4" /></Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Build your profile", d: "Add conditions, goals, allergies — anything that matters to you." },
              { n: "02", t: "Scan or upload", d: "Snap the label, scan a barcode, or upload an image from gallery." },
              { n: "03", t: "Get a personal verdict", d: "Color-coded result with reasoning, alternatives, and AI follow-up." },
            ].map((s) => (
              <div key={s.n} className="space-y-2">
                <p className="font-display text-5xl font-bold text-gradient">{s.n}</p>
                <p className="font-semibold text-lg">{s.t}</p>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="container max-w-6xl py-10 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>© 2026 AuraScan · Built with care for trustworthy nutrition.</p>
        <div className="flex items-center gap-2">
          <Barcode className="size-3.5" /> v1.0
        </div>
      </footer>

      <BottomNav />
    </main>
  );
};

export default Index;

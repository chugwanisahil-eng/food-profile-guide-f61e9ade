import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Camera, ImageUp, Barcode, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

const Scan = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-dvh pb-32 flex flex-col">
      <header className="container max-w-3xl flex items-center justify-between py-6">
        <Logo />
        <span className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs">
          <span className="size-1.5 rounded-full bg-verdict-good animate-pulse" /> Profile active
        </span>
      </header>

      <div className="container max-w-3xl flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3 animate-fade-in">
          Ready to analyze
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold max-w-xl animate-fade-in">
          Point. Scan. <span className="text-gradient">Know.</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md animate-fade-in">
          Capture any product label or barcode. AuraScan delivers a personalized verdict in under three seconds.
        </p>

        {/* Big scan button */}
        <div className="relative my-14">
          <div className="absolute -inset-12 bg-gradient-aura blur-2xl opacity-90" aria-hidden />
          <button
            onClick={() => navigate("/result")}
            className="relative size-56 sm:size-64 rounded-full bg-gradient-brand shadow-glow grid place-items-center group animate-pulse-glow"
            aria-label="Open camera and scan"
          >
            <span className="absolute inset-3 rounded-full border border-primary-foreground/20" />
            <span className="absolute inset-6 rounded-full border border-primary-foreground/10" />
            <Camera className="size-20 text-primary-foreground transition-transform group-hover:scale-110 duration-300" strokeWidth={1.5} />
          </button>
          <p className="mt-6 text-sm text-muted-foreground">Tap to open the live scanner</p>
        </div>

        {/* Options */}
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-lg">
          <button
            onClick={() => navigate("/result")}
            className="glass-strong rounded-2xl p-5 text-left flex items-center gap-4 hover:border-primary/40 transition-all hover:-translate-y-0.5"
          >
            <span className="size-12 rounded-xl bg-primary/15 grid place-items-center text-primary">
              <ImageUp className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Upload image</p>
              <p className="text-xs text-muted-foreground">From gallery or files</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/result")}
            className="glass-strong rounded-2xl p-5 text-left flex items-center gap-4 hover:border-accent/40 transition-all hover:-translate-y-0.5"
          >
            <span className="size-12 rounded-xl bg-accent/15 grid place-items-center text-accent">
              <Barcode className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Scan barcode</p>
              <p className="text-xs text-muted-foreground">Use product code</p>
            </div>
          </button>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Zap className="size-3.5 text-primary" /> Avg. 2.4s analysis</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5 text-accent" /> Personalized to you</span>
        </div>
      </div>

      <BottomNav />
    </main>
  );
};

export default Scan;

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Bookmark, AlertTriangle, ShieldCheck, BadgeCheck, Send, Sparkles, ArrowLeft, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

type Verdict = "good" | "warn" | "bad";

const verdictMap = {
  good: { label: "Suitable for you", icon: "✅", color: "text-verdict-good", ring: "ring-verdict-good/40", chip: "bg-verdict-good/15 border-verdict-good/30" },
  warn: { label: "Consume in moderation", icon: "⚠", color: "text-verdict-warn", ring: "ring-verdict-warn/40", chip: "bg-verdict-warn/15 border-verdict-warn/30" },
  bad: { label: "Not recommended", icon: "❌", color: "text-verdict-bad", ring: "ring-verdict-bad/40", chip: "bg-verdict-bad/15 border-verdict-bad/30" },
};

const nutrition = [
  { label: "Calories", value: "210", unit: "kcal", tone: "neutral" },
  { label: "Sugar", value: "18", unit: "g", tone: "warn" },
  { label: "Protein", value: "4", unit: "g", tone: "neutral" },
  { label: "Sat. fat", value: "6", unit: "g", tone: "warn" },
];

const insights = [
  "Sugar is high relative to your weight-loss goal — about 36% of your daily target in one bar.",
  "Contains oats, a great fit for your heart-health focus.",
  "Within your daily calorie envelope if paired with a high-protein meal.",
];

const alternatives = [
  { name: "Forest Berry Protein Bar", why: "Half the sugar · 12g protein", verdict: "good" as Verdict },
  { name: "Almond Crunch Bites", why: "Lower glycemic load", verdict: "good" as Verdict },
];

interface Msg { role: "user" | "ai"; text: string }

const Result = () => {
  const navigate = useNavigate();
  const [verdict] = useState<Verdict>("warn");
  const [bookmarked, setBookmarked] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi Avery — this bar is okay occasionally. Want me to find a better fit, or compare it to your last scan?" },
  ]);
  const [input, setInput] = useState("");

  const v = verdictMap[verdict];

  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text:
            "Based on your profile, I'd cap this to 2 per week. A great daily swap is the Forest Berry Protein Bar — same crunch, half the sugar, more protein.",
        },
      ]);
    }, 700);
  };

  return (
    <main className="min-h-dvh pb-32">
      <header className="container max-w-4xl flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back" className="rounded-full">
            <ArrowLeft className="size-4" />
          </Button>
          <Logo />
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={() => setBookmarked((b) => !b)}
          className="rounded-full"
        >
          <Bookmark className={cn("size-4", bookmarked && "fill-primary text-primary")} />
          {bookmarked ? "Saved" : "Save"}
        </Button>
      </header>

      <div className="container max-w-4xl space-y-6">
        {/* Verdict hero card */}
        <section className={cn("relative glass-strong rounded-3xl p-6 sm:p-8 animate-scale-in ring-1", v.ring)}>
          <div className="absolute inset-0 -z-10 rounded-3xl opacity-60 bg-gradient-aura" />
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="size-24 sm:size-28 rounded-2xl glass grid place-items-center shrink-0 text-4xl">
              🍫
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Snack bar</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <BadgeCheck className="size-3" /> Verified data
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                  Confidence: High
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold">Choco Oat Crunch Bar</h1>
              <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base font-semibold", v.chip, v.color)}>
                <span className="text-lg">{v.icon}</span> {v.label}
              </div>
            </div>
          </div>
        </section>

        {/* Allergy warning */}
        <section className="rounded-3xl p-5 border border-verdict-bad/40 bg-verdict-bad/10 flex items-start gap-4 animate-fade-in">
          <span className="size-10 rounded-xl bg-verdict-bad/20 grid place-items-center shrink-0">
            <AlertTriangle className="size-5 text-verdict-bad" />
          </span>
          <div>
            <p className="font-semibold text-verdict-bad">Allergy alert · Contains tree nuts</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Almonds and hazelnuts detected — listed as a restriction in your profile.
            </p>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Nutrition */}
          <section className="glass-strong rounded-3xl p-6 animate-fade-in">
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Leaf className="size-4 text-accent" /> Key nutrition
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {nutrition.map((n) => (
                <div key={n.label} className="rounded-2xl bg-secondary/40 p-4 border border-border/40">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{n.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {n.value}<span className="text-sm text-muted-foreground font-sans font-normal ml-1">{n.unit}</span>
                  </p>
                  {n.tone === "warn" && (
                    <p className="text-[11px] text-verdict-warn mt-1">Above your daily target</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Insights */}
          <section className="glass-strong rounded-3xl p-6 animate-fade-in">
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Personalized insights
            </h2>
            <ul className="space-y-3">
              {insights.map((t) => (
                <li key={t} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gradient-brand" />
                  <span className="text-foreground/90">{t}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Alternatives */}
        <section className="glass-strong rounded-3xl p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <ShieldCheck className="size-4 text-verdict-good" /> Better matches
            </h2>
            <span className="text-xs text-muted-foreground">Tailored to your goals</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {alternatives.map((a) => (
              <button
                key={a.name}
                className="text-left rounded-2xl p-4 bg-secondary/40 border border-border/40 hover:border-primary/40 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{a.name}</p>
                  <span className="text-verdict-good">✅</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{a.why}</p>
              </button>
            ))}
          </div>
        </section>

        {/* AI chat */}
        <section className="glass-strong rounded-3xl p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="size-8 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
              <Sparkles className="size-4 text-primary-foreground" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold">Aura Assistant</p>
              <p className="text-xs text-muted-foreground">Ask anything about this product</p>
            </div>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex animate-fade-in",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-gradient-brand text-primary-foreground rounded-br-md"
                      : "bg-secondary/60 text-foreground rounded-bl-md border border-border/40"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {["Can I eat this daily?", "Is there a better alternative?", "How does it fit my goal?"].map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary/50 border border-border/50 px-4 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up…"
              className="flex-1 bg-transparent outline-none text-sm py-2 placeholder:text-muted-foreground/70"
            />
            <Button type="submit" variant="hero" size="icon" className="rounded-full size-10" aria-label="Send">
              <Send className="size-4" />
            </Button>
          </form>
        </section>
      </div>

      <BottomNav />
    </main>
  );
};

export default Result;

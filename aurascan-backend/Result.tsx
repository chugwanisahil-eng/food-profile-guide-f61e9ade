import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Bookmark, AlertTriangle, ShieldCheck, BadgeCheck,
  Send, Sparkles, ArrowLeft, Leaf, ScanLine,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

type Verdict = "good" | "warn" | "bad";

const verdictMap = {
  good: { label: "Suitable for you",       icon: "✅", color: "text-verdict-good", ring: "ring-verdict-good/40", chip: "bg-verdict-good/15 border-verdict-good/30" },
  warn: { label: "Consume in moderation",  icon: "⚠",  color: "text-verdict-warn", ring: "ring-verdict-warn/40", chip: "bg-verdict-warn/15 border-verdict-warn/30" },
  bad:  { label: "Not recommended",        icon: "❌", color: "text-verdict-bad",  ring: "ring-verdict-bad/40",  chip: "bg-verdict-bad/15  border-verdict-bad/30"  },
};

// ── Fallback demo data (used when no real scan result is in route state) ─────
const DEMO = {
  barcode: "3017624010701",
  product: {
    name: "Choco Oat Crunch Bar",
    brand: "DemoSnacks",
    image_url: "",
    ingredients: "Oats, sugar, chocolate chips, almonds, hazelnuts, palm oil",
    allergens: ["tree nuts", "gluten"],
    nutriments: { energy_kcal: 210, sugars: 18, proteins: 4, saturated_fat: 6 },
    off_score: "D",
  },
  verdict: {
    verdict: "warn" as Verdict,
    reason: "Sugar is high for your weight-loss goal",
    allergen_hits: ["tree nuts"],
    insights: [
      "Contains oats — great for heart health.",
      "Calories are within your daily envelope if portion-controlled.",
    ],
    nutriment_flags: [
      { nutriment: "sugars",       value: 18, level: "warn" },
      { nutriment: "saturated_fat", value: 6,  level: "warn" },
    ],
  },
};

interface Msg { role: "user" | "ai"; text: string }

const Result = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Use real scan data if available, otherwise fall back to demo
  const scanData  = (state as typeof DEMO | null) ?? DEMO;
  const product   = scanData.product   ?? DEMO.product;
  const verdictData = scanData.verdict ?? DEMO.verdict;
  const verdict   = (verdictData.verdict ?? "warn") as Verdict;
  const scanMethod = (state as { scan_method?: string } | null)?.scan_method;

  const [bookmarked, setBookmarked] = useState(false);
  const [messages,   setMessages]   = useState<Msg[]>([
    { role: "ai", text: `I analysed ${product.name}. ${verdictData.reason} — want me to explain further or find alternatives?` },
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
        { role: "ai", text: "Based on your profile, I'd recommend checking the serving size and pairing this with a high-protein snack to balance the sugar spike." },
      ]);
    }, 700);
  };

  // Build nutriment display rows
  const nm = product.nutriments ?? {};
  const nutritionRows = [
    { label: "Calories",  value: nm.energy_kcal ?? 0, unit: "kcal" },
    { label: "Sugar",     value: nm.sugars ?? 0,       unit: "g"    },
    { label: "Protein",   value: nm.proteins ?? 0,     unit: "g"    },
    { label: "Sat. fat",  value: nm.saturated_fat ?? 0, unit: "g"   },
  ];

  const flagged = new Set(
    (verdictData.nutriment_flags ?? [])
      .filter((f: { level: string }) => f.level !== "good")
      .map((f: { nutriment: string }) => f.nutriment),
  );

  return (
    <main className="min-h-dvh pb-32">
      <header className="container max-w-4xl flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back" className="rounded-full">
            <ArrowLeft className="size-4" />
          </Button>
          <Logo />
        </div>
        <Button variant="glass" size="sm" onClick={() => setBookmarked((b) => !b)} className="rounded-full">
          <Bookmark className={cn("size-4", bookmarked && "fill-primary text-primary")} />
          {bookmarked ? "Saved" : "Save"}
        </Button>
      </header>

      <div className="container max-w-4xl space-y-6">
        {/* Verdict hero */}
        <section className={cn("relative glass-strong rounded-3xl p-6 sm:p-8 animate-scale-in ring-1", v.ring)}>
          <div className="absolute inset-0 -z-10 rounded-3xl opacity-60 bg-gradient-aura" />
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="size-24 sm:size-28 rounded-2xl object-cover bg-secondary/50 shrink-0"
              />
            ) : (
              <div className="size-24 sm:size-28 rounded-2xl glass grid place-items-center shrink-0 text-4xl">🍫</div>
            )}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{product.brand || "Food product"}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <BadgeCheck className="size-3" /> Verified data
                </span>
                {scanMethod && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                    <ScanLine className="size-3" /> via {scanMethod}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold">{product.name}</h1>
              <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base font-semibold", v.chip, v.color)}>
                <span className="text-lg">{v.icon}</span> {v.label}
              </div>
              <p className="text-sm text-muted-foreground">{verdictData.reason}</p>
            </div>
          </div>
        </section>

        {/* Allergen warnings */}
        {(verdictData.allergen_hits ?? []).length > 0 && (
          <section className="rounded-3xl p-5 border border-verdict-bad/40 bg-verdict-bad/10 flex items-start gap-4 animate-fade-in">
            <span className="size-10 rounded-xl bg-verdict-bad/20 grid place-items-center shrink-0">
              <AlertTriangle className="size-5 text-verdict-bad" />
            </span>
            <div>
              <p className="font-semibold text-verdict-bad">
                Allergy alert · Contains {verdictData.allergen_hits.join(", ")}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                These are flagged in your health profile.
              </p>
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Nutrition */}
          <section className="glass-strong rounded-3xl p-6 animate-fade-in">
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Leaf className="size-4 text-accent" /> Key nutrition (per 100g)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {nutritionRows.map((n) => {
                const nmKey = n.label.toLowerCase().replace(". ", "_").replace(" ", "_");
                const isFlagged = flagged.has(nmKey) || flagged.has(nmKey.replace("_fat","")) ;
                return (
                  <div key={n.label} className="rounded-2xl bg-secondary/40 p-4 border border-border/40">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{n.label}</p>
                    <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                      {n.value}<span className="text-sm text-muted-foreground font-sans font-normal ml-1">{n.unit}</span>
                    </p>
                    {isFlagged && (
                      <p className="text-[11px] text-verdict-warn mt-1">Above target</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Insights */}
          <section className="glass-strong rounded-3xl p-6 animate-fade-in">
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Personalised insights
            </h2>
            {(verdictData.insights ?? []).length > 0 ? (
              <ul className="space-y-3">
                {(verdictData.insights as string[]).map((t, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gradient-brand" />
                    <span className="text-foreground/90">{t}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No specific flags for your profile.</p>
            )}

            {product.off_score && (
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-3">
                <span className={cn(
                  "size-10 rounded-xl grid place-items-center font-display text-xl font-bold",
                  product.off_score === "A" ? "bg-verdict-good/20 text-verdict-good" :
                  product.off_score === "B" ? "bg-verdict-good/10 text-verdict-good" :
                  product.off_score === "C" ? "bg-verdict-warn/20 text-verdict-warn" :
                  "bg-verdict-bad/20 text-verdict-bad",
                )}>
                  {product.off_score}
                </span>
                <div>
                  <p className="text-xs font-semibold">Nutri-Score</p>
                  <p className="text-xs text-muted-foreground">Overall nutritional quality</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Ingredients */}
        {product.ingredients && (
          <section className="glass-strong rounded-3xl p-6 animate-fade-in">
            <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="size-4 text-verdict-good" /> Ingredients
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.ingredients}</p>
          </section>
        )}

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
              <div key={i} className={cn("flex animate-fade-in", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-gradient-brand text-primary-foreground rounded-br-md"
                    : "bg-secondary/60 text-foreground rounded-bl-md border border-border/40",
                )}>
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

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary/50 border border-border/50 px-4 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a follow-up…"
              className="flex-1 bg-transparent outline-none text-sm py-2 placeholder:text-muted-foreground/70"
            />
            <Button onClick={() => send()} variant="hero" size="icon" className="rounded-full size-10" aria-label="Send">
              <Send className="size-4" />
            </Button>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
};

export default Result;

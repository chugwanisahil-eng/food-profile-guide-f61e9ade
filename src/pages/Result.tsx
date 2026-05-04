import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Bookmark, AlertTriangle, ShieldCheck, BadgeCheck,
  Send, Sparkles, ArrowLeft, Leaf, ScanLine, Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

// ─── 🔑 GEMINI API KEY — replace with your key from https://aistudio.google.com/apikey
const GEMINI_API_KEY = "AIzaSyDwgMiF894VMQUqUwnSHY2mrxtIs8eBaDQ";
const GEMINI_MODEL   = "gemini-3-flash-preview";
// ─────────────────────────────────────────────────

type Verdict = "good" | "warn" | "bad";

const verdictMap = {
  good: { label: "Suitable for you",      icon: "✅", color: "text-verdict-good", ring: "ring-verdict-good/40", chip: "bg-verdict-good/15 border-verdict-good/30" },
  warn: { label: "Consume in moderation", icon: "⚠",  color: "text-verdict-warn", ring: "ring-verdict-warn/40", chip: "bg-verdict-warn/15 border-verdict-warn/30" },
  bad:  { label: "Not recommended",       icon: "❌", color: "text-verdict-bad",  ring: "ring-verdict-bad/40",  chip: "bg-verdict-bad/15  border-verdict-bad/30"  },
};

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
      { nutriment: "sugars",        value: 18, level: "warn" },
      { nutriment: "saturated_fat", value: 6,  level: "warn" },
    ],
  },
};

interface Msg { role: "user" | "ai"; text: string }

function buildSystemPrompt(product: typeof DEMO.product, user: Record<string, unknown>): string {
  const fmt = (v: unknown) =>
    Array.isArray(v) ? (v as string[]).join(", ") || "None" : (v as string) || "None";

  const nm = (product.nutriments ?? {}) as Record<string, number>;

  const conditions = fmt(user.conditions);
  const allergies  = fmt(user.allergies);
  const goals      = fmt(user.goals);
  const prefs      = fmt(user.diet ?? user.preferences);
  const noProfile  = [conditions, allergies, goals, prefs].every((v) => v === "None");

  // Detect allergy overlap for the prompt to be aware of
  const allergenList = (product.allergens ?? []).map((a: string) => a.toLowerCase());
  const userAllergyList = allergies !== "None"
    ? allergies.toLowerCase().split(",").map((a) => a.trim())
    : [];
  const allergyMatch = allergenList.some((a) => userAllergyList.some((ua) => a.includes(ua) || ua.includes(a)));

  return `You are Aura, the AI nutrition assistant inside AuraScan.

Your goal: help the user understand this product in a clear, engaging, and practical way — while staying grounded in the provided data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHO YOU ARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• A smart, friendly, slightly creative nutrition guide.
• You can explain things in relatable ways (analogies, simple comparisons, everyday language).
• You are engaging — not robotic or overly clinical.
• You are helpful, not restrictive — but still responsible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE SAFETY RULES (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Only use the given product data and user profile — do NOT invent facts.
2. Do NOT give medical advice, diagnoses, or treatments.
3. Do NOT recommend medicines or supplements.
4. If something is unknown → say "I don’t have that information."
5. Do NOT make strong health claims beyond the data.
6. If allergies match → clearly warn the user.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FLEXIBILITY (THIS IS WHAT CHANGES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You ARE allowed to:
• Explain nutrition in simple, intuitive ways
• Add light comparisons (e.g., "this is on the sweeter side")
• Suggest practical habits (portion control, timing, pairing foods)
• Use a slightly conversational tone (like a knowledgeable friend)
• Give actionable lifestyle advice (non-medical)

You are NOT allowed to:
• Guess missing data
• Exaggerate risks or benefits
• Give strict or fear-based instructions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Start with a clear verdict (good / moderate / avoid)
• Then explain WHY in a human way
• Add one useful insight
• End with a practical takeaway

Tone:
• Natural, slightly conversational
• Confident but not rigid
• Helpful, not restrictive

Length:
• 3–6 sentences typically

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Health conditions: ${conditions}
Allergies: ${allergies}
Goals: ${goals}
Diet: ${prefs}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${product.name}
Ingredients: ${product.ingredients}
Allergens: ${allergenList.join(", ")}

Calories: ${nm.energy_kcal ?? "N/A"}
Sugar: ${nm.sugars ?? "N/A"}
Fat: ${nm.saturated_fat ?? "N/A"}
Protein: ${nm.proteins ?? "N/A"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If user asks unrelated questions → gently redirect:
"I can help with this product or similar food choices."

If user asks medical questions → say:
"That’s something a doctor can guide you on."`;
}

async function callGemini(
  systemPrompt: string,
  history: Msg[],
  userMessage: string,
): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    return "⚠️ No Gemini API key set. Open Result.tsx and replace GEMINI_API_KEY with your key from https://aistudio.google.com/apikey";
  }

  const contents = [
    { role: "user",  parts: [{ text: systemPrompt + "\n\nReady to help." }] },
    { role: "model", parts: [{ text: "Understood. I'm ready to answer questions about this product based on the user's profile." }] },
    ...history.map((m) => ({
      role:  m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 400, temperature: 0.4 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "Sorry, I couldn't generate a response.";
}

const Result = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const scanData    = (state as typeof DEMO | null) ?? DEMO;
  const product     = scanData.product   ?? DEMO.product;
  const verdictData = scanData.verdict   ?? DEMO.verdict;
  const verdict     = (verdictData.verdict ?? "warn") as Verdict;
  const scanMethod  = (state as { scan_method?: string } | null)?.scan_method;

  const user: Record<string, unknown> = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })();

  const systemPrompt = buildSystemPrompt(product, user);

  const [bookmarked, setBookmarked] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: `I've analysed **${product.name}**. ${verdictData.reason} — ask me anything about this product!`,
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const v  = verdictMap[verdict];
  const nm = (product.nutriments ?? {}) as Record<string, number>;

  const nutritionRows = [
    { label: "Calories", value: nm.energy_kcal  ?? 0, unit: "kcal" },
    { label: "Sugar",    value: nm.sugars        ?? 0, unit: "g"    },
    { label: "Protein",  value: nm.proteins      ?? 0, unit: "g"    },
    { label: "Sat. fat", value: nm.saturated_fat ?? 0, unit: "g"    },
  ];

  const flagged = new Set(
    (verdictData.nutriment_flags ?? [])
      .filter((f: { level: string }) => f.level !== "good")
      .map((f: { nutriment: string }) => f.nutriment),
  );

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || loading) return;

    const userMsg: Msg = { role: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await callGemini(systemPrompt, messages, t);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "ai", text: `❌ Error: ${(err as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
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
              <img src={product.image_url} alt={product.name} className="size-24 sm:size-28 rounded-2xl object-cover bg-secondary/50 shrink-0" />
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
              <p className="text-sm text-muted-foreground mt-0.5">These are flagged in your health profile.</p>
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
                const nmKey     = n.label.toLowerCase().replace(". ", "_").replace(" ", "_");
                const isFlagged = flagged.has(nmKey) || flagged.has(nmKey.replace("_fat", ""));
                return (
                  <div key={n.label} className="rounded-2xl bg-secondary/40 p-4 border border-border/40">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{n.label}</p>
                    <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                      {n.value}<span className="text-sm text-muted-foreground font-sans font-normal ml-1">{n.unit}</span>
                    </p>
                    {isFlagged && <p className="text-[11px] text-verdict-warn mt-1">Above target</p>}
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

        {/* ── Gemini AI Chat ──────────────────────────────────────────────── */}
        <section className="glass-strong rounded-3xl p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="size-8 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
              <Sparkles className="size-4 text-primary-foreground" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold">Aura Assistant</p>
              <p className="text-xs text-muted-foreground">Powered by Gemini · Ask anything about this product</p>
            </div>
          </div>

          {/* Message thread */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex animate-fade-in", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-gradient-brand text-primary-foreground rounded-br-md"
                    : "bg-secondary/60 text-foreground rounded-bl-md border border-border/40",
                )}>
                  {renderText(m.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-secondary/60 border border-border/40 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestion chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              "Can I eat this daily?",
              "Is there a better alternative?",
              "How does it fit my goal?",
              "What ingredients should I watch?",
            ].map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary/50 border border-border/50 px-4 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask a follow-up…"
              disabled={loading}
              className="flex-1 bg-transparent outline-none text-sm py-2 placeholder:text-muted-foreground/70 disabled:opacity-50"
            />
            <Button
              onClick={() => send()}
              variant="hero"
              size="icon"
              className="rounded-full size-10 shrink-0"
              aria-label="Send"
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </section>
        {/* ─────────────────────────────────────────────────────────────── */}
      </div>

      <BottomNav />
    </main>
  );
};

export default Result;
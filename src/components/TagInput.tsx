import { useState, KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  label: string;
  description?: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  accent?: "primary" | "accent" | "warn";
}

export const TagInput = ({
  label,
  description,
  values,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter…",
  accent = "primary",
}: TagInputProps) => {
  const [input, setInput] = useState("");

  const add = (v: string) => {
    const t = v.trim();
    if (!t) return;
    if (values.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    onChange([...values, t]);
    setInput("");
  };
  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && values.length) {
      remove(values[values.length - 1]);
    }
  };

  const accentChip = {
    primary: "bg-primary/15 text-primary border-primary/30 hover:bg-primary/25",
    accent: "bg-accent/15 text-accent border-accent/30 hover:bg-accent/25",
    warn: "bg-verdict-warn/15 text-verdict-warn border-verdict-warn/30 hover:bg-verdict-warn/25",
  }[accent];

  const remaining = suggestions.filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display text-lg font-semibold">{label}</h3>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>

      <div className="glass rounded-2xl p-3 flex flex-wrap items-center gap-2">
        {values.map((v) => (
          <span
            key={v}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors animate-scale-in",
              accentChip
            )}
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="opacity-70 hover:opacity-100"
              aria-label={`Remove ${v}`}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={values.length ? "Add another…" : placeholder}
          className="flex-1 min-w-[140px] bg-transparent outline-none text-sm placeholder:text-muted-foreground/70 px-2 py-1"
        />
        {input && (
          <button
            type="button"
            onClick={() => add(input)}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="size-3.5" /> Add
          </button>
        )}
      </div>

      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {remaining.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

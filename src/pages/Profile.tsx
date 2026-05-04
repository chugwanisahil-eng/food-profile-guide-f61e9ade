import { useState } from "react";
import { Logo } from "@/components/Logo";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

const SUGGESTIONS = {
  conditions: ["Type 2 Diabetes", "High cholesterol", "Hypertension", "IBS", "Anemia", "PCOS", "Acid reflux"],
  goals: ["Weight loss", "Muscle gain", "Balanced diet", "More energy", "Better sleep", "Heart health", "Gut health"],
  allergies: ["Peanuts", "Tree nuts", "Gluten", "Dairy", "Soy", "Shellfish", "Eggs", "Sesame"],
  diet: ["Vegan", "Vegetarian", "Pescatarian", "High-protein", "Low-carb", "Mediterranean", "Halal", "Kosher"],
};

const Profile = () => {
  const navigate = useNavigate();

  // Load existing user data from localStorage (populated on login)
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [step, setStep] = useState(0);
  const [conditions, setConditions] = useState<string[]>(
    Array.isArray(user.conditions) ? user.conditions : []
  );
  const [goals, setGoals] = useState<string[]>(
    Array.isArray(user.goals) ? user.goals : ["Balanced diet"]
  );
  const [allergies, setAllergies] = useState<string[]>(
    Array.isArray(user.allergies) ? user.allergies : []
  );
  const [diet, setDiet] = useState<string[]>(
    Array.isArray(user.diet) ? user.diet : []
  );

  const steps = [
    {
      title: "What should we keep an eye on?",
      sub: "Add any health conditions — we'll factor them into every scan.",
      node: (
        <TagInput
          label="Health conditions"
          description="Type your own or pick from common ones."
          values={conditions}
          onChange={setConditions}
          suggestions={SUGGESTIONS.conditions}
          placeholder="e.g. Type 2 diabetes"
        />
      ),
    },
    {
      title: "What are you working toward?",
      sub: "Your goals shape what we recommend.",
      node: (
        <TagInput
          label="Fitness & wellness goals"
          values={goals}
          onChange={setGoals}
          suggestions={SUGGESTIONS.goals}
          accent="accent"
          placeholder="e.g. Muscle gain"
        />
      ),
    },
    {
      title: "Anything to avoid?",
      sub: "We'll flag these prominently on every label.",
      node: (
        <TagInput
          label="Allergies & restrictions"
          description="Critical warnings will be highlighted in red."
          values={allergies}
          onChange={setAllergies}
          suggestions={SUGGESTIONS.allergies}
          accent="warn"
          placeholder="e.g. Peanuts"
        />
      ),
    },
    {
      title: "How do you eat?",
      sub: "Your dietary style — pick all that apply.",
      node: (
        <TagInput
          label="Dietary preferences"
          values={diet}
          onChange={setDiet}
          suggestions={SUGGESTIONS.diet}
          placeholder="e.g. Vegan"
        />
      ),
    },
  ];

  const last = step === steps.length - 1;
  const current = steps[step];

  const updateProfile = async () => {
    try {
      const userId = user.id;
      if (!userId) {
        alert("Not logged in — please sign in again.");
        navigate("/login");
        return;
      }

      const res = await fetch(`http://127.0.0.1:5000/api/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, goals, allergies, diet }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update localStorage with latest profile data
        localStorage.setItem(
          "user",
          JSON.stringify({ ...user, conditions, goals, allergies, diet })
        );
        navigate("/scan");
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error — is the backend running?");
    }
  };

  return (
    <main className="min-h-dvh pb-32">
      <header className="container max-w-3xl flex items-center justify-between py-6">
        <Logo />
        <span className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</span>
      </header>

      <div className="container max-w-3xl">
        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
              <div
                className="h-full bg-gradient-brand transition-all duration-500"
                style={{ width: i <= step ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>

        <section key={step} className="animate-fade-in space-y-8">
          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{current.title}</h1>
            <p className="text-muted-foreground">{current.sub}</p>
          </div>

          <div className="glass-strong rounded-3xl p-6 sm:p-8">{current.node}</div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-full"
            >
              <ArrowLeft className="size-4" /> Back
            </Button>

            {!last ? (
              <Button variant="hero" size="lg" onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button variant="hero" size="lg" onClick={updateProfile}>
                Finish <Check className="size-4" />
              </Button>
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
};

export default Profile;

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateCypher } from "../hooks";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { FadeUp } from "../components/ui/motion";

const SAFETY_TAGS = [
  "Women-welcome",
  "Beginner-friendly",
  "Alcohol-free",
  "ID-checked",
  "Organizer-verified",
  "Community-safe",
  "All-levels",
  "No pressure to perform",
];

const CITIES = [
  "Delhi", "Mumbai", "Bangalore", "Kolkata", "Chennai",
  "Hyderabad", "Pune", "Goa", "Shillong", "Guwahati",
  "Jaipur", "Ahmedabad", "Chandigarh", "Indore", "Lucknow",
];

type FormData = {
  type: "OPEN" | "VENUE";
  title: string;
  description: string;
  city: string;
  venue: string;
  startsAt: string;
  quota: string;
  safetyTags: string[];
};

const inputClass = "w-full glass-card border border-white/[0.08] rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/28 focus:outline-none focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20 transition-all duration-200";
const labelClass = "block font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/50 mb-1.5";

export default function CreateCypher() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType =
    searchParams.get("type") === "venue" ? "VENUE" : "OPEN";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    type: initialType,
    title: "",
    description: "",
    city: "",
    venue: "",
    startsAt: "",
    quota: "",
    safetyTags: [],
  });
  const [error, setError] = useState("");
  const create = useCreateCypher();

  const set = (field: keyof FormData, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleTag = (tag: string) =>
    setForm((prev) => ({
      ...prev,
      safetyTags: prev.safetyTags.includes(tag)
        ? prev.safetyTags.filter((t) => t !== tag)
        : [...prev.safetyTags, tag],
    }));

  async function submit() {
    setError("");
    try {
      const result = await create.mutateAsync({
        title: form.title.trim(),
        type: form.type,
        city: form.city,
        venue: form.venue.trim() || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        quota:
          form.type === "VENUE" && form.quota
            ? parseInt(form.quota, 10)
            : undefined,
        description: form.description.trim() || undefined,
        safetyTags: form.safetyTags,
      });
      navigate(`/cyphers/${result.id}`);
    } catch {
      setError("Something went wrong. Check your details and try again.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      {/* Step bar */}
      <div className="mb-8 flex items-center gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              s <= step ? "bg-primary" : "bg-white/[0.10]"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Type + title ── */}
      {step === 1 && (
        <FadeUp>
          <Badge tone="orange">Starting a cypher</Badge>
          <h1 className="mt-4 font-headline-xl text-[2rem] md:text-[2.5rem] text-on-surface tracking-tight">
            What kind of circle?
          </h1>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {(["OPEN", "VENUE"] as const).map((t) => (
              <button
                key={t}
                onClick={() => set("type", t)}
                className={`rounded-2xl border p-5 text-left transition-all duration-200 ${
                  form.type === t
                    ? "border-primary-container/40 bg-primary-container/08"
                    : "border-white/[0.06] glass-card hover:border-primary-container/20"
                }`}
              >
                <Badge tone={t === "OPEN" ? "cyan" : "orange"}>{t}</Badge>
                <p className="mt-3 font-semibold text-on-surface">
                  {t === "OPEN" ? "Open Cypher" : "Venue Cypher"}
                </p>
                <p className="mt-1 font-body-md text-sm text-on-surface-variant/50">
                  {t === "OPEN"
                    ? "A street-style open circle. Anyone can pull up. No cap."
                    : "Organized venue event. Capacity-limited. Entry controlled."}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <label className={labelClass}>Give it a name</label>
            <input
              className={inputClass + " text-lg font-semibold"}
              placeholder={
                form.type === "OPEN"
                  ? "e.g. Delhi Rooftop Sessions"
                  : "e.g. The Cyphers × Kitty Su"
              }
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="mt-5">
            <label className={labelClass}>
              Description{" "}
              <span className="normal-case text-on-surface-variant/28">(optional)</span>
            </label>
            <textarea
              className={`${inputClass} resize-none`}
              placeholder="What's the vibe? Who should come? What's the intent?"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <Button
            className="mt-8 w-full"
            onClick={() => setStep(2)}
            disabled={!form.title.trim()}
          >
            Set the time and place →
          </Button>
        </FadeUp>
      )}

      {/* ── Step 2: When + where ── */}
      {step === 2 && (
        <FadeUp>
          <Badge tone="orange">When and where</Badge>
          <h1 className="mt-4 font-headline-xl text-[2rem] text-on-surface tracking-tight">
            {form.title}
          </h1>
          <p className="mt-1 font-label-sm text-xs uppercase tracking-widest text-on-surface-variant/40">
            {form.type} CYPHER
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label className={labelClass}>City</label>
              <select
                className={inputClass}
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              >
                <option value="">Select city…</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Venue / Location{" "}
                <span className="normal-case text-on-surface-variant/28">
                  {form.type === "OPEN"
                    ? "(optional — a neighbourhood is fine)"
                    : "(required)"}
                </span>
              </label>
              <input
                className={inputClass}
                placeholder={
                  form.type === "OPEN"
                    ? "Rajouri Garden rooftop, or just 'South Delhi'"
                    : "Venue name and address"
                }
                value={form.venue}
                onChange={(e) => set("venue", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Starts at</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </div>

            {form.type === "VENUE" && (
              <div>
                <label className={labelClass}>
                  Capacity{" "}
                  <span className="normal-case text-on-surface-variant/28">(leave empty for unlimited)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  placeholder="e.g. 50"
                  value={form.quota}
                  onChange={(e) => set("quota", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => setStep(3)}
              disabled={!form.startsAt || !form.city}
            >
              Safety & finish →
            </Button>
          </div>
        </FadeUp>
      )}

      {/* ── Step 3: Safety tags + submit ── */}
      {step === 3 && (
        <FadeUp>
          <Badge tone="green">Safety first, always</Badge>
          <h1 className="mt-4 font-headline-xl text-[2rem] text-on-surface tracking-tight">
            What describes this space?
          </h1>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant/60">
            These tags help people — especially beginners and women — feel comfortable pulling up.
            None are required, but they make a real difference.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {SAFETY_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-4 py-2 font-label-sm text-sm transition-all duration-200 ${
                  form.safetyTags.includes(tag)
                    ? "border-[#34D399]/50 bg-[rgba(52,211,153,0.10)] text-[#34D399]"
                    : "border-white/[0.08] text-on-surface-variant/55 hover:border-primary-container/20 hover:text-primary-fixed-dim"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Summary preview */}
          <div className="mt-8 rounded-2xl border border-white/[0.06] glass-card p-5">
            <p className="font-semibold text-on-surface">{form.title}</p>
            <p className="mt-1 font-body-md text-sm text-on-surface-variant/50">
              {form.type} · {form.city}
              {form.venue && ` · ${form.venue}`}
            </p>
            <p className="mt-1 font-body-md text-sm text-on-surface-variant/50">
              {form.startsAt &&
                new Date(form.startsAt).toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              {form.type === "VENUE" && form.quota && ` · ${form.quota} spots`}
            </p>
            {form.safetyTags.length > 0 && (
              <p className="mt-2 font-label-sm text-xs text-on-surface-variant/40">
                {form.safetyTags.join(" · ")}
              </p>
            )}
          </div>

          {error && (
            <p className="mt-4 font-body-md text-sm text-error">{error}</p>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={submit}
              disabled={create.isPending}
            >
              {create.isPending ? "Starting circle..." : "Start the circle →"}
            </Button>
          </div>
        </FadeUp>
      )}
    </div>
  );
}

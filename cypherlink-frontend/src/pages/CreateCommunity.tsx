import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { FadeUp } from "../components/ui/motion";
import { useCreateSession } from "../hooks";

type SessionType = "CLEANUP" | "TEACHING" | "RELIEF" | "ARTIST_SUPPORT" | "COMMUNITY_HELP";

const SESSION_TYPES: { value: SessionType; label: string; desc: string; tone: "cyan" | "green" | "orange" | "purple" | "muted" }[] = [
  { value: "CLEANUP", label: "City Cleanup", desc: "Show up for the city that raised the culture.", tone: "green" },
  { value: "TEACHING", label: "Teach a Skill", desc: "Share what you know. Someone out there needs it.", tone: "cyan" },
  { value: "RELIEF", label: "Artist Relief", desc: "Support a local artist going through a hard time.", tone: "orange" },
  { value: "ARTIST_SUPPORT", label: "Artist Support", desc: "Show up for someone in the scene.", tone: "muted" },
  { value: "COMMUNITY_HELP", label: "Community Move", desc: "Something the scene needs that doesn't fit a category.", tone: "muted" },
];

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"];

const SAFETY_TAGS = [
  "Women welcome",
  "Beginner friendly",
  "Sober space",
  "Family friendly",
  "Queer affirming",
  "No unsolicited recording",
];

const inputClass = "w-full glass-card border border-white/[0.08] rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/28 focus:outline-none focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20 transition-all duration-200";
const labelClass = "block font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/50 mb-1.5";

export default function CreateCommunity() {
  const navigate = useNavigate();
  const createSession = useCreateSession();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<SessionType | "">("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [safetyTags, setSafetyTags] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function toggleSafetyTag(tag: string) {
    setSafetyTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  const selectedType = SESSION_TYPES.find((t) => t.value === type);

  async function submit() {
    if (!type || !city || !startsAt || !title) {
      setError("Fill in session type, city, date, and title.");
      return;
    }
    setError("");
    try {
      await createSession.mutateAsync({
        type,
        city,
        venue: venue || undefined,
        startsAt: new Date(startsAt).toISOString(),
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        safetyTags,
        title,
        description: description || undefined,
      });
      navigate("/community");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? "Could not create session. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <Badge tone="green">Community session</Badge>
        <h1 className="mt-4 font-headline-xl text-headline-xl tracking-tight text-on-surface">
          Start a move for the scene
        </h1>
        <p className="mt-2 font-body-md text-on-surface-variant/50">
          Culture infrastructure. Not an event. A moment of collective action.
        </p>
      </FadeUp>

      {/* Progress */}
      <div className="mt-8 flex gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-white/[0.10]"}`} />
        ))}
      </div>

      <div className="mt-8">
        {step === 1 && (
          <FadeUp>
            <h2 className="font-headline-lg-mobile text-xl font-semibold text-on-surface">
              What kind of move is this?
            </h2>
            <div className="mt-4 space-y-3">
              {SESSION_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${
                    type === t.value
                      ? "border-primary-container/40 bg-primary-container/08"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 transition ${
                    type === t.value ? "border-primary bg-primary" : "border-white/[0.30]"
                  }`} />
                  <div>
                    <p className="font-body-md font-semibold text-on-surface">{t.label}</p>
                    <p className="mt-0.5 font-label-sm text-sm text-on-surface-variant/50">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </FadeUp>
        )}

        {step === 2 && (
          <FadeUp>
            <h2 className="font-headline-lg-mobile text-xl font-semibold text-on-surface">
              Where and when?
            </h2>
            <div className="mt-4 space-y-5">
              <div>
                <label className={labelClass}>City *</label>
                <select
                  className={inputClass}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="">Select city</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Venue / meeting point{" "}
                  <span className="normal-case text-on-surface-variant/28">(optional)</span>
                </label>
                <input
                  className={inputClass}
                  placeholder="Park, community center, online, etc."
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Date and time *</label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Max people{" "}
                  <span className="normal-case text-on-surface-variant/28">(optional)</span>
                </label>
                <input
                  type="number"
                  className={inputClass}
                  placeholder="Leave blank for open"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min={1}
                />
              </div>
            </div>
          </FadeUp>
        )}

        {step === 3 && (
          <FadeUp>
            <h2 className="font-headline-lg-mobile text-xl font-semibold text-on-surface">
              Make it safe
            </h2>
            <p className="mt-2 font-body-md text-on-surface-variant/50">
              Tag this session so the right people feel comfortable showing up.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SAFETY_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleSafetyTag(tag)}
                  className={`rounded-full border px-4 py-2 font-label-sm text-sm transition ${
                    safetyTags.includes(tag)
                      ? "border-green-500/50 bg-green-500/10 text-green-300"
                      : "border-white/[0.08] text-on-surface-variant/60 hover:border-white/[0.18]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </FadeUp>
        )}

        {step === 4 && (
          <FadeUp>
            <h2 className="font-headline-lg-mobile text-xl font-semibold text-on-surface">
              Name it
            </h2>
            {selectedType && (
              <div className="mt-4 glass-card rounded-2xl border border-white/[0.06] p-4">
                <p className="font-label-sm text-xs text-on-surface-variant/40">
                  {selectedType.label} · {city}
                </p>
                <p className="mt-1 font-label-sm text-xs text-on-surface-variant/40">
                  {startsAt ? new Date(startsAt).toLocaleDateString("en-IN", {
                    weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  }) : ""}
                </p>
              </div>
            )}
            <div className="mt-4 space-y-5">
              <div>
                <label className={labelClass}>Title *</label>
                <input
                  className={inputClass}
                  placeholder="Give it a name worth showing up for"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div>
                <label className={labelClass}>
                  What's the intention?{" "}
                  <span className="normal-case text-on-surface-variant/28">(optional)</span>
                </label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Why now? What do you want to leave behind?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
              {error && (
                <div className="rounded-2xl border border-error/25 bg-error/08 p-3">
                  <p className="font-body-md text-sm text-error/80">{error}</p>
                </div>
              )}
            </div>
          </FadeUp>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <Button variant="secondary" className="flex-1" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button
            className="flex-1"
            disabled={step === 1 && !type}
            onClick={() => setStep(step + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button className="flex-1" onClick={submit} disabled={createSession.isPending}>
            {createSession.isPending ? "Creating..." : "Start the move"}
          </Button>
        )}
      </div>
    </div>
  );
}

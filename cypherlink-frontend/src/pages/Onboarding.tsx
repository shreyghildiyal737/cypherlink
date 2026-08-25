import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { FadeUp } from "../components/ui/motion";
import { useUpdateProfile } from "../hooks";
import { dismissOnboarding } from "../store/authStore";

const ROLES = ["Rapper", "Producer", "Singer", "Multi-hyphenate", "DJ", "Beatmaker", "Songwriter", "Poet", "Visual artist", "Other"];
const GENRES = ["Hip-hop", "Trap", "Drill", "Boom bap", "R&B", "Afrobeats", "Indie", "Lo-fi", "Experimental", "Jazz", "Pop", "Spoken word"];
const LANGUAGES = ["Hindi", "English", "Punjabi", "Tamil", "Telugu", "Bengali", "Marathi", "Kannada", "Gujarati", "Other"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Other"];

const inputClass = "w-full glass-card border border-white/[0.08] rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/28 focus:outline-none focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20 transition-all duration-200";
const labelClass = "block font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/50 mb-1.5";

export default function Onboarding() {
  const navigate = useNavigate();
  const update = useUpdateProfile();

  const [step, setStep] = useState(1);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [openToCollab, setOpenToCollab] = useState(false);
  const [beginnerFriendly, setBeginnerFriendly] = useState(false);

  function toggleGenre(g: string) {
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  function toggleLanguage(l: string) {
    setLanguages((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);
  }

  async function finish() {
    try {
      await update.mutateAsync({
        bio: bio || undefined,
        city: city || undefined,
        primaryRole: role || undefined,
        genres: genres.length ? genres : undefined,
        languages: languages.length ? languages : undefined,
        openToCollab,
        beginnerFriendly,
      });
    } catch {}
    dismissOnboarding();
    navigate("/home");
  }

  function skip() {
    dismissOnboarding();
    navigate("/home");
  }

  const STEP_TITLES = [
    "Set the scene for your identity",
    "What do you bring to the circle?",
    "What does your music live in?",
    "How do you want to show up?",
    "Your location stays yours",
  ];

  return (
    <div className="mx-auto grid min-h-screen max-w-lg place-items-center px-margin-mobile py-8">
      {/* Ambient */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-container/08 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full">
        {/* Progress bar */}
        <FadeUp>
          <div className="mb-8 flex gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={5}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  s <= step ? "bg-primary" : "bg-white/[0.10]"
                }`}
              />
            ))}
          </div>
        </FadeUp>

        {/* Step content */}
        <FadeUp key={step}>
          <div className="rounded-2xl border border-white/[0.06] glass-panel p-6">
            <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">
              Step {step} of 5
            </p>
            <h1 className="mt-2 font-headline-xl text-[2rem] text-on-surface tracking-tight">
              {STEP_TITLES[step - 1]}
            </h1>

            {step === 1 && (
              <div className="mt-6 space-y-5">
                <p className="font-body-md text-body-md text-on-surface-variant/50">
                  This is what the culture sees first. All optional — you can update it any time.
                </p>
                <div>
                  <label className={labelClass}>Your city</label>
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
                  <label className={labelClass}>Bio</label>
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={3}
                    placeholder="What are you about? Keep it real."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={280}
                  />
                  <p className="mt-1 text-right font-label-sm text-xs text-on-surface-variant/28">{bio.length}/280</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mt-6 space-y-5">
                <p className="font-body-md text-body-md text-on-surface-variant/50">Pick what fits best. You can always expand on this.</p>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-full border px-4 py-2 font-label-sm text-sm transition-all duration-200 ${
                        role === r
                          ? "border-primary-container/50 bg-primary-container/12 text-on-surface"
                          : "border-white/[0.08] text-on-surface-variant/60 hover:border-primary-container/20 hover:text-primary-fixed-dim"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-6 space-y-5">
                <p className="font-body-md text-body-md text-on-surface-variant/50">Select genres and languages. Pick as many as apply.</p>
                <div>
                  <p className="mb-2 font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((g) => (
                      <button
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className={`rounded-full border px-4 py-2 font-label-sm text-sm transition-all duration-200 ${
                          genres.includes(g)
                            ? "border-primary-container/50 bg-primary-container/12 text-on-surface"
                            : "border-white/[0.08] text-on-surface-variant/60 hover:border-primary-container/20"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">Languages you create in</p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l}
                        onClick={() => toggleLanguage(l)}
                        className={`rounded-full border px-4 py-2 font-label-sm text-sm transition-all duration-200 ${
                          languages.includes(l)
                            ? "border-primary-container/50 bg-primary-container/12 text-on-surface"
                            : "border-white/[0.08] text-on-surface-variant/60 hover:border-primary-container/20"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="mt-6 space-y-5">
                <p className="font-body-md text-body-md text-on-surface-variant/50">This helps others know how to approach you.</p>
                {[
                  { value: openToCollab, set: setOpenToCollab, title: "Open to collaborating", desc: "Others can reach out to work on projects with you." },
                  { value: beginnerFriendly, set: setBeginnerFriendly, title: "Comfortable with beginners", desc: "You're open to working with or mentoring newer artists." },
                ].map(({ value, set, title, desc }) => (
                  <button
                    key={title}
                    onClick={() => set(!value)}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
                      value
                        ? "border-primary-container/40 bg-primary-container/08"
                        : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    <div className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                      value ? "border-primary bg-primary" : "border-white/[0.30]"
                    }`}>
                      {value && <span className="material-symbols-outlined text-[12px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{title}</p>
                      <p className="mt-0.5 font-body-md text-sm text-on-surface-variant/50">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="mt-6 space-y-5">
                <p className="font-body-md text-body-md text-on-surface-variant/50">
                  CypherLink only shows your city — never your precise location. We don't track where you are, only where your scene is.
                </p>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
                  {[
                    "City-level only — never street, neighborhood, or coordinates",
                    "Check-in is always your choice — nothing is automatic",
                    "You can hide your city entirely from Settings any time",
                  ].map((line) => (
                    <div key={line} className="flex items-center gap-3">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <p className="font-body-md text-sm text-on-surface-variant/70">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FadeUp>

        {/* Navigation */}
        <div className="mt-6 flex items-center gap-3">
          {step > 1 && (
            <Button variant="secondary" className="flex-1" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 5 ? (
            <Button className="flex-1 justify-center" onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button className="flex-1 justify-center" onClick={finish} disabled={update.isPending}>
              {update.isPending ? "Saving..." : "Enter the scene"}
            </Button>
          )}
        </div>
        <button
          className="mt-4 block w-full text-center font-label-sm text-sm text-on-surface-variant/28 transition hover:text-on-surface-variant/50"
          onClick={skip}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

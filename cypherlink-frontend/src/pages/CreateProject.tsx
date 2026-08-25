import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateProject, useCypher } from "../hooks";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { FadeUp } from "../components/ui/motion";
import type { CommitmentStyle } from "../types";

const ROLE_SUGGESTIONS = [
  "Rapper", "Vocalist", "Producer", "Beatmaker",
  "Engineer", "Mixing engineer", "Lyricist", "Guitarist",
  "Bassist", "Drummer", "Keyboardist", "Flautist",
  "Videographer", "Graphic designer", "Photographer",
];

const TAG_SUGGESTIONS = [
  "Hip-Hop", "Rap", "R&B", "Indie", "Experimental",
  "Trap", "Drill", "Conscious", "Lo-fi", "Neo-soul",
  "Afrobeats", "Jazz-rap", "Hindustani fusion", "Spoken word",
];

const CITIES = [
  "Delhi", "Mumbai", "Bangalore", "Kolkata", "Chennai",
  "Hyderabad", "Pune", "Goa", "Shillong", "Guwahati",
  "Jaipur", "Ahmedabad", "Chandigarh", "Indore", "Lucknow",
];

const COMMITMENT_OPTIONS: { value: CommitmentStyle; label: string; desc: string }[] = [
  { value: "EXPERIMENTAL",      label: "Experimental",    desc: "Exploring with no fixed goal" },
  { value: "CASUAL",            label: "Casual",          desc: "Low pressure, come as you are" },
  { value: "QUICK_JAM",         label: "Quick Jam",       desc: "One session, get something made" },
  { value: "ONE_NIGHT_SESSION", label: "One-Night",       desc: "Single evening, full focus" },
  { value: "LONG_TERM_PROJECT", label: "Long-Term",       desc: "Months of work together" },
  { value: "RELEASE_FOCUSED",   label: "Release-Focused", desc: "Building toward a drop" },
  { value: "PRACTICE_SESSION",  label: "Practice",        desc: "Sharpen skills together" },
  { value: "LEARNING_PROJECT",  label: "Learning",        desc: "Mentorship or skill-building" },
];

type FormData = {
  title: string;
  description: string;
  city: string;
  tags: string[];
  openRoles: string[];
  visibility: "OPEN" | "DISCOVERABLE" | "PRIVATE";
  projectType: "STRUCTURED" | "OPEN_COLLAB";
  localRemote: "LOCAL" | "REMOTE" | "BOTH";
  roughExpectation: string;
  commitmentStyle: CommitmentStyle | "";
  bornFromCypherId?: string;
  participantCap: string;
  aiDisclosureLabel: "" | "ai-assisted" | "ai-generated" | "ai-workflow";
};

const inputClass = "w-full glass-card border border-white/[0.08] rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/28 focus:outline-none focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20 transition-all duration-200";
const labelClass = "block font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/50 mb-1.5";

export default function CreateProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromCypherId = searchParams.get("fromCypher") ?? undefined;
  const { data: sourceCypher } = useCypher(fromCypherId ?? "");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    city: "",
    tags: [],
    openRoles: [],
    visibility: "OPEN",
    projectType: fromCypherId ? "OPEN_COLLAB" : "STRUCTURED",
    localRemote: "BOTH",
    roughExpectation: "",
    commitmentStyle: "",
    bornFromCypherId: fromCypherId,
    participantCap: "",
    aiDisclosureLabel: "",
  });
  const [roleInput, setRoleInput] = useState("");
  const [error, setError] = useState("");
  const create = useCreateProject();

  const toggleTag = (tag: string) =>
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));

  const toggleRole = (role: string) =>
    setForm((prev) => ({
      ...prev,
      openRoles: prev.openRoles.includes(role)
        ? prev.openRoles.filter((r) => r !== role)
        : [...prev.openRoles, role],
    }));

  const addCustomRole = () => {
    const r = roleInput.trim();
    if (r && !form.openRoles.includes(r)) {
      setForm((prev) => ({ ...prev, openRoles: [...prev.openRoles, r] }));
    }
    setRoleInput("");
  };

  async function submit() {
    setError("");
    try {
      const result = await create.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        city: form.city || undefined,
        tags: form.tags,
        openRoles: form.openRoles,
        visibility: form.visibility,
        projectType: form.projectType,
        localRemote: form.localRemote,
        roughExpectation: form.roughExpectation.trim() || undefined,
        commitmentStyle: form.commitmentStyle || undefined,
        bornFromCypherId: form.bornFromCypherId,
        participantCap: form.participantCap ? parseInt(form.participantCap) : undefined,
        aiDisclosureLabel: form.aiDisclosureLabel || undefined,
      });
      navigate(`/projects/${result.id}`);
    } catch {
      setError("Something went wrong. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      {/* Step bar */}
      <div className="mb-8 flex items-center gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2}>
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? "bg-primary" : "bg-white/[0.10]"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: What are you making? ── */}
      {step === 1 && (
        <FadeUp>
          <Badge tone="cyan">Starting a project</Badge>
          {fromCypherId && sourceCypher && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary-container/25 bg-primary-container/08 px-4 py-2.5">
              <span className="material-symbols-outlined text-[14px] text-primary/70" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
              <span className="font-body-md text-sm text-on-surface-variant/70">
                Born from <span className="text-primary-fixed-dim font-medium">{sourceCypher.title}</span> · {sourceCypher.city}
              </span>
            </div>
          )}
          <h1 className="mt-4 font-headline-xl text-headline-xl md:text-[clamp(2rem,5vw,3.5rem)] tracking-tight text-on-surface">
            What are you making?
          </h1>

          <div className="mt-8 space-y-5">
            {/* Project type */}
            <div>
              <label className={labelClass}>What kind of collaboration is this?</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { value: "STRUCTURED",  label: "Structured project",    desc: "Clear goals, milestones, deliverables" },
                  { value: "OPEN_COLLAB", label: "Open collaboration",     desc: "Loose, experimental — see where it goes" },
                ] as const).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setForm((p) => ({ ...p, projectType: value }))}
                    className={`rounded-2xl border p-4 text-left transition ${
                      form.projectType === value
                        ? "border-primary-container/40 bg-primary-container/08"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                    }`}
                  >
                    <p className="font-body-md text-sm font-semibold text-on-surface">{label}</p>
                    <p className="mt-1 font-label-sm text-xs text-on-surface-variant/50">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Project title</label>
              <input
                className={inputClass + " text-lg font-semibold"}
                placeholder="e.g. Monsoon Frequencies Vol. 2"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={labelClass}>
                What's the vibe?{" "}
                <span className="normal-case text-on-surface-variant/28">(optional)</span>
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                placeholder="What are you building? What's the intent? What does the finished piece sound like?"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={labelClass}>
                Genres{" "}
                <span className="normal-case text-on-surface-variant/28">(pick what fits)</span>
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TAG_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1.5 font-label-sm text-sm transition ${
                      form.tags.includes(tag)
                        ? "border-primary-container/50 bg-primary-container/12 text-on-surface"
                        : "border-white/[0.08] text-on-surface-variant/55 hover:border-white/[0.18]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            className="mt-8 w-full"
            onClick={() => setStep(2)}
            disabled={!form.title.trim()}
          >
            Who do you need? →
          </Button>
        </FadeUp>
      )}

      {/* ── Step 2: Collaborators + visibility ── */}
      {step === 2 && (
        <FadeUp>
          <Badge tone="cyan">Open the door</Badge>
          <h1 className="mt-4 font-headline-lg-mobile text-2xl font-semibold text-on-surface">
            {form.title}
          </h1>
          <p className="mt-1 font-body-md text-on-surface-variant/50">Who are you looking for?</p>

          <div className="mt-8 space-y-6">
            <div>
              <label className={labelClass}>
                Roles needed{" "}
                <span className="normal-case text-on-surface-variant/28">(select or type your own)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLE_SUGGESTIONS.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`rounded-full border px-3 py-1.5 font-label-sm text-sm transition ${
                      form.openRoles.includes(role)
                        ? "border-primary-container/50 bg-primary-container/12 text-on-surface"
                        : "border-white/[0.08] text-on-surface-variant/55 hover:border-white/[0.18]"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className={inputClass + " text-sm"}
                  placeholder="Add custom role…"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomRole()}
                />
                <Button variant="secondary" onClick={addCustomRole}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                City{" "}
                <span className="normal-case text-on-surface-variant/28">(optional — open everywhere if skipped)</span>
              </label>
              <select
                className={inputClass}
                value={form.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, city: e.target.value }))
                }
              >
                <option value="">No specific city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Who can find this?</label>
              <div className="grid gap-3 md:grid-cols-3">
                {(
                  [
                    {
                      value: "OPEN",
                      label: "Open",
                      desc: "Anyone can find it and ask to join",
                    },
                    {
                      value: "DISCOVERABLE",
                      label: "Discoverable",
                      desc: "Visible in search, invites only",
                    },
                    {
                      value: "PRIVATE",
                      label: "Private",
                      desc: "Only people you invite",
                    },
                  ] as const
                ).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setForm((p) => ({ ...p, visibility: value }))}
                    className={`rounded-2xl border p-4 text-left transition ${
                      form.visibility === value
                        ? "border-primary-container/40 bg-primary-container/08"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                    }`}
                  >
                    <p className="font-body-md text-sm font-semibold text-on-surface">{label}</p>
                    <p className="mt-1 font-label-sm text-xs text-on-surface-variant/50">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Local / remote */}
            <div>
              <label className={labelClass}>Local or remote?</label>
              <div className="flex gap-3">
                {([
                  { value: "LOCAL",  label: "Local",   desc: "In-person city sessions" },
                  { value: "REMOTE", label: "Remote",  desc: "File exchange / online" },
                  { value: "BOTH",   label: "Either",  desc: "Flexible" },
                ] as const).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setForm((p) => ({ ...p, localRemote: value }))}
                    className={`flex-1 rounded-2xl border p-3 text-left transition ${
                      form.localRemote === value
                        ? "border-primary-container/40 bg-primary-container/08"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                    }`}
                  >
                    <p className="font-body-md text-sm font-semibold text-on-surface">{label}</p>
                    <p className="mt-0.5 font-label-sm text-xs text-on-surface-variant/50">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Rough expectation */}
            <div>
              <label className={labelClass}>
                What's the expectation?{" "}
                <span className="normal-case text-on-surface-variant/28">(optional but helps people decide)</span>
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                placeholder='e.g. "Looking for one vocalist for 3 tracks, remote, 2-week turnaround"'
                rows={2}
                value={form.roughExpectation}
                onChange={(e) => setForm((p) => ({ ...p, roughExpectation: e.target.value }))}
                maxLength={500}
              />
            </div>

            {/* Commitment style */}
            <div>
              <label className={labelClass}>
                Commitment style{" "}
                <span className="normal-case text-on-surface-variant/28">(optional — helps match expectations)</span>
              </label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {COMMITMENT_OPTIONS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setForm((p) => ({ ...p, commitmentStyle: p.commitmentStyle === value ? "" : value }))}
                    className={`rounded-xl border p-3 text-left transition ${
                      form.commitmentStyle === value
                        ? "border-primary-container/40 bg-primary-container/08"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                    }`}
                  >
                    <p className="font-body-md text-sm font-semibold text-on-surface">{label}</p>
                    <p className="mt-0.5 font-label-sm text-[10px] text-on-surface-variant/45">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Participant cap — open collabs only */}
            {form.projectType === "OPEN_COLLAB" && (
              <div>
                <label className={labelClass}>
                  Participant cap{" "}
                  <span className="normal-case text-on-surface-variant/28">(optional — max active contributors)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className={inputClass + " text-sm"}
                  placeholder="e.g. 5"
                  value={form.participantCap}
                  onChange={(e) => setForm((p) => ({ ...p, participantCap: e.target.value }))}
                />
                <p className="mt-1 font-label-sm text-[10px] text-on-surface-variant/35">
                  Once reached, new applicants can't join until a spot opens.
                </p>
              </div>
            )}

            {/* AI disclosure */}
            <div>
              <label className={labelClass}>
                AI involvement{" "}
                <span className="normal-case text-on-surface-variant/28">(optional — be transparent with collaborators)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: "" as const,            label: "None / not applicable" },
                  { value: "ai-assisted" as const,  label: "AI-assisted" },
                  { value: "ai-generated" as const, label: "AI-generated" },
                  { value: "ai-workflow" as const,  label: "AI in workflow" },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value || "none"}
                    onClick={() => setForm((p) => ({ ...p, aiDisclosureLabel: value }))}
                    className={`rounded-full border px-3 py-1.5 font-label-sm text-sm transition ${
                      form.aiDisclosureLabel === value
                        ? "border-primary-container/40 bg-primary-container/08 text-on-surface"
                        : "border-white/[0.08] text-on-surface-variant/50 hover:border-white/[0.18]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 glass-card rounded-2xl border border-white/[0.06] p-5">
            <p className="font-body-md font-semibold text-on-surface">{form.title}</p>
            {form.openRoles.length > 0 && (
              <p className="mt-1 font-label-sm text-sm text-on-surface-variant/50">
                Looking for: {form.openRoles.join(", ")}
              </p>
            )}
            {form.tags.length > 0 && (
              <p className="mt-1 font-label-sm text-sm text-on-surface-variant/40">
                {form.tags.join(" · ")}
              </p>
            )}
            {form.city && (
              <p className="mt-1 font-label-sm text-sm text-on-surface-variant/40">{form.city}</p>
            )}
            {form.commitmentStyle && (
              <p className="mt-1 font-label-sm text-sm text-on-surface-variant/40">
                {COMMITMENT_OPTIONS.find((o) => o.value === form.commitmentStyle)?.label}
              </p>
            )}
          </div>

          {error && (
            <p className="mt-4 font-body-md text-sm text-error/80">{error}</p>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={submit}
              disabled={create.isPending}
            >
              {create.isPending ? "Opening the room..." : "Open the room →"}
            </Button>
          </div>
        </FadeUp>
      )}
    </div>
  );
}

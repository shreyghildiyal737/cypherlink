import { useState, useEffect, useRef } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { FadeUp } from "../components/ui/motion";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { useUpdateProfile, useUploadUrl } from "../hooks";
import type { AvailabilityStatus, LocalRemotePreference } from "../types";

const ROLE_OPTIONS = [
  "Rapper", "Vocalist", "Producer", "Beatmaker", "Engineer",
  "Mixing engineer", "Lyricist", "Guitarist", "Bassist", "Drummer",
  "Keyboardist", "Flautist", "Videographer", "Graphic designer",
  "Photographer", "Dancer", "Organizer", "Songwriter", "DJ",
  "Mural artist", "Visual artist",
];

const GENRE_OPTIONS = [
  "Hip-Hop", "Rap", "R&B", "Indie", "Experimental", "Trap", "Drill",
  "Conscious", "Lo-fi", "Neo-soul", "Afrobeats", "Jazz-rap",
  "Hindustani fusion", "Spoken word", "Boom Bap", "Folk", "Pop",
];

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string; desc: string; color: string }[] = [
  { value: "OPEN",        label: "Open to Collaborate",  desc: "Actively looking for collabs", color: "border-green-500/40 bg-green-500/08 text-green-400" },
  { value: "SELECTIVE",   label: "Selective",             desc: "Looking, but being choosy",   color: "border-primary-container/40 bg-primary-container/08 text-primary" },
  { value: "BUSY",        label: "Busy",                  desc: "Focused on current projects", color: "border-yellow-500/40 bg-yellow-500/08 text-yellow-400" },
  { value: "UNAVAILABLE", label: "Unavailable",           desc: "Not taking new collabs",      color: "border-white/10 bg-white/[0.02] text-on-surface-variant/50" },
];

const LOCAL_REMOTE_OPTIONS: { value: LocalRemotePreference; label: string; desc: string }[] = [
  { value: "LOCAL",  label: "Local only",   desc: "In-person sessions in my city" },
  { value: "REMOTE", label: "Remote only",  desc: "Online / file exchange only" },
  { value: "BOTH",   label: "Open to both", desc: "Either works for me" },
];

const inputClass = "w-full glass-card border border-white/[0.08] rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/28 focus:outline-none focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20 transition-all duration-200 bg-transparent";
const labelClass = "block font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/50 mb-1.5";

export default function Settings() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const update = useUpdateProfile();
  const uploadUrl = useUploadUrl();

  const profile = (user as any)?.profile;
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName]   = useState<string>((user as any)?.name ?? "");
  const [bio, setBio]                   = useState<string>(profile?.bio ?? "");
  const [city, setCity]                 = useState<string>(profile?.city ?? (user as any)?.city ?? "");
  const [avatarUrl, setAvatarUrl]       = useState<string>(profile?.avatarUrl ?? (user as any)?.avatar ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [primaryRole, setPrimaryRole]   = useState<string>(profile?.primaryRole ?? "");
  const [secondaryRoles, setSecondaryRoles] = useState<string[]>(profile?.secondaryRoles ?? []);
  const [genres, setGenres]             = useState<string[]>(profile?.genres ?? []);
  const [availability, setAvailability] = useState<AvailabilityStatus>(profile?.availabilityStatus ?? "OPEN");
  const [capacity, setCapacity]         = useState<string>(profile?.collaborationCapacity?.toString() ?? "");
  const [lookingFor, setLookingFor]     = useState<string[]>(profile?.lookingFor ?? []);
  const [lookingInput, setLookingInput] = useState("");
  const [localRemote, setLocalRemote]   = useState<LocalRemotePreference>(profile?.localRemotePreference ?? "BOTH");
  const [intent, setIntent]             = useState<string>(profile?.collaborationIntent ?? "");
  const [openToCollab, setOpenToCollab] = useState<boolean>(profile?.openToCollab ?? false);
  const [beginnerFriendly, setBeginner] = useState<boolean>(profile?.beginnerFriendly ?? false);
  const [saved, setSaved]               = useState(false);

  useEffect(() => {
    setDisplayName((user as any)?.name ?? "");
    setAvatarUrl(profile?.avatarUrl ?? (user as any)?.avatar ?? "");
    if (profile) {
      setBio(profile.bio ?? "");
      setCity(profile.city ?? (user as any)?.city ?? "");
      setPrimaryRole(profile.primaryRole ?? "");
      setSecondaryRoles(profile.secondaryRoles ?? []);
      setGenres(profile.genres ?? []);
      setAvailability(profile.availabilityStatus ?? "OPEN");
      setCapacity(profile.collaborationCapacity?.toString() ?? "");
      setLookingFor(profile.lookingFor ?? []);
      setLocalRemote(profile.localRemotePreference ?? "BOTH");
      setIntent(profile.collaborationIntent ?? "");
      setOpenToCollab(profile.openToCollab ?? false);
      setBeginner(profile.beginnerFriendly ?? false);
    }
  }, [profile?.id]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setAvatarUploading(true);
    try {
      const { uploadUrl: presignedUrl, publicUrl } = await uploadUrl.mutateAsync({
        folder: "avatars",
        contentType: file.type,
        fileName: file.name,
        contentLength: file.size,
      });
      await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setAvatarUrl(publicUrl);
      await update.mutateAsync({ avatarUrl: publicUrl });
    } catch {
    } finally {
      setAvatarUploading(false);
    }
  }

  function toggleSecondary(role: string) {
    setSecondaryRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function toggleGenre(g: string) {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  function addLooking() {
    const v = lookingInput.trim();
    if (v && !lookingFor.includes(v)) setLookingFor((p) => [...p, v]);
    setLookingInput("");
  }

  async function saveIdentity() {
    await update.mutateAsync({
      displayName: displayName || undefined,
      bio: bio || undefined,
      city: city || undefined,
      primaryRole: primaryRole || undefined,
      secondaryRoles,
      genres,
      availabilityStatus: availability,
      collaborationCapacity: capacity ? parseInt(capacity, 10) : null,
      lookingFor,
      localRemotePreference: localRemote,
      collaborationIntent: intent || undefined,
      openToCollab,
      beginnerFriendly,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="green">Privacy and safety by design</Badge>
            <h1 className="mt-4 font-headline-xl text-headline-xl md:text-[clamp(2.5rem,5vw,3.5rem)] text-on-surface tracking-tight">
              Settings
            </h1>
          </div>
          {user && (
            <Button variant="secondary" onClick={async () => { await logout(); navigate("/"); }}>
              <span className="material-symbols-outlined text-[15px]">logout</span>
              Log out
            </Button>
          )}
        </div>
      </FadeUp>

      {/* ── Profile basics ── */}
      <section className="mt-10">
        <FadeUp delay={0.05}>
          <h2 className="mb-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Profile
          </h2>
          <p className="mb-6 font-body-md text-sm text-on-surface-variant/50">
            How you appear to other creators.
          </p>
        </FadeUp>

        <FadeUp delay={0.08} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-container via-[#6d28d9] to-[#5200b0] font-bold text-on-primary-container text-xl overflow-hidden">
                {avatarUrl && avatarUrl.startsWith("http") ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{(displayName || "?")[0]?.toUpperCase()}</span>
                )}
              </div>
            </div>
            <div>
              <p className="font-body-md text-sm font-semibold text-on-surface">Profile photo</p>
              <p className="mt-0.5 font-label-sm text-xs text-on-surface-variant/50">JPG, PNG or WebP · max 5 MB</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => avatarFileRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? "Uploading…" : "Change photo"}
              </Button>
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className={labelClass}>Display name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Your name as it appears on your profile"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
            />
          </div>

          {/* Handle (read-only) */}
          {profile?.handle && (
            <div>
              <label className={labelClass}>Handle <span className="normal-case text-on-surface-variant/28">(locked — contact support to change)</span></label>
              <div className={`${inputClass} text-on-surface-variant/50 cursor-not-allowed select-none`}>
                @{profile.handle}
              </div>
            </div>
          )}

          {/* Bio */}
          <div>
            <label className={labelClass}>Bio <span className="normal-case text-on-surface-variant/28">(optional)</span></label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Tell other creators who you are"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
            />
            <p className="mt-1 font-label-sm text-[10px] text-on-surface-variant/30 text-right">{bio.length}/300</p>
          </div>

          {/* City */}
          <div>
            <label className={labelClass}>City <span className="normal-case text-on-surface-variant/28">(used for discovery)</span></label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Atlanta, GA"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={saveIdentity} disabled={update.isPending}>
              {update.isPending ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
            </Button>
            {update.isError && (
              <p className="font-label-sm text-xs text-error/80">Save failed — try again.</p>
            )}
          </div>
        </FadeUp>
      </section>

      {/* ── Identity & Collaboration ── */}
      <section className="mt-10">
        <FadeUp delay={0.05}>
          <h2 className="mb-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Identity &amp; Collaboration
          </h2>
          <p className="mb-6 font-body-md text-sm text-on-surface-variant/50">
            This is how other creators find and understand you. Roles answer "what can you contribute?" — not your rank.
          </p>
        </FadeUp>

        <FadeUp delay={0.08} className="space-y-6">
          {/* Primary role */}
          <div>
            <label className={labelClass}>Primary creative role</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setPrimaryRole(primaryRole === r ? "" : r)}
                  className={`rounded-full border px-3 py-1.5 font-label-sm text-sm transition ${
                    primaryRole === r
                      ? "border-primary-container/60 bg-primary-container/15 text-on-surface"
                      : "border-white/[0.07] text-on-surface-variant/50 hover:border-white/[0.15]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary roles */}
          <div>
            <label className={labelClass}>Secondary roles <span className="normal-case text-on-surface-variant/28">(select all that fit)</span></label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.filter((r) => r !== primaryRole).map((r) => (
                <button
                  key={r}
                  onClick={() => toggleSecondary(r)}
                  className={`rounded-full border px-3 py-1.5 font-label-sm text-sm transition ${
                    secondaryRoles.includes(r)
                      ? "border-tertiary-container/50 bg-tertiary-container/10 text-on-surface"
                      : "border-white/[0.07] text-on-surface-variant/40 hover:border-white/[0.15]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className={labelClass}>Genres / styles</label>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`rounded-full border px-3 py-1.5 font-label-sm text-sm transition ${
                    genres.includes(g)
                      ? "border-primary-container/50 bg-primary-container/12 text-on-surface"
                      : "border-white/[0.07] text-on-surface-variant/40 hover:border-white/[0.15]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className={labelClass}>Collaboration availability</label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {AVAILABILITY_OPTIONS.map(({ value, label, desc, color }) => (
                <button
                  key={value}
                  onClick={() => { setAvailability(value); setOpenToCollab(value === "OPEN" || value === "SELECTIVE"); }}
                  className={`rounded-2xl border p-3 text-left transition ${
                    availability === value ? color : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}
                >
                  <p className="font-body-md text-sm font-semibold">{label}</p>
                  <p className="mt-0.5 font-label-sm text-xs text-on-surface-variant/50">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Capacity */}
          {(availability === "OPEN" || availability === "SELECTIVE") && (
            <div className="max-w-xs">
              <label className={labelClass}>
                Collaboration slots open{" "}
                <span className="normal-case text-on-surface-variant/28">(optional, e.g. "2")</span>
              </label>
              <input
                type="number"
                min={1}
                max={20}
                className={inputClass}
                placeholder="How many more collabs can you take?"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          )}

          {/* Local / remote */}
          <div>
            <label className={labelClass}>Local or remote?</label>
            <div className="flex gap-3">
              {LOCAL_REMOTE_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setLocalRemote(value)}
                  className={`flex-1 rounded-2xl border p-3 text-left transition ${
                    localRemote === value
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

          {/* Looking for */}
          <div>
            <label className={labelClass}>Looking for <span className="normal-case text-on-surface-variant/28">(what role or skill are you seeking right now?)</span></label>
            <div className="flex gap-2 mb-2">
              <input
                className={inputClass + " text-sm"}
                placeholder='e.g. "Folk vocalist" or "Video editor"'
                value={lookingInput}
                onChange={(e) => setLookingInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLooking()}
              />
              <Button variant="secondary" onClick={addLooking}>Add</Button>
            </div>
            {lookingFor.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {lookingFor.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary-container/30 bg-primary-container/08 px-3 py-1 font-label-sm text-sm text-on-surface"
                  >
                    {item}
                    <button onClick={() => setLookingFor((p) => p.filter((x) => x !== item))} className="text-on-surface-variant/50 hover:text-on-surface">
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Collaboration intent */}
          <div>
            <label className={labelClass}>What kind of collaborations are you after? <span className="normal-case text-on-surface-variant/28">(optional)</span></label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="e.g. &quot;Looking to build 3-track EPs with producers I've never met&quot; or &quot;Open to anything experimental&quot;"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              maxLength={200}
            />
            <p className="mt-1 font-label-sm text-[10px] text-on-surface-variant/30 text-right">{intent.length}/200</p>
          </div>

          {/* Beginner friendly */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] p-4">
            <div className="flex-1">
              <p className="font-body-md text-sm font-semibold text-on-surface">Beginner-friendly</p>
              <p className="mt-0.5 font-label-sm text-xs text-on-surface-variant/50">
                You're open to collaborating with or mentoring newer artists.
              </p>
            </div>
            <button
              onClick={() => setBeginner((p) => !p)}
              className={`h-6 w-11 rounded-full transition-colors ${beginnerFriendly ? "bg-primary-container" : "bg-white/[0.08]"}`}
            >
              <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${beginnerFriendly ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={saveIdentity} disabled={update.isPending}>
              {update.isPending ? "Saving…" : saved ? "Saved ✓" : "Save identity"}
            </Button>
            {update.isError && (
              <p className="font-label-sm text-xs text-error/80">Save failed — try again.</p>
            )}
          </div>
        </FadeUp>
      </section>

      {/* ── Privacy (unchanged stubs) ── */}
      <section className="mt-12">
        <FadeUp delay={0.1}>
          <h2 className="mb-5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface-variant/70">
            Privacy controls
          </h2>
        </FadeUp>
        <div className="grid gap-liquid_gap md:grid-cols-2">
          {["Who can DM me", "Location visibility", "QR visibility", "Notification preferences"].map((label) => (
            <div key={label} className="rounded-2xl border border-white/[0.06] glass-card p-5">
              <h3 className="font-semibold text-on-surface">{label}</h3>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">Coming soon — safe defaults applied.</p>
              <Button variant="secondary" size="sm" className="mt-4 opacity-40 cursor-not-allowed" disabled>Configure</Button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Danger zone ── */}
      {user && (
        <section className="mt-10">
          <FadeUp delay={0.15}>
            <h2 className="mb-5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface-variant/70">Danger zone</h2>
            <div className="rounded-2xl border border-secondary/20 bg-secondary-container/04 p-5">
              <h3 className="font-semibold text-on-surface">Log out of all devices</h3>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">Signs you out everywhere. You'll need to log back in.</p>
              <Button variant="danger" className="mt-4" onClick={async () => { await logout(); navigate("/"); }}>
                <span className="material-symbols-outlined text-[15px]">logout</span>
                Log out
              </Button>
            </div>
          </FadeUp>
        </section>
      )}
    </div>
  );
}

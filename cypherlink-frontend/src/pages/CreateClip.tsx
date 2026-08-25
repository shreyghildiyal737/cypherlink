import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { FadeUp } from "../components/ui/motion";
import { useCreateClip, useUploadUrl } from "../hooks";

const REASONS = [
  "Cypher highlight",
  "Open project moment",
  "Looking for collaborators",
  "Free learning moment",
  "Scene moment",
];

const CITIES = [
  "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
  "Shillong", "Guwahati", "Chandigarh", "Bhopal", "Indore",
];

const inputClass = "w-full glass-card border border-white/[0.08] rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/28 focus:outline-none focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20 transition-all duration-200";
const labelClass = "block font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/50 mb-1.5";

export default function CreateClip() {
  const navigate = useNavigate();
  const createClip = useCreateClip();
  const uploadUrl = useUploadUrl();

  const [caption, setCaption] = useState("");
  const [reason, setReason] = useState("");
  const [city, setCity] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setUploadedUrl(null);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { uploadUrl: presignedUrl, publicUrl } = await uploadUrl.mutateAsync({
        folder: "clips",
        contentType: file.type,
        fileName: file.name,
      });
      await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      setUploadedUrl(publicUrl);
    } catch {
      setUploadError("Upload failed. The clip will drop without media.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason || !city) return;
    await createClip.mutateAsync({
      city,
      reason,
      caption: caption.trim() || undefined,
      projectTitle: projectTitle.trim() || undefined,
      mediaUrl: uploadedUrl ?? undefined,
    });
    navigate(`/feed`);
  };

  const canSubmit = !!reason && !!city && !createClip.isPending;

  return (
    <div className="mx-auto max-w-xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <Badge tone="orange">Drop a moment</Badge>
        <h1 className="mt-4 font-headline-xl text-headline-xl tracking-tight text-on-surface">
          Drop Clip
        </h1>
        <p className="mt-2 font-body-md text-on-surface-variant/50">
          One moment worth preserving. Each clip leads somewhere.
        </p>
      </FadeUp>

      <div className="mt-8 space-y-6">
        {/* Reason */}
        <FadeUp delay={0.05}>
          <div>
            <label className={labelClass}>Why are you sharing this?</label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`rounded-full border px-4 py-2 font-label-sm text-sm font-semibold transition ${
                    reason === r
                      ? "border-primary-container/50 bg-primary-container/12 text-on-surface"
                      : "border-white/[0.08] bg-white/[0.02] text-on-surface-variant/60 hover:border-white/[0.18]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Caption */}
        <FadeUp delay={0.08}>
          <div>
            <label className={labelClass}>
              Caption{" "}
              <span className="normal-case text-on-surface-variant/28">(optional)</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="The moment in one line..."
              maxLength={280}
              rows={2}
              className={`${inputClass} resize-none text-sm`}
            />
          </div>
        </FadeUp>

        {/* City */}
        <FadeUp delay={0.10}>
          <div>
            <label className={labelClass}>City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            >
              <option value="">Select your city</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </FadeUp>

        {/* Project link */}
        <FadeUp delay={0.12}>
          <div>
            <label className={labelClass}>
              From project{" "}
              <span className="normal-case text-on-surface-variant/28">(optional)</span>
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Project name..."
              className={`${inputClass} text-sm`}
            />
          </div>
        </FadeUp>

        {/* File upload */}
        <FadeUp delay={0.14}>
          <div className="rounded-2xl border border-dashed border-primary-container/25 bg-primary-container/04 p-5">
            <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/50">
              Media{" "}
              <span className="normal-case text-on-surface-variant/28">(optional)</span>
            </p>
            <p className="mt-1 font-label-sm text-xs text-on-surface-variant/40">
              Audio, video, or image — direct to scene storage.
            </p>
            <div className="mt-4 space-y-3">
              <input
                type="file"
                accept="audio/*,video/*,image/*"
                onChange={handleFileSelect}
                className="block w-full font-label-sm text-sm text-on-surface-variant/60 file:mr-3 file:rounded-full file:border-0 file:bg-white/[0.08] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-on-surface hover:file:bg-white/[0.14]"
              />
              {file && !uploadedUrl && (
                <Button
                  variant="secondary"
                  onClick={handleUpload}
                  disabled={uploading || uploadUrl.isPending}
                >
                  {uploading ? "Uploading..." : `Upload ${file.name}`}
                </Button>
              )}
              {uploadedUrl && (
                <p className="font-body-md text-sm text-[#34d399]">Media uploaded.</p>
              )}
              {uploadError && (
                <p className="font-body-md text-sm text-on-surface-variant/50">{uploadError}</p>
              )}
            </div>
          </div>
        </FadeUp>

        {/* Submit */}
        <Button
          className="w-full"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {createClip.isPending ? "Dropping..." : "Drop clip"}
        </Button>

        {createClip.isError && (
          <p className="font-body-md text-sm text-error/80">
            Something went wrong. Try again.
          </p>
        )}
      </div>
    </div>
  );
}

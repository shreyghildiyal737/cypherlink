import { useState, useRef } from "react";
import { Button } from "../ui/Button";
import { useUploadUrl, useConfirmProjectFile } from "../../hooks";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/flac",
  "application/pdf", "text/plain",
]);

const FILE_HINTS = [
  { icon: "♪", label: "Audio", types: "audio/mpeg,audio/wav,audio/ogg,audio/flac" },
  { icon: "▶", label: "Video", types: "video/mp4,video/webm" },
  { icon: "▤", label: "Doc/Lyrics", types: "application/pdf,text/plain" },
  { icon: "✦", label: "Artwork", types: "image/jpeg,image/png,image/webp,image/gif" },
];

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  projectId: string;
  onClose: () => void;
}

export function ProjectFileUploadModal({ projectId, onClose }: Props) {
  const sign = useUploadUrl();
  const confirm = useConfirmProjectFile();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  function handleFile(f: File | null) {
    if (f) {
      const mime = f.type || "application/octet-stream";
      if (!ALLOWED_MIME_TYPES.has(mime)) {
        setPhase("error");
        setErrorMsg(
          `This file type (${mime || "unknown"}) isn't supported. Drop an audio, video, image, PDF, or plain text file.`,
        );
        setFile(null);
        return;
      }
    }
    setFile(f);
    setProgress(0);
    setPhase("idle");
    setErrorMsg(null);
    setAttempt(0);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function attemptUpload(currentAttempt: number): Promise<void> {
    if (!file) return;
    setPhase("uploading");
    setErrorMsg(null);
    setProgress(0);
    setAttempt(currentAttempt);

    const signed = await sign.mutateAsync({
      folder: `projects/${projectId}`,
      contentType: file.type || "application/octet-stream",
      fileName: file.name,
      contentLength: file.size,
    });

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("PUT", signed.uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      let lastReported = 0;
      xhr.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return;
        const pct = Math.round((ev.loaded / ev.total) * 100);
        if (pct - lastReported >= 2 || pct === 100) {
          lastReported = pct;
          setProgress(pct);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          resolve();
        } else {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.onabort = () => reject(new Error("Upload cancelled"));
      xhr.send(file);
    });

    setPhase("saving");
    await confirm.mutateAsync({
      projectId,
      fileKey: signed.fileKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      publicUrl: signed.publicUrl,
    });

    setPhase("done");
    setTimeout(onClose, 800);
  }

  async function handleUpload() {
    if (!file) return;
    const MAX_ATTEMPTS = 3;
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      try {
        await attemptUpload(i);
        return;
      } catch (e: any) {
        xhrRef.current = null;
        const msg = e?.message ?? "Something went wrong.";
        if (msg.includes("cancelled")) {
          setPhase("idle");
          setProgress(0);
          return;
        }
        const transient = msg.includes("Network") || /\b5\d\d\b/.test(msg);
        if (!transient || i === MAX_ATTEMPTS) {
          setPhase("error");
          setErrorMsg(
            i === MAX_ATTEMPTS && transient
              ? "Upload kept failing. Check your connection and try again."
              : msg,
          );
          return;
        }
        await new Promise((r) => setTimeout(r, i === 1 ? 600 : 1500));
      } finally {
        xhrRef.current = null;
      }
    }
  }

  function handleCancel() {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    onClose();
  }

  const dialogRef = useModalAccessibility(true, handleCancel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Upload file to project"
        className="glass-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.08] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">Shared studio space</p>
            <h2 className="mt-1 font-headline-lg-mobile text-xl text-on-surface">
              Bring something into the project
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="rounded-xl px-3 py-1 font-body-md text-sm text-on-surface-variant/50 transition hover:bg-white/[0.06] hover:text-on-surface"
            disabled={phase === "uploading" || phase === "saving"}
          >
            Close
          </button>
        </div>

        <p className="mt-3 font-body-md text-sm text-on-surface-variant/55">
          Stems, lyrics, references, artwork — everything the project needs in one place.
        </p>

        {/* Type hints */}
        <div className="mt-5 flex flex-wrap gap-2">
          {FILE_HINTS.map((h) => (
            <span
              key={h.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 font-label-sm text-xs text-on-surface-variant/65"
            >
              <span className="text-on-surface-variant/40">{h.icon}</span>
              {h.label}
            </span>
          ))}
        </div>

        {/* Drop zone */}
        {!file && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 cursor-pointer rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.02] p-8 text-center transition hover:border-primary-container/35 hover:bg-primary-container/04"
          >
            <p className="font-body-md text-sm font-semibold text-on-surface/80">Drop a file here</p>
            <p className="mt-1 font-label-sm text-xs text-on-surface-variant/40">or click to choose</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {/* Selected file */}
        {file && (
          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-body-md text-sm font-medium text-on-surface">{file.name}</p>
                <p className="font-label-sm text-xs text-on-surface-variant/45">
                  {fmtSize(file.size)} · {file.type || "unknown"}
                </p>
              </div>
              {phase === "idle" && (
                <button
                  onClick={() => handleFile(null)}
                  className="font-label-sm text-xs text-on-surface-variant/45 transition hover:text-on-surface-variant/80"
                >
                  Change
                </button>
              )}
            </div>

            {/* Progress */}
            {(phase === "uploading" || phase === "saving") && (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full bg-primary transition-all duration-150"
                    style={{ width: `${phase === "saving" ? 100 : progress}%` }}
                  />
                </div>
                <p className="mt-2 font-label-sm text-xs text-on-surface-variant/50">
                  {phase === "uploading"
                    ? `Uploading ${progress}%${attempt > 1 ? ` · attempt ${attempt}` : ""}…`
                    : "Saving to project…"}
                </p>
              </div>
            )}

            {phase === "done" && (
              <p className="mt-3 font-body-md text-sm text-[#34d399]">Added to the project.</p>
            )}
            {phase === "error" && errorMsg && (
              <p className="mt-3 font-body-md text-sm text-error/80">{errorMsg}</p>
            )}
          </div>
        )}

        {/* Actions */}
        {file && phase === "idle" && (
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => handleFile(null)}>Reset</Button>
            <Button onClick={handleUpload}>Upload</Button>
          </div>
        )}
        {file && phase === "error" && (
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => handleFile(null)}>Choose another</Button>
            <Button onClick={handleUpload}>Retry</Button>
          </div>
        )}
      </div>
    </div>
  );
}

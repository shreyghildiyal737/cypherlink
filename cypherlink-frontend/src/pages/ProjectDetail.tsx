import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useProject,
  useProjectClips,
  useRemoveProjectFile,
  useUpdateFilledRoles,
  useApplyForRole,
  useProjectApplications,
  useRespondToApplication,
  useProjectMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useProjectDeliverables,
  useSubmitDeliverable,
  useRequestRevision,
  useResolveRevision,
  useProjectMessages,
  usePostProjectMessage,
  useTransitionProjectType,
  useLeaveProject,
  useRemoveMember,
} from "../hooks";
import { useAuthStore } from "../store/authStore";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ProjectFileUploadModal } from "../components/projects/ProjectFileUploadModal";
import type { MilestoneStatus, RightsTag } from "../types";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(mime: string): string {
  if (mime.startsWith("audio/")) return "Audio";
  if (mime.startsWith("video/")) return "Video";
  if (mime.startsWith("image/")) return "Artwork";
  if (mime === "application/pdf" || mime.startsWith("text/")) return "Doc";
  return "File";
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  TODO: "bg-on-surface-variant/20",
  IN_PROGRESS: "bg-blue-400",
  SUBMITTED: "bg-yellow-400",
  REVISION_REQUESTED: "bg-orange-400",
  APPROVED: "bg-green-400",
  COMPLETED: "bg-green-500",
};

const RIGHTS_TAG_LABELS: Record<RightsTag, string> = {
  DRAFT_ONLY: "Draft Only",
  PROJECT_USE_ALLOWED: "Project Use",
  COMMERCIAL_USE_ALLOWED: "Commercial Use",
  OWNERSHIP_TRANSFERRED: "Ownership Transferred",
  ROYALTY_SPLIT_INTENDED: "Royalty Split",
};

const COMMITMENT_LABELS: Record<string, string> = {
  EXPERIMENTAL: "Experimental",
  CASUAL: "Casual",
  QUICK_JAM: "Quick Jam",
  ONE_NIGHT_SESSION: "One-Night",
  LONG_TERM_PROJECT: "Long-Term",
  RELEASE_FOCUSED: "Release-Focused",
  PRACTICE_SESSION: "Practice",
  LEARNING_PROJECT: "Learning",
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id ?? "");
  const { data: projectClips } = useProjectClips(id ?? "");
  const removeFile = useRemoveProjectFile();
  const user = useAuthStore((s) => s.user);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Apply form state
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyRole, setApplyRole] = useState("");
  const [applyMessage, setApplyMessage] = useState("");
  const applyForRole = useApplyForRole(id ?? "");

  // Applications panel
  const isOwner = !!user && project?.ownerId === user.id;
  const { data: applications } = useProjectApplications(id ?? "");
  const respondToApplication = useRespondToApplication(id ?? "");

  // Milestones
  const { data: milestones } = useProjectMilestones(id ?? "");
  const createMilestone = useCreateMilestone(id ?? "");
  const updateMilestone = useUpdateMilestone(id ?? "");
  const deleteMilestone = useDeleteMilestone(id ?? "");
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDesc, setMilestoneDesc] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");
  const [milestoneRole, setMilestoneRole] = useState("");
  const [milestoneExpectation, setMilestoneExpectation] = useState("");
  const [confirmDeleteMilestoneId, setConfirmDeleteMilestoneId] = useState<string | null>(null);

  // Deliverables
  const isMemberCheck = !!user && (project?.members ?? []).some((m) => m.userId === user.id);
  const { data: deliverables } = useProjectDeliverables(id ?? "");
  const submitDeliverable = useSubmitDeliverable(id ?? "");
  const [showDeliverableForm, setShowDeliverableForm] = useState(false);
  const [deliverableNote, setDeliverableNote] = useState("");
  const [deliverableRightsTag, setDeliverableRightsTag] = useState<RightsTag>("PROJECT_USE_ALLOWED");
  const [deliverableMilestoneId, setDeliverableMilestoneId] = useState("");
  const [deliverablePublicUrl, setDeliverablePublicUrl] = useState("");

  // Revisions
  const requestRevision = useRequestRevision(id ?? "");
  const resolveRevision = useResolveRevision(id ?? "");
  const [revisionDeliverableId, setRevisionDeliverableId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");

  // Messages
  const { data: messages } = useProjectMessages(id ?? "");
  const postMessage = usePostProjectMessage(id ?? "");
  const [messageBody, setMessageBody] = useState("");

  // Type transition
  const transitionType = useTransitionProjectType(id ?? "");
  const [showTransitionForm, setShowTransitionForm] = useState(false);
  const [transitionNote, setTransitionNote] = useState("");

  // Member management
  const leaveProject = useLeaveProject(id ?? "");
  const removeMember = useRemoveMember(id ?? "");
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removeNote, setRemoveNote] = useState("");

  const updateFilledRoles = useUpdateFilledRoles(id ?? "");

  if (isLoading)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center font-body-md text-on-surface-variant/40">
        Loading project...
      </div>
    );
  if (!project)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center font-body-md text-on-surface-variant/40">
        Project not found
      </div>
    );

  const files = project.files ?? [];
  const isMember = isMemberCheck;
  const filledRoles = project.filledRoles ?? [];
  const unfilledRoles = (project.openRoles ?? []).filter((r) => !filledRoles.includes(r));

  function toggleFilledRole(role: string) {
    const next = filledRoles.includes(role)
      ? filledRoles.filter((r) => r !== role)
      : [...filledRoles, role];
    updateFilledRoles.mutate(next);
  }

  function handleSubmitApply(e: React.FormEvent) {
    e.preventDefault();
    if (!applyRole) return;
    applyForRole.mutate(
      { role: applyRole, message: applyMessage || undefined },
      {
        onSuccess: () => {
          setShowApplyForm(false);
          setApplyRole("");
          setApplyMessage("");
        },
      },
    );
  }

  function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!milestoneTitle) return;
    createMilestone.mutate(
      {
        title: milestoneTitle,
        description: milestoneDesc || undefined,
        dueDate: milestoneDue || undefined,
        assignedRole: milestoneRole || undefined,
        deliverableExpectation: milestoneExpectation || undefined,
      },
      {
        onSuccess: () => {
          setShowMilestoneForm(false);
          setMilestoneTitle("");
          setMilestoneDesc("");
          setMilestoneDue("");
          setMilestoneRole("");
          setMilestoneExpectation("");
        },
      },
    );
  }

  function handleSubmitDeliverable(e: React.FormEvent) {
    e.preventDefault();
    submitDeliverable.mutate(
      {
        note: deliverableNote || undefined,
        rightsTag: deliverableRightsTag,
        milestoneId: deliverableMilestoneId || undefined,
        publicUrl: deliverablePublicUrl || undefined,
      },
      {
        onSuccess: () => {
          setShowDeliverableForm(false);
          setDeliverableNote("");
          setDeliverablePublicUrl("");
          setDeliverableMilestoneId("");
        },
      },
    );
  }

  function handleRequestRevision(deliverableId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!revisionNote) return;
    requestRevision.mutate(
      { note: revisionNote, deliverableId },
      {
        onSuccess: () => {
          setRevisionDeliverableId(null);
          setRevisionNote("");
        },
      },
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-margin-mobile md:px-margin-desktop py-8 md:py-12 lg:grid-cols-[1fr_360px]">
      {uploadOpen && id && (
        <ProjectFileUploadModal
          projectId={id}
          onClose={() => setUploadOpen(false)}
        />
      )}

      {/* ── LEFT COLUMN ── */}
      <div className="space-y-5">

        {/* Header */}
        <section className="glass-panel rounded-2xl border border-white/[0.07] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">{project.status}</Badge>
            {project.lifecycleState && project.lifecycleState !== "ACTIVE" && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-label-sm text-[10px] uppercase tracking-wider ${
                project.lifecycleState === "SLOWING_DOWN"
                  ? "border-yellow-500/30 bg-yellow-500/06 text-yellow-400/70"
                  : project.lifecycleState === "INACTIVE"
                  ? "border-white/[0.06] bg-white/[0.02] text-on-surface-variant/35"
                  : project.lifecycleState === "COMPLETED"
                  ? "border-green-500/30 bg-green-500/06 text-green-400/60"
                  : "border-white/[0.06] bg-white/[0.02] text-on-surface-variant/30"
              }`}>
                {project.lifecycleState === "SLOWING_DOWN" ? "Slowing down" : project.lifecycleState === "INACTIVE" ? "Inactive" : project.lifecycleState === "COMPLETED" ? "Completed" : project.lifecycleState.toLowerCase().replace("_", " ")}
              </span>
            )}
            {project.projectType && (
              <Badge tone="muted">{project.projectType === "OPEN_COLLAB" ? "Open Collab" : project.projectType === "STRUCTURED" ? "Structured" : project.projectType}</Badge>
            )}
            {project.commitmentStyle && (
              <span className="font-label-sm text-[10px] text-on-surface-variant/40 border border-white/[0.08] rounded-full px-2.5 py-1">
                {COMMITMENT_LABELS[project.commitmentStyle] ?? project.commitmentStyle}
              </span>
            )}
          </div>
          <h1 className="mt-4 font-headline-xl text-headline-xl tracking-tight text-on-surface">
            {project.title}
          </h1>
          <p className="mt-2 font-body-md text-on-surface-variant/60">
            {project.city}{project.tags.length > 0 ? " • " + project.tags.join(" • ") : ""}
          </p>
          {project.description && (
            <p className="mt-3 font-body-md text-sm text-on-surface-variant/55">{project.description}</p>
          )}

          {/* Type transition history */}
          {project.typeTransitionLog && project.typeTransitionLog.length > 0 && (
            <p className="mt-2 font-label-sm text-xs text-on-surface-variant/35">
              {project.typeTransitionLog.map((t, i) => (
                <span key={i}>
                  {i === 0 ? `Started as ${t.from === "OPEN_COLLAB" ? "Open Collab" : t.from}` : ""}{" "}
                  · Converted to {t.to === "STRUCTURED" ? "Structured Project" : t.to} on {fmtDate(t.at)}
                </span>
              ))}
            </p>
          )}

          {/* Memory trail */}
          {project.memoryTrail?.bornFromCypher && (
            <Link
              to={`/cyphers/${project.memoryTrail.bornFromCypher.id}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary-container/25 bg-primary-container/10 px-3 py-1.5 font-label-sm text-xs font-semibold text-primary-fixed-dim transition hover:bg-primary-container/18"
            >
              <span className="text-primary-container/70">↺</span>
              Born from {project.memoryTrail.bornFromCypher.title}
              <span className="text-on-surface-variant/40">→</span>
            </Link>
          )}

          {/* Completed note */}
          {project.completedAt && (
            <p className="mt-3 font-label-sm text-xs text-green-400/70">
              Completed {fmtDate(project.completedAt)}
            </p>
          )}
        </section>

        {/* Collaborators section */}
        <section className="glass-panel rounded-2xl border border-white/[0.07] p-5">
          <h2 className="font-headline-lg-mobile font-semibold text-on-surface">Collaborators</h2>
          <div className="mt-4 space-y-3">
            {project.members.map((m) => {
              const isMe = user?.id === m.userId;
              const isThisOwner = m.userId === project.ownerId;
              const isLeft = m.status === "LEFT_VOLUNTARILY";
              const isRemoved = m.status === "REMOVED_BY_LEAD";
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-white/[0.08] font-body-md text-sm text-on-surface">
                    {(m.displayName ?? "?")[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-body-md text-sm text-on-surface/80 ${isRemoved ? "line-through opacity-40" : ""}`}>
                      {m.displayName}
                      {m.creativeRole ? <span className="ml-1.5 text-xs text-on-surface-variant/45">{m.creativeRole}</span> : null}
                      {isThisOwner && <span className="ml-1.5 text-[10px] text-on-surface-variant/30">owner</span>}
                    </p>
                    {isLeft && <p className="font-label-sm text-[10px] text-on-surface-variant/30">left</p>}
                    {isRemoved && <p className="font-label-sm text-[10px] text-on-surface-variant/30">removed</p>}
                  </div>
                  {/* Owner: show Remove for active non-owner members */}
                  {isOwner && !isThisOwner && m.status === "ACTIVE" && (
                    <>
                      {removeConfirmId === m.userId ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="rounded-lg bg-white/[0.06] px-2 py-1 font-label-sm text-xs text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] w-32"
                            placeholder="Note (optional)"
                            value={removeNote}
                            onChange={(e) => setRemoveNote(e.target.value)}
                          />
                          <button
                            onClick={() => {
                              removeMember.mutate(
                                { targetUserId: m.userId, note: removeNote || undefined },
                                { onSettled: () => { setRemoveConfirmId(null); setRemoveNote(""); } },
                              );
                            }}
                            disabled={removeMember.isPending}
                            className="font-label-sm text-xs text-red-400/70 hover:text-red-400 disabled:opacity-40"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setRemoveConfirmId(null)}
                            className="font-label-sm text-xs text-on-surface-variant/35 hover:text-on-surface-variant/60"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRemoveConfirmId(m.userId)}
                          className="font-label-sm text-[10px] text-on-surface-variant/30 hover:text-on-surface-variant/60 transition"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
                  {/* Non-owner member: leave button in their own row */}
                  {!isOwner && isMe && !isThisOwner && m.status === "ACTIVE" && (
                    <button
                      onClick={() => leaveProject.mutate()}
                      disabled={leaveProject.isPending}
                      className="font-label-sm text-[10px] text-on-surface-variant/30 hover:text-on-surface-variant/60 transition disabled:opacity-40"
                    >
                      Leave
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Apply for role button (non-member, project is open) */}
          {!isMember && user && (project.visibility === "open" || project.visibility === "OPEN") && (
            <button
              onClick={() => setShowApplyForm((v) => !v)}
              className="mt-4 font-label-sm text-xs text-primary-fixed-dim hover:underline"
            >
              Apply for a role
            </button>
          )}
        </section>

        {/* Milestones (STRUCTURED projects only) */}
        {project.projectType === "STRUCTURED" && (
          <section className="glass-panel rounded-2xl border border-white/[0.07] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg-mobile font-semibold text-on-surface">Milestones</h2>
              {isOwner && (
                <button
                  onClick={() => setShowMilestoneForm((v) => !v)}
                  className="font-label-sm text-xs text-on-surface-variant/50 hover:text-on-surface-variant/80 transition"
                >
                  {showMilestoneForm ? "Cancel" : "+ Add milestone"}
                </button>
              )}
            </div>

            {showMilestoneForm && (
              <form onSubmit={handleCreateMilestone} className="mt-4 space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <input
                  required
                  className="w-full rounded-lg bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] focus:border-white/20"
                  placeholder="Milestone title *"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                />
                <input
                  className="w-full rounded-lg bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] focus:border-white/20"
                  placeholder="Description (optional)"
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    className="w-full rounded-lg bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] focus:border-white/20"
                    value={milestoneDue}
                    onChange={(e) => setMilestoneDue(e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] focus:border-white/20"
                    placeholder="Assigned role"
                    value={milestoneRole}
                    onChange={(e) => setMilestoneRole(e.target.value)}
                  />
                </div>
                <input
                  className="w-full rounded-lg bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] focus:border-white/20"
                  placeholder="Deliverable expectation (optional)"
                  value={milestoneExpectation}
                  onChange={(e) => setMilestoneExpectation(e.target.value)}
                />
                <Button type="submit" disabled={createMilestone.isPending} className="w-full">
                  {createMilestone.isPending ? "Creating…" : "Create milestone"}
                </Button>
              </form>
            )}

            {(!milestones || milestones.length === 0) && !showMilestoneForm && (
              <p className="mt-4 font-label-sm text-xs text-on-surface-variant/35">
                No milestones yet. {isOwner ? "Add one to track your progress." : ""}
              </p>
            )}

            <div className="mt-4 space-y-3">
              {(milestones ?? []).map((m) => (
                <div key={m.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${MILESTONE_STATUS_COLORS[m.status]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-body-md text-sm font-medium text-on-surface">{m.title}</p>
                      {m.description && <p className="mt-0.5 font-body-md text-xs text-on-surface-variant/50">{m.description}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {m.assignedRole && (
                          <span className="font-label-sm text-[10px] text-on-surface-variant/40">{m.assignedRole}</span>
                        )}
                        {m.assignedContributorName && (
                          <span className="font-label-sm text-[10px] text-on-surface-variant/40">→ {m.assignedContributorName}</span>
                        )}
                        {m.dueDate && (
                          <span className="font-label-sm text-[10px] text-on-surface-variant/30">Due {fmtDate(m.dueDate)}</span>
                        )}
                        <span className="font-label-sm text-[10px] text-on-surface-variant/40 uppercase tracking-wide">{m.status.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status update */}
                      {isMember && (
                        <select
                          value={m.status}
                          onChange={(e) => updateMilestone.mutate({ milestoneId: m.id, status: e.target.value as any })}
                          className="rounded-lg bg-white/[0.06] px-2 py-1 font-label-sm text-xs text-on-surface-variant/60 border border-white/[0.08] outline-none"
                        >
                          {isOwner ? (
                            ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "APPROVED", "COMPLETED"].map((s) => (
                              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                            ))
                          ) : (
                            ["IN_PROGRESS", "SUBMITTED"].map((s) => (
                              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                            ))
                          )}
                        </select>
                      )}
                      {/* Delete milestone */}
                      {isOwner && (
                        <>
                          {confirmDeleteMilestoneId === m.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => deleteMilestone.mutate(m.id, { onSettled: () => setConfirmDeleteMilestoneId(null) })}
                                className="font-label-sm text-xs text-red-400/70 hover:text-red-400"
                              >Del</button>
                              <button onClick={() => setConfirmDeleteMilestoneId(null)} className="font-label-sm text-xs text-on-surface-variant/30">×</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteMilestoneId(m.id)}
                              className="font-label-sm text-xs text-on-surface-variant/25 hover:text-on-surface-variant/50"
                            >×</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Deliverables (members only) */}
        {isMember && (
          <section className="glass-panel rounded-2xl border border-white/[0.07] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg-mobile font-semibold text-on-surface">Deliverables</h2>
              <button
                onClick={() => setShowDeliverableForm((v) => !v)}
                className="font-label-sm text-xs text-on-surface-variant/50 hover:text-on-surface-variant/80 transition"
              >
                {showDeliverableForm ? "Cancel" : "+ Submit"}
              </button>
            </div>

            {showDeliverableForm && (
              <form onSubmit={handleSubmitDeliverable} className="mt-4 space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="font-label-sm text-[10px] text-on-surface-variant/40">
                  Link a file from project files above or paste a public URL.
                </p>
                <input
                  className="w-full rounded-lg bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] focus:border-white/20"
                  placeholder="Public URL (optional)"
                  value={deliverablePublicUrl}
                  onChange={(e) => setDeliverablePublicUrl(e.target.value)}
                />
                <textarea
                  className="w-full resize-none rounded-lg bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] focus:border-white/20"
                  placeholder="Note (optional)"
                  rows={2}
                  value={deliverableNote}
                  onChange={(e) => setDeliverableNote(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={deliverableRightsTag}
                    onChange={(e) => setDeliverableRightsTag(e.target.value as RightsTag)}
                    className="w-full rounded-lg bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface border border-white/[0.08] outline-none"
                  >
                    {(Object.keys(RIGHTS_TAG_LABELS) as RightsTag[]).map((k) => (
                      <option key={k} value={k}>{RIGHTS_TAG_LABELS[k]}</option>
                    ))}
                  </select>
                  {milestones && milestones.length > 0 && (
                    <select
                      value={deliverableMilestoneId}
                      onChange={(e) => setDeliverableMilestoneId(e.target.value)}
                      className="w-full rounded-lg bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface border border-white/[0.08] outline-none"
                    >
                      <option value="">No milestone</option>
                      {milestones.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                <Button type="submit" disabled={submitDeliverable.isPending} className="w-full">
                  {submitDeliverable.isPending ? "Submitting…" : "Submit deliverable"}
                </Button>
              </form>
            )}

            {(!deliverables || deliverables.length === 0) && (
              <p className="mt-4 font-label-sm text-xs text-on-surface-variant/35">Nothing submitted yet.</p>
            )}

            <div className="mt-4 space-y-3">
              {(deliverables ?? []).map((d) => (
                <div key={d.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-body-md text-sm font-medium text-on-surface">{d.submitterName ?? "Someone"}</p>
                      {d.role && <p className="font-label-sm text-xs text-on-surface-variant/40">{d.role}</p>}
                      {d.note && <p className="mt-1 font-body-md text-xs text-on-surface-variant/55">{d.note}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="inline-block rounded-full border border-white/[0.07] px-2 py-0.5 font-label-sm text-[10px] text-on-surface-variant/40">
                          {RIGHTS_TAG_LABELS[d.rightsTag]}
                        </span>
                        {d.publicUrl && (
                          <a href={d.publicUrl} target="_blank" rel="noopener noreferrer" className="font-label-sm text-xs text-on-surface-variant/50 hover:underline">
                            Open
                          </a>
                        )}
                        <span className="font-label-sm text-[10px] text-on-surface-variant/30">{fmtDate(d.createdAt)}</span>
                      </div>
                    </div>
                    {isOwner && (
                      <div>
                        {revisionDeliverableId === d.id ? (
                          <form onSubmit={(e) => handleRequestRevision(d.id, e)} className="space-y-2">
                            <textarea
                              required
                              className="w-48 resize-none rounded-lg bg-white/[0.06] px-2 py-1.5 font-body-md text-xs text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08]"
                              placeholder="Revision note..."
                              rows={2}
                              value={revisionNote}
                              onChange={(e) => setRevisionNote(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button type="submit" disabled={requestRevision.isPending} className="font-label-sm text-xs text-orange-400/70 hover:text-orange-400 disabled:opacity-40">
                                Send
                              </button>
                              <button type="button" onClick={() => setRevisionDeliverableId(null)} className="font-label-sm text-xs text-on-surface-variant/30">
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setRevisionDeliverableId(d.id)}
                            className="font-label-sm text-[10px] text-on-surface-variant/30 hover:text-on-surface-variant/60 transition"
                          >
                            Request revision
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Project Discussion */}
        <section className="glass-panel rounded-2xl border border-white/[0.07] p-5">
          <h2 className="font-headline-lg-mobile font-semibold text-on-surface">Discussion</h2>
          {!isMember ? (
            <p className="mt-3 font-body-md text-sm text-on-surface-variant/40">
              Join the project to participate in discussion.
            </p>
          ) : (
            <>
              <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                {(!messages || messages.length === 0) && (
                  <p className="font-label-sm text-xs text-on-surface-variant/35">No messages yet. Start the conversation.</p>
                )}
                {(messages ?? []).map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-white/[0.08] font-label-sm text-xs text-on-surface">
                      {(msg.senderName ?? "?")[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-body-md text-xs font-semibold text-on-surface/80">{msg.senderName}</span>
                        <span className="font-label-sm text-[10px] text-on-surface-variant/30">{fmtDate(msg.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 font-body-md text-sm text-on-surface/70">{msg.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!messageBody.trim()) return;
                  postMessage.mutate({ body: messageBody }, { onSuccess: () => setMessageBody("") });
                }}
                className="mt-4 flex gap-2"
              >
                <textarea
                  className="flex-1 resize-none rounded-xl bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] focus:border-white/20"
                  placeholder="Say something..."
                  rows={2}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={postMessage.isPending || !messageBody.trim()}
                  className="self-end rounded-xl bg-white/[0.10] px-4 py-2 font-label-sm text-sm font-semibold text-on-surface transition hover:bg-white/[0.16] disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </section>

        {/* Project moments — linked clips */}
        {projectClips && projectClips.length > 0 && (
          <section className="glass-card rounded-2xl border border-white/[0.07] p-5">
            <h2 className="font-headline-lg-mobile text-xl font-semibold text-on-surface">
              Project moments
            </h2>
            <p className="mt-1 font-body-md text-sm text-on-surface-variant/50">
              Clips dropped from this project.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {projectClips.slice(0, 6).map((c: any) => (
                <Link
                  key={c.id}
                  to={`/clips/${c.id}`}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:border-primary-container/20"
                >
                  <p className="font-label-sm text-xs text-on-surface-variant/40">{c.creator.name}</p>
                  <p className="mt-1 font-body-md line-clamp-2 text-sm font-medium text-on-surface/85">
                    {c.caption || c.reason || "Moment"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── SIDEBAR ── */}
      <aside className="space-y-5">

        {/* Roles + Apply */}
        <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline-lg-mobile font-semibold text-on-surface">Roles</h2>
            {isOwner && project.openRoles.length > 0 && (
              <span className="font-label-sm text-[10px] text-on-surface-variant/35 uppercase tracking-widest">
                Tap to toggle
              </span>
            )}
          </div>

          {project.openRoles.length === 0 ? (
            <p className="font-body-md text-sm text-on-surface-variant/50">No roles listed.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {project.openRoles.map((role) => {
                const filled = filledRoles.includes(role);
                return isOwner ? (
                  <button
                    key={role}
                    onClick={() => toggleFilledRole(role)}
                    disabled={updateFilledRoles.isPending}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-label-sm text-sm transition ${
                      filled
                        ? "border-green-500/30 bg-green-500/06 text-green-400/80 line-through"
                        : "border-primary-container/30 bg-primary-container/06 text-on-surface/80 hover:border-primary-container/50"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${filled ? "bg-green-400/60" : "bg-primary-container"}`} />
                    {role}
                    {filled ? " ✓" : ""}
                  </button>
                ) : (
                  <span
                    key={role}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-label-sm text-sm ${
                      filled
                        ? "border-green-500/30 bg-green-500/06 text-green-400/70 line-through"
                        : "border-primary-container/30 bg-primary-container/06 text-on-surface/80"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${filled ? "bg-green-400/60" : "bg-primary-container"}`} />
                    {role}
                    {filled ? " ✓" : ""}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-4">
            {user ? (
              isMember ? (
                <p className="font-label-sm text-xs text-on-surface-variant/40">You're on this project.</p>
              ) : (project.visibility === "open" || project.visibility === "OPEN") && unfilledRoles.length > 0 ? (
                <>
                  {!showApplyForm ? (
                    <Button className="w-full" onClick={() => setShowApplyForm(true)}>
                      Apply
                    </Button>
                  ) : (
                    <form onSubmit={handleSubmitApply} className="space-y-3">
                      <select
                        required
                        value={applyRole}
                        onChange={(e) => setApplyRole(e.target.value)}
                        className="w-full rounded-xl bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface border border-white/[0.08] outline-none"
                      >
                        <option value="">Select role...</option>
                        {unfilledRoles.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <textarea
                        className="w-full resize-none rounded-xl bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] focus:border-white/20"
                        placeholder="Why you? (optional, max 300 chars)"
                        rows={3}
                        maxLength={300}
                        value={applyMessage}
                        onChange={(e) => setApplyMessage(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={applyForRole.isPending || !applyRole} className="flex-1">
                          {applyForRole.isPending ? "Sending…" : "Submit"}
                        </Button>
                        <button type="button" onClick={() => setShowApplyForm(false)} className="font-label-sm text-xs text-on-surface-variant/40">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <Link to="/messages">
                  <Button className="w-full">Message to collaborate</Button>
                </Link>
              )
            ) : (
              <Link to="/login">
                <Button variant="secondary" className="w-full">Log in to reach out</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Pending Applications (owner only) */}
        {isOwner && (project.pendingApplications ?? 0) > 0 && (
          <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
            <h2 className="font-headline-lg-mobile font-semibold text-on-surface">
              Applications ({project.pendingApplications})
            </h2>
            <div className="mt-4 space-y-4">
              {(applications ?? [])
                .filter((a) => a.status === "PENDING")
                .map((a) => (
                  <div key={a.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-white/[0.08] font-label-sm text-xs text-on-surface">
                        {(a.applicantName ?? "?")[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-body-md text-sm font-medium text-on-surface">{a.applicantName}</p>
                        <p className="font-label-sm text-xs text-on-surface-variant/50">for {a.role}</p>
                        {a.message && <p className="mt-1 font-body-md text-xs text-on-surface-variant/55 line-clamp-2">{a.message}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToApplication.mutate({ appId: a.id, status: "ACCEPTED" })}
                        disabled={respondToApplication.isPending}
                        className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 font-label-sm text-xs text-green-400/80 hover:bg-green-500/20 transition disabled:opacity-40"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToApplication.mutate({ appId: a.id, status: "REJECTED" })}
                        disabled={respondToApplication.isPending}
                        className="rounded-full bg-white/[0.05] border border-white/[0.08] px-3 py-1 font-label-sm text-xs text-on-surface-variant/50 hover:bg-white/[0.10] transition disabled:opacity-40"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Files */}
        <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-lg-mobile font-semibold text-on-surface">Files</h2>
            <span className="font-label-sm text-xs text-on-surface-variant/40">{files.length}</span>
          </div>
          <p className="mt-2 font-body-md text-sm text-on-surface-variant/60">
            Stems, lyrics, references, artwork — kept together as the project comes alive.
          </p>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f) => {
                const canRemove = isMember;
                return (
                  <li
                    key={f.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">
                        {fileKind(f.mimeType)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body-md text-sm font-medium text-on-surface">{f.fileName}</p>
                        <p className="font-label-sm text-xs text-on-surface-variant/40">{fmtSize(f.fileSize)}</p>
                      </div>
                      {f.publicUrl && (
                        <a
                          href={f.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-label-sm text-xs text-on-surface-variant/60 transition hover:text-on-surface hover:underline"
                        >
                          Open
                        </a>
                      )}
                      {canRemove && confirmDeleteId !== f.id && (
                        <button
                          onClick={() => setConfirmDeleteId(f.id)}
                          className="font-label-sm text-xs text-on-surface-variant/35 transition hover:text-on-surface-variant/70"
                          aria-label="Remove file"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {confirmDeleteId === f.id && (
                      <div className="mt-3 rounded-lg bg-white/[0.04] p-3">
                        <p className="font-body-md text-xs text-on-surface-variant/70">
                          Remove this file from the shared project space?
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => {
                              removeFile.mutate(
                                { projectId: project.id, fileId: f.id },
                                { onSettled: () => setConfirmDeleteId(null) },
                              );
                            }}
                            disabled={removeFile.isPending}
                            className="rounded-full bg-white/[0.12] px-3 py-1 font-label-sm text-xs font-semibold text-on-surface transition hover:bg-white/[0.20] disabled:opacity-40"
                          >
                            {removeFile.isPending ? "Removing…" : "Remove"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-full px-3 py-1 font-label-sm text-xs text-on-surface-variant/45 hover:text-on-surface-variant/80"
                          >
                            Keep
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {files.length === 0 && (
            <p className="mt-4 font-label-sm text-xs text-on-surface-variant/35">
              {isMember ? "Nothing here yet. Drop the first thing in." : "Nothing shared yet."}
            </p>
          )}

          {isMember && (
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => setUploadOpen(true)}
            >
              Upload file
            </Button>
          )}
        </div>

        {/* Completion */}
        {isOwner && project.status !== "FINISHED" && project.status !== "Finished" && (
          <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
            <h2 className="font-headline-lg-mobile font-semibold text-on-surface">Wrap up</h2>
            <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">
              Mark this project as complete when the work is done.
            </p>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => {}}>
              Mark complete
            </Button>
          </div>
        )}

        {project.completedAt && (
          <div className="glass-card rounded-2xl border border-white/[0.07] p-4">
            <p className="font-label-sm text-xs text-green-400/60">
              Project completed on {fmtDate(project.completedAt)}
            </p>
          </div>
        )}

        {/* Type transition (owner, OPEN_COLLAB only) */}
        {isOwner && project.projectType === "OPEN_COLLAB" && (
          <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
            <h2 className="font-headline-lg-mobile font-semibold text-on-surface">Structure</h2>
            <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">
              Ready to get more formal? Convert this to a structured project.
            </p>
            {!showTransitionForm ? (
              <button
                onClick={() => setShowTransitionForm(true)}
                className="mt-3 font-label-sm text-xs text-on-surface-variant/50 hover:text-on-surface-variant/80 transition"
              >
                Convert to Structured Project
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  transitionType.mutate(
                    { projectType: "STRUCTURED", note: transitionNote || undefined },
                    { onSuccess: () => { setShowTransitionForm(false); setTransitionNote(""); } },
                  );
                }}
                className="mt-3 space-y-3"
              >
                <input
                  className="w-full rounded-xl bg-white/[0.06] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none border border-white/[0.08] focus:border-white/20"
                  placeholder="Note about this change (optional)"
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={transitionType.isPending} className="flex-1">
                    {transitionType.isPending ? "Converting…" : "Confirm"}
                  </Button>
                  <button type="button" onClick={() => setShowTransitionForm(false)} className="font-label-sm text-xs text-on-surface-variant/40">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  useConversations,
  useConversation,
  useSendToConversation,
  useMessageRequests,
  useAcceptMessageRequest,
  useDeclineMessageRequest,
} from "../hooks";
import { useAuthStore } from "../store/authStore";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { SafetyMenu } from "../components/ui/SafetyMenu";
import { FadeUp } from "../components/ui/motion";
import { motion } from "framer-motion";

const NEAR_BOTTOM_PX = 120;

const intentExamples = [
  "Collaborate",
  "Appreciation",
  "Idea sharing",
  "Cypher follow-up",
  "Community move",
  "Just tapping in",
];

export default function Messages() {
  const { data: conversations, isLoading } = useConversations();
  const user = useAuthStore((s) => s.user);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);
  const lastConversationIdRef = useRef<string | null>(null);
  const lastMessageCountRef = useRef(0);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const { data: thread, isLoading: threadLoading } = useConversation(
    selectedId ?? ""
  );
  const sendMessage = useSendToConversation();
  const { data: requests } = useMessageRequests();
  const acceptRequest = useAcceptMessageRequest();
  const declineRequest = useDeclineMessageRequest();
  const pendingRequests = (requests ?? []) as any[];
  const [activeTab, setActiveTab] = useState<"inbox" | "requests">("inbox");

  const messageCount = thread?.items.length ?? 0;

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distance <= NEAR_BOTTOM_PX;
    wasNearBottomRef.current = near;
    setShowJumpToLatest(!near && messageCount > 0);
  };

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    wasNearBottomRef.current = distance <= NEAR_BOTTOM_PX;
  }, [messageCount]);

  useEffect(() => {
    const switchedConversation = selectedId !== lastConversationIdRef.current;
    const newMessages = messageCount > lastMessageCountRef.current;

    if (switchedConversation && messageCount > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      setShowJumpToLatest(false);
    } else if (newMessages && wasNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowJumpToLatest(false);
    } else if (newMessages && !wasNearBottomRef.current) {
      setShowJumpToLatest(true);
    }

    lastConversationIdRef.current = selectedId;
    lastMessageCountRef.current = messageCount;
  }, [selectedId, messageCount]);

  const jumpToLatest = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowJumpToLatest(false);
  };

  const [sendError, setSendError] = useState<string | null>(null);
  const [lastDraft, setLastDraft] = useState("");

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || !selectedId) return;
    setSendError(null);
    setLastDraft(trimmed);
    sendMessage.mutate(
      { conversationId: selectedId, body: trimmed },
      {
        onError: () => {
          setSendError(
            "Message didn't go through. Check your connection — your draft is still here.",
          );
          setDraft(trimmed);
        },
      },
    );
    setDraft("");
    wasNearBottomRef.current = true;
  };

  const handleRetry = () => {
    if (!lastDraft || !selectedId) return;
    setSendError(null);
    sendMessage.mutate(
      { conversationId: selectedId, body: lastDraft },
      {
        onError: () =>
          setSendError("Still couldn't send. Try again in a moment."),
      },
    );
  };

  const selectedConv = conversations?.find((c: any) => c.id === selectedId);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-margin-mobile md:px-margin-desktop py-8 md:py-12 lg:grid-cols-[360px_1fr]">
      {/* ─── Conversation list ──────────────────────────────────────────── */}
      <FadeUp>
        <section className="rounded-2xl border border-white/[0.06] glass-panel p-5">
          <Badge tone="muted">Intent-first messaging</Badge>
          <h1 className="mt-4 font-headline-xl text-[2rem] text-on-surface tracking-tight">
            Messages
          </h1>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            {(["inbox", "requests"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 rounded-lg px-4 py-1.5 font-label-sm text-sm font-semibold transition-colors"
              >
                {activeTab === tab && (
                  <motion.span
                    layoutId="msg-tab-pill"
                    className="absolute inset-0 rounded-lg bg-primary-container/15 border border-primary-container/20"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                <span className={`relative z-10 flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab ? "text-on-surface" : "text-on-surface-variant/50 hover:text-on-surface-variant/80"}`}>
                  {tab === "inbox" ? "Inbox" : "Requests"}
                  {tab === "requests" && pendingRequests.length > 0 && (
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-on-primary-container">
                      {pendingRequests.length > 9 ? "9+" : pendingRequests.length}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {activeTab === "inbox" ? (
              isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.03]" />
                  ))}
                </div>
              ) : conversations?.length === 0 ? (
                <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5 text-center">
                  <p className="font-body-md text-sm text-on-surface-variant/40">No conversations yet.</p>
                  <p className="mt-1 font-label-sm text-xs text-on-surface-variant/28">
                    Find someone to message from their profile.
                  </p>
                </div>
              ) : (
                conversations?.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded-xl p-4 text-left transition-all duration-200 ${
                      selectedId === c.id
                        ? "border border-primary-container/30 bg-primary-container/08"
                        : "border border-white/[0.05] bg-white/[0.02] hover:border-white/[0.10] hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/[0.05] font-semibold text-on-surface text-sm">
                        {c.participant.avatar}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-on-surface">{c.participant.name}</p>
                        <p className="truncate font-label-sm text-xs text-on-surface-variant/50">
                          {c.intent || "Message"}
                          {c.unread > 0 && (
                            <span className="ml-2 font-semibold text-primary">({c.unread} new)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {c.lastMessage && (
                      <p className="mt-2 truncate font-label-sm text-xs text-on-surface-variant/35">{c.lastMessage}</p>
                    )}
                  </button>
                ))
              )
            ) : pendingRequests.length === 0 ? (
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5 text-center">
                <p className="font-body-md text-sm text-on-surface-variant/40">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map((req: any) => (
                <div key={req.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-on-surface">{req.senderName}</p>
                      <p className="font-label-sm text-xs text-on-surface-variant/50">
                        {req.senderHandle} · {req.intent}
                      </p>
                    </div>
                    <SafetyMenu
                      targetId={req.senderId}
                      targetType="user"
                      targetName={req.senderName}
                    />
                  </div>
                  {req.message && (
                    <p className="mt-2 font-body-md text-sm italic text-on-surface-variant/65">"{req.message}"</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => acceptRequest.mutate(req.id)}
                      disabled={acceptRequest.isPending}
                      className="flex-1 rounded-xl border border-primary-container/20 bg-primary-container/08 py-1.5 font-label-sm text-sm font-semibold text-on-surface transition hover:bg-primary-container/15 disabled:opacity-40"
                    >
                      {acceptRequest.isPending ? "..." : "Accept"}
                    </button>
                    <button
                      onClick={() => declineRequest.mutate(req.id)}
                      disabled={declineRequest.isPending}
                      className="flex-1 rounded-xl py-1.5 font-label-sm text-sm text-on-surface-variant/50 transition hover:bg-white/[0.03] disabled:opacity-40"
                    >
                      Not now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </FadeUp>

      {/* ─── Thread or intent explainer ─────────────────────────────────── */}
      {selectedId && selectedConv ? (
        <section className="flex min-h-[480px] flex-col rounded-2xl border border-white/[0.06] glass-panel">
          {/* Thread header */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-container/15 font-semibold text-on-surface">
              {selectedConv.participant.avatar}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-on-surface">{selectedConv.participant.name}</p>
              {selectedConv.participant.handle && (
                <p className="font-label-sm text-xs text-on-surface-variant/50">
                  {selectedConv.participant.handle}
                </p>
              )}
            </div>
            {selectedConv.participant.id && (
              <SafetyMenu
                targetId={selectedConv.participant.id}
                targetType="user"
                targetName={selectedConv.participant.name}
              />
            )}
          </div>

          {/* Messages */}
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions"
            className="relative flex-1 space-y-3 overflow-y-auto p-5"
          >
            {threadLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-white/[0.03]" />
                ))}
              </div>
            ) : (thread?.items.length ?? 0) === 0 ? (
              <p className="font-body-md text-sm text-on-surface-variant/40">
                No messages yet. Start the conversation.
              </p>
            ) : (
              thread?.items.map((msg: any) => {
                const isMe = msg.senderId === user?.id;
                const isOptimistic = !!msg.optimistic;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 font-body-md text-sm transition-opacity ${
                        isMe
                          ? "bg-primary-container/20 text-on-surface border border-primary-container/20"
                          : "bg-white/[0.04] text-on-surface/90 border border-white/[0.06]"
                      } ${isOptimistic ? "opacity-65" : "opacity-100"}`}
                    >
                      {msg.content}
                      {isMe && isOptimistic && (
                        <span
                          className="ml-2 font-label-sm text-[10px] text-on-surface-variant/40"
                          aria-label="sending"
                        >
                          sending…
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {showJumpToLatest && (
            <div className="pointer-events-none relative">
              <button
                onClick={jumpToLatest}
                className="pointer-events-auto absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full glass-panel px-4 py-1.5 font-label-sm text-xs font-semibold text-on-surface shadow-primary-glow backdrop-blur transition hover:bg-primary-container/10"
              >
                New messages ↓
              </button>
            </div>
          )}

          {sendError && (
            <div
              role="alert"
              className="mx-5 mb-2 rounded-xl border border-error/30 bg-error/08 px-3 py-2 font-body-md text-xs text-on-surface/80"
            >
              {sendError}{" "}
              <button
                onClick={handleRetry}
                className="ml-1 font-semibold underline decoration-primary/30 hover:text-primary transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Composer */}
          <div
            className="flex gap-3 border-t border-white/[0.06] px-5 py-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              placeholder="Type something..."
              aria-label="Message"
              autoComplete="off"
              autoCorrect="off"
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 font-body-md text-base text-on-surface placeholder:text-on-surface-variant/28 outline-none transition focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20 sm:text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={!draft.trim()}
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              {sendMessage.isPending ? "…" : "Send"}
            </Button>
          </div>
        </section>
      ) : (
        <FadeUp>
          <section className="rounded-2xl border border-white/[0.06] glass-panel p-5">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Before messaging someone new
            </h2>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant/50">
              Declare the vibe first so the receiver knows what the conversation is about.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {intentExamples.map((intent) => (
                <span
                  key={intent}
                  className="rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-1.5 font-label-sm text-sm text-on-surface-variant/55"
                >
                  {intent}
                </span>
              ))}
            </div>
            <p className="mt-3 font-label-sm text-xs text-on-surface-variant/28">
              Pick an intent when you find someone to message from their profile.
            </p>
            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="font-label-sm text-xs uppercase tracking-widest text-on-surface-variant/35">Preview</p>
              <p className="mt-2 font-semibold text-on-surface">
                Collaboration request • from {user?.handle ?? "@user"}
              </p>
              <p className="font-body-md text-on-surface-variant/50">Wants to discuss a creative project.</p>
            </div>
          </section>
        </FadeUp>
      )}
    </div>
  );
}

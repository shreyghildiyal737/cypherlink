import { useState } from "react";
import { useConversations } from "../hooks";
import { useAuthStore } from "../store/authStore";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
const intents = [
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
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[360px_1fr]">
      <section className="rounded-[2rem] border border-white/10 bg-panel p-5">
        <Badge tone="purple">Intent-first messaging</Badge>
        <h1 className="mt-4 text-3xl font-black">Inbox</h1>
        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="text-sm text-white/40">
              Loading conversations...
            </div>
          ) : conversations?.length === 0 ? (
            <div className="text-sm text-white/40">No conversations yet</div>
          ) : (
            conversations?.map((c: any) => (
              <div key={c.id} className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
                    {c.participant.avatar}
                  </span>
                  <div>
                    <p className="font-medium">{c.participant.name}</p>
                    <p className="text-xs text-white/50">
                      {c.intent || "Message"}
                      {c.unread > 0 && (
                        <span className="ml-2 text-orangeGlow">
                          ({c.unread} new)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      <section className="rounded-[2rem] border border-white/10 bg-panel p-5">
        <h2 className="text-2xl font-black">Before messaging someone new</h2>
        <p className="mt-2 text-white/60">
          Declare the vibe first so the receiver knows what the conversation is
          about.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {intents.map((intent) => (
            <Button key={intent} variant="secondary">
              {intent}
            </Button>
          ))}
        </div>
        <div className="mt-8 rounded-2xl bg-white/5 p-4">
          <p className="text-sm text-white/50">Preview</p>
          <p className="mt-2 font-semibold">
            Collaboration request • from {user?.handle ?? "@user"}
          </p>
          <p className="text-white/60">Wants to discuss a creative project.</p>
        </div>
      </section>
    </div>
  );
}

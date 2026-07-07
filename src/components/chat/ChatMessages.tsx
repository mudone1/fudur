"use client";

import { useEffect, useRef } from "react";
import clsx from "@/lib/clsx";
import type { ChatMessage } from "@/types";

export default function ChatMessages({
  messages,
  currentUid,
  emptyTitle,
  emptyBody,
}: {
  messages: ChatMessage[];
  currentUid: string | undefined;
  emptyTitle: string;
  emptyBody: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center text-muted">
        <p className="text-sm font-semibold">{emptyTitle}</p>
        <p className="text-xs">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {messages.map((m) => {
        const mine = m.senderUid === currentUid;
        return (
          <div key={m.id} className={clsx("flex flex-col", mine ? "items-end" : "items-start")}>
            {!mine && <span className="mb-0.5 text-[11px] text-muted">{m.senderName}</span>}
            <div
              className={clsx(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                mine ? "bg-orange text-white" : "bg-surface text-ink"
              )}
            >
              {m.text}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

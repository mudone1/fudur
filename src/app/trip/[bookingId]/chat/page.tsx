"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import clsx from "@/lib/clsx";
import { IconPhone, IconSend } from "@tabler/icons-react";
import type { ChatMessage } from "@/types";

interface BookingInfo {
  routeId: string;
  tripDate: string;
  driverUid: string;
  driverName: string;
  riderUid: string;
}

function useMessages(path: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useEffect(() => {
    if (!path) return;
    const q = query(collection(db, path), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) })));
    });
    return () => unsub();
  }, [path]);
  return messages;
}

function ChatContent() {
  const { firebaseUser, profile } = useAuth();
  const params = useParams<{ bookingId: string }>();
  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [tab, setTab] = useState<"group" | "driver">("group");
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await authFetch(firebaseUser, `/api/bookings/${params.bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setInfo({
          routeId: data.booking.routeId,
          tripDate: data.booking.tripDate,
          driverUid: data.booking.driverUid,
          driverName: data.driver?.name ?? "Driver",
          riderUid: data.booking.riderUid,
        });
      }
    }
    load();
  }, [firebaseUser, params.bookingId]);

  const groupPath = info ? `routeChats/${info.routeId}_${info.tripDate}/messages` : null;
  const directPath =
    info && firebaseUser
      ? `directChats/${info.driverUid}_${info.riderUid}/messages`
      : null;

  const groupMessages = useMessages(groupPath);
  const directMessages = useMessages(directPath);
  const activeMessages = tab === "group" ? groupMessages : directMessages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  async function send() {
    if (!text.trim() || !firebaseUser || !profile) return;
    const path = tab === "group" ? groupPath : directPath;
    if (!path) return;
    await addDoc(collection(db, path), {
      senderUid: firebaseUser.uid,
      senderName: profile.name,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    setText("");
  }

  return (
    <div className="flex h-screen flex-col">
      <TopNav title="Chats" />
      <div className="flex flex-shrink-0 gap-2 border-b border-border px-4 py-2">
        {(["group", "driver"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-sm font-medium",
              tab === t ? "bg-orange text-white" : "bg-surface text-muted"
            )}
          >
            {t === "group" ? "Ride group" : "Driver chat"}
          </button>
        ))}
        <div className="ml-auto flex items-center">
          <button
            onClick={() => {}}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-green-light text-green"
            title={`Calling ${info?.driverName ?? "driver"}…`}
          >
            <IconPhone size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center text-muted">
            <p className="text-sm font-semibold">No messages yet</p>
            <p className="text-xs">
              {tab === "group"
                ? "Say hello to your co-riders! Coordinate your pickup so the driver doesn't wait."
                : "Ask your driver about the pickup point before departure."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeMessages.map((m) => {
              const mine = m.senderUid === firebaseUser?.uid;
              return (
                <div
                  key={m.id}
                  className={clsx("flex flex-col", mine ? "items-end" : "items-start")}
                >
                  {!mine && (
                    <span className="mb-0.5 text-[11px] text-muted">{m.senderName}</span>
                  )}
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
        )}
      </div>

      <div className="flex flex-shrink-0 items-end gap-2 border-t border-border p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={tab === "group" ? "Message your ride group…" : "Message your driver…"}
          className="max-h-24 flex-1 resize-none rounded-2xl border border-border px-3.5 py-2.5 text-sm"
        />
        <button
          onClick={send}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange text-white"
        >
          <IconSend size={16} />
        </button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <RequireAuth>
      <ChatContent />
    </RequireAuth>
  );
}

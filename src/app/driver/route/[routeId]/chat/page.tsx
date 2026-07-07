"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import { useChatMessages } from "@/lib/hooks/useChatMessages";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatComposer from "@/components/chat/ChatComposer";
import clsx from "@/lib/clsx";
import { IconUsers } from "@tabler/icons-react";
import type { DriverRoute } from "@/types";

interface RideDetail {
  route: DriverRoute;
  passengers: { bookingId: string; uid: string; name: string; rating: number }[];
}

function DriverChatContent() {
  const { firebaseUser, profile } = useAuth();
  const params = useParams<{ routeId: string }>();
  const [detail, setDetail] = useState<RideDetail | null>(null);
  // "group" or a specific rider's uid for a 1:1 thread
  const [tab, setTab] = useState<string>("group");

  useEffect(() => {
    async function load() {
      const res = await authFetch(firebaseUser, `/api/rides/${params.routeId}`);
      if (res.ok) setDetail(await res.json());
    }
    load();
  }, [firebaseUser, params.routeId]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const groupPath = detail ? `routeChats/${params.routeId}_${todayKey}/messages` : null;
  const directPath =
    detail && tab !== "group" && firebaseUser
      ? `directChats/${firebaseUser.uid}_${tab}/messages`
      : null;

  const groupMessages = useChatMessages(groupPath);
  const directMessages = useChatMessages(directPath);
  const activeMessages = tab === "group" ? groupMessages : directMessages;

  async function handleSend(messageText: string) {
    if (!firebaseUser || !profile) return;
    const path = tab === "group" ? groupPath : directPath;
    if (!path) return;
    await addDoc(collection(db, path), {
      senderUid: firebaseUser.uid,
      senderName: profile.name,
      text: messageText,
      createdAt: serverTimestamp(),
    });
    authFetch(firebaseUser, "/api/notifications/chat-sent", {
      method: "POST",
      body:
        tab === "group"
          ? JSON.stringify({ routeId: params.routeId, scope: "group", text: messageText })
          : JSON.stringify({ routeId: params.routeId, scope: "direct", riderUid: tab, text: messageText }),
    }).catch(() => {});
  }

  if (!detail) {
    return (
      <div>
        <TopNav title="Passenger chat" />
        <p className="p-6 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const activeName =
    tab === "group" ? null : detail.passengers.find((p) => p.uid === tab)?.name ?? "Rider";

  return (
    <div className="flex h-screen flex-col">
      <TopNav title={activeName ?? "Passenger chat"} />
      <div className="flex flex-shrink-0 gap-2 overflow-x-auto border-b border-border px-4 py-2">
        <button
          onClick={() => setTab("group")}
          className={clsx(
            "flex flex-shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium",
            tab === "group" ? "bg-orange text-white" : "bg-surface text-muted"
          )}
        >
          <IconUsers size={14} /> All ({detail.passengers.length})
        </button>
        {detail.passengers.map((p) => (
          <button
            key={p.uid}
            onClick={() => setTab(p.uid)}
            className={clsx(
              "flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium",
              tab === p.uid ? "bg-orange text-white" : "bg-surface text-muted"
            )}
          >
            {p.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {detail.passengers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 text-center text-muted">
          <p className="text-sm font-semibold">No passengers booked today yet</p>
          <p className="text-xs">
            Once a rider books a seat on this route, you&apos;ll be able to chat with
            them here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <ChatMessages
              messages={activeMessages}
              currentUid={firebaseUser?.uid}
              emptyTitle="No messages yet"
              emptyBody={
                tab === "group"
                  ? "Let today's riders know your ETA or any updates."
                  : `Send ${activeName} a message directly.`
              }
            />
          </div>
          <ChatComposer
            placeholder={tab === "group" ? "Message all riders…" : `Message ${activeName}…`}
            onSend={handleSend}
          />
        </>
      )}
    </div>
  );
}

export default function DriverChatPage() {
  return (
    <RequireAuth driverOnly>
      <DriverChatContent />
    </RequireAuth>
  );
}

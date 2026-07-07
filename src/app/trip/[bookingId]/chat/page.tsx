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
import { IconPhone } from "@tabler/icons-react";

interface BookingInfo {
  routeId: string;
  tripDate: string;
  driverUid: string;
  driverName: string;
  driverPhone: string | null;
  riderUid: string;
}

function ChatContent() {
  const { firebaseUser, profile } = useAuth();
  const params = useParams<{ bookingId: string }>();
  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [tab, setTab] = useState<"group" | "driver">("group");

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
          driverPhone: data.driver?.phone ?? null,
          riderUid: data.booking.riderUid,
        });
      }
    }
    load();
  }, [firebaseUser, params.bookingId]);

  const groupPath = info ? `routeChats/${info.routeId}_${info.tripDate}/messages` : null;
  const directPath =
    info && firebaseUser ? `directChats/${info.driverUid}_${info.riderUid}/messages` : null;

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
    // Fire-and-forget push to the other participant(s); a failure here
    // shouldn't block or roll back the message already written above.
    authFetch(firebaseUser, "/api/notifications/chat-sent", {
      method: "POST",
      body: JSON.stringify({ bookingId: params.bookingId, scope: tab, text: messageText }),
    }).catch(() => {});
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
          {info?.driverPhone ? (
            <a
              href={`tel:${info.driverPhone}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-green-light text-green"
              title={`Call ${info.driverName}`}
            >
              <IconPhone size={16} />
            </a>
          ) : (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted opacity-50"
              title="No phone number on file"
            >
              <IconPhone size={16} />
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessages
          messages={activeMessages}
          currentUid={firebaseUser?.uid}
          emptyTitle="No messages yet"
          emptyBody={
            tab === "group"
              ? "Say hello to your co-riders! Coordinate your pickup so the driver doesn't wait."
              : "Ask your driver about the pickup point before departure."
          }
        />
      </div>

      <ChatComposer
        placeholder={tab === "group" ? "Message your ride group…" : "Message your driver…"}
        onSend={handleSend}
      />
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

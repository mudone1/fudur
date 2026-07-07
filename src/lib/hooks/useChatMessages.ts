"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ChatMessage } from "@/types";

export function useChatMessages(path: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!path) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, path), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) }))
        );
      },
      (err) => {
        // Most common cause: Firestore security rules not published yet.
        console.error(`Chat listener error on ${path}:`, err);
      }
    );
    return () => unsub();
  }, [path]);

  return messages;
}

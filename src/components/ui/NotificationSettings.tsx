"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import { enablePushNotifications } from "@/lib/firebase/messaging";
import Button from "@/components/ui/Button";
import { IconBell, IconBellRinging } from "@tabler/icons-react";

export default function NotificationSettings() {
  const { firebaseUser } = useAuth();
  const [status, setStatus] = useState<"idle" | "busy" | "on" | "off">("idle");

  async function handleEnable() {
    setStatus("busy");
    const token = await enablePushNotifications();
    if (!token) {
      setStatus("off");
      return;
    }
    try {
      const res = await authFetch(firebaseUser, "/api/notifications/token", {
        method: "POST",
        body: JSON.stringify({ fcmToken: token }),
      });
      setStatus(res.ok ? "on" : "off");
    } catch {
      setStatus("off");
    }
  }

  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="mb-2 flex items-center gap-2">
        {status === "on" ? (
          <IconBellRinging size={18} className="text-green" />
        ) : (
          <IconBell size={18} className="text-muted" />
        )}
        <span className="text-sm font-bold">Ride notifications</span>
      </div>
      <p className="mb-3 text-xs text-muted">
        Get notified about new bookings, messages, and ride updates — even
        when the app isn&apos;t open.
      </p>
      {status === "on" ? (
        <p className="text-xs font-medium text-green">Notifications enabled ✓</p>
      ) : status === "off" ? (
        <div>
          <p className="mb-2 text-xs text-[#C83030]">
            Couldn&apos;t enable notifications — check your browser permission
            settings and try again.
          </p>
          <Button variant="outline-green" full onClick={handleEnable}>
            Try again
          </Button>
        </div>
      ) : (
        <Button variant="green" full loading={status === "busy"} onClick={handleEnable}>
          Enable notifications
        </Button>
      )}
    </div>
  );
}

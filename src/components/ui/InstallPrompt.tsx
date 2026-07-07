"use client";

import { useEffect, useState } from "react";
import { IconDownload, IconX, IconShare2 } from "@tabler/icons-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag for "launched from Home Screen"
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIOS()) {
      // iOS never fires beforeinstallprompt — Safari only supports the
      // manual Share > Add to Home Screen flow, so just point users at it.
      setShowIOSHint(true);
      return;
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || (!deferredEvent && !showIOSHint)) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-app items-center gap-3 border-t border-border bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-light text-orange">
        {showIOSHint ? <IconShare2 size={18} /> : <IconDownload size={18} />}
      </div>
      <div className="flex-1 text-xs">
        {showIOSHint ? (
          <>
            <span className="font-semibold">Install Fudur:</span> tap{" "}
            <IconShare2 size={12} className="inline" /> Share, then &quot;Add to
            Home Screen&quot;
          </>
        ) : (
          <span className="font-semibold">Install Fudur for quicker access and ride alerts</span>
        )}
      </div>
      {!showIOSHint && (
        <button
          onClick={async () => {
            await deferredEvent?.prompt();
            setDeferredEvent(null);
          }}
          className="flex-shrink-0 rounded-lg bg-orange px-3 py-1.5 text-xs font-semibold text-white"
        >
          Install
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-muted"
        aria-label="Dismiss"
      >
        <IconX size={16} />
      </button>
    </div>
  );
}

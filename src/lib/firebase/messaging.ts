"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { firebaseApp } from "@/lib/firebase/client";

/**
 * Registers the combined service worker (offline shell + FCM background
 * handler), requests notification permission if needed, and returns an FCM
 * registration token — or null if the browser doesn't support any of this
 * (e.g. iOS Safari outside of "Add to Home Screen" mode) or the user denies
 * permission.
 */
export async function enablePushNotifications(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn(
      "NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set — see README for how to generate one."
    );
    return null;
  }

  const messaging = getMessaging(firebaseApp);
  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    console.error("Could not get FCM token", err);
    return null;
  }
}

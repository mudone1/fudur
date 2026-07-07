import { getMessaging } from "firebase-admin/messaging";
import { adminDb } from "./admin";

/**
 * Sends a push notification to a user, looking up their stored FCM token.
 * No-ops quietly if the user has no token (never enabled notifications, or
 * denied permission) — this is expected and not an error condition.
 */
export async function sendPushToUser(
  uid: string,
  notification: { title: string; body: string; url?: string }
) {
  const snap = await adminDb.collection("users").doc(uid).get();
  const token = snap.exists ? (snap.data()?.fcmToken as string | undefined) : undefined;
  if (!token) return;

  try {
    await getMessaging().send({
      token,
      notification: { title: notification.title, body: notification.body },
      data: notification.url ? { url: notification.url } : undefined,
      webpush: {
        fcmOptions: notification.url ? { link: notification.url } : undefined,
      },
    });
  } catch (err) {
    // A stale/invalid token shouldn't break the calling request (e.g. a
    // booking still succeeds even if the push to the driver fails).
    console.error(`Push to ${uid} failed:`, err);
  }
}

import type { User } from "firebase/auth";

export async function authFetch(
  user: User | null,
  input: string,
  init?: RequestInit
) {
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken();
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${idToken}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(input, { ...init, headers });
  return res;
}

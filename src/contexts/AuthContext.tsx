"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { AccountType, UserProfile } from "@/types";

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean; // initial auth-state resolution
  authBusy: boolean; // signing in, saving profile
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  completeProfile: (params: {
    name: string;
    area: string;
    type: AccountType;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === "auth/unauthorized-domain") {
    return "This site's domain isn't authorized for sign-in yet. In Firebase console → Authentication → Settings → Authorized domains, add this exact domain, then try again.";
  }
  if (code === "auth/operation-not-supported-in-this-environment") {
    return "Google sign-in doesn't work inside this app's built-in browser (e.g. opened from Instagram/Facebook/TikTok). Open this link in Chrome or Safari directly, then try again.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error during sign-in — check your connection and try again.";
  }
  return err instanceof Error ? `Could not sign in: ${err.message}` : "Could not sign in";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handledRedirectRef = useRef(false);

  async function fetchProfile(idToken: string): Promise<UserProfile | null> {
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile ?? null);
        return data.profile ?? null;
      }
      setProfile(null);
      return null;
    } catch {
      setProfile(null);
      return null;
    }
  }

  useEffect(() => {
    // Resolves a just-completed signInWithRedirect round trip. This runs
    // once per app load. On success we explicitly route to the right place
    // ourselves — we don't rely on whichever page the browser happens to
    // land back on after the OAuth round trip, since that's not always the
    // page that initiated sign-in (varies by browser). On failure, we route
    // to /login so the error is actually visible instead of failing silently
    // on whatever page the user lands on.
    getRedirectResult(auth)
      .then(async (result) => {
        handledRedirectRef.current = true;
        if (!result) return; // no redirect was pending — normal page load
        const idToken = await result.user.getIdToken();
        const loadedProfile = await fetchProfile(idToken);
        if (!loadedProfile?.name) {
          router.replace("/complete-profile");
        } else {
          router.replace(loadedProfile.type === "driver" ? "/driver/dashboard" : "/rider/home");
        }
      })
      .catch((err) => {
        handledRedirectRef.current = true;
        setError(friendlyAuthError(err));
        router.replace("/login");
      });

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const idToken = await user.getIdToken();
        await fetchProfile(idToken);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setAuthBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithRedirect(auth, provider);
      // Page navigates away to Google, then back — the effect above picks
      // it up via getRedirectResult on the next load.
    } catch (err) {
      setError(friendlyAuthError(err));
      setAuthBusy(false);
    }
  }, []);

  const completeProfile = useCallback(
    async ({
      name,
      area,
      type,
    }: {
      name: string;
      area: string;
      type: AccountType;
    }) => {
      setError(null);
      if (!firebaseUser) {
        setError("Not signed in");
        return;
      }
      if (!name.trim()) {
        setError("Enter your full name");
        return;
      }
      setAuthBusy(true);
      try {
        const idToken = await firebaseUser.getIdToken();
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ name, area, type }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Registration failed");
        }
        const data = await res.json();
        setProfile(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registration failed");
      } finally {
        setAuthBusy(false);
      }
    },
    [firebaseUser]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        authBusy,
        error,
        clearError,
        signInWithGoogle,
        completeProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

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
  signInWithPopup,
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

  function routeAfterSignIn(loadedProfile: UserProfile | null) {
    if (!loadedProfile?.name) {
      router.replace("/complete-profile");
    } else {
      router.replace(loadedProfile.type === "driver" ? "/driver/dashboard" : "/rider/home");
    }
  }

  useEffect(() => {
    // Resolves a just-completed signInWithRedirect round trip, for browsers
    // where the popup approach below got blocked and fell back to redirect.
    // This can itself fail in browsers/modes with restricted storage (some
    // privacy browsers, certain mobile in-app webviews) — if so, the error
    // is surfaced here rather than failing silently.
    getRedirectResult(auth)
      .then(async (result) => {
        handledRedirectRef.current = true;
        if (!result) return; // no redirect was pending — normal page load
        const idToken = await result.user.getIdToken();
        const loadedProfile = await fetchProfile(idToken);
        routeAfterSignIn(loadedProfile);
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
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      // Popup is tried first: it doesn't depend on browser storage
      // surviving a full page navigation away and back, which is where
      // the redirect flow has been failing (blocked/partitioned storage,
      // "missing initial state", "heartbeats undefined", etc. are all
      // symptoms of that same underlying class of problem).
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const loadedProfile = await fetchProfile(idToken);
      routeAfterSignIn(loadedProfile);
      setAuthBusy(false);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const shouldFallBackToRedirect =
        code === "auth/popup-blocked" ||
        code === "auth/operation-not-supported-in-this-environment" ||
        code === "auth/cancelled-popup-request";

      if (code === "auth/popup-closed-by-user") {
        // User closed the popup themselves — not an error, just reset.
        setAuthBusy(false);
        return;
      }

      if (shouldFallBackToRedirect) {
        try {
          await signInWithRedirect(auth, provider);
          // Page navigates away — getRedirectResult (above) picks it up on return.
        } catch (redirectErr) {
          setError(friendlyAuthError(redirectErr));
          setAuthBusy(false);
        }
        return;
      }

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

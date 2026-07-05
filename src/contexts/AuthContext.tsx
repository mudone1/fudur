"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  User,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { AccountType, UserProfile } from "@/types";

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean; // initial auth-state resolution
  authBusy: boolean; // sending/verifying OTP, saving profile
  error: string | null;
  clearError: () => void;
  sendOtp: (rawPhone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resetPhoneStep: () => void;
  completeProfile: (params: {
    name: string;
    area: string;
    type: AccountType;
  }) => Promise<void>;
  logout: () => Promise<void>;
  otpSentTo: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Normalizes a Nigerian phone number to +234 E.164 form. */
function formatNigerianPhone(raw: string): string {
  let formatted = raw.replace(/\s+/g, "");
  if (formatted.startsWith("0")) formatted = "+234" + formatted.slice(1);
  if (!formatted.startsWith("+")) formatted = "+234" + formatted;
  return formatted;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
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
  }, []);

  async function fetchProfile(idToken: string) {
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile ?? null);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    }
  }

  const clearError = useCallback(() => setError(null), []);

  const sendOtp = useCallback(async (rawPhone: string) => {
    setError(null);
    if (!rawPhone.trim()) {
      setError("Enter your phone number");
      return;
    }
    const formatted = formatNigerianPhone(rawPhone);
    setAuthBusy(true);
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible", callback: () => {} }
        );
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        formatted,
        recaptchaRef.current
      );
      confirmationRef.current = confirmation;
      setOtpSentTo(formatted);
    } catch (err) {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
      setError(
        err instanceof Error ? `Could not send OTP: ${err.message}` : "Could not send OTP"
      );
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    setError(null);
    if (!code || code.length < 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    if (!confirmationRef.current) {
      setError("Request a new OTP first");
      return;
    }
    setAuthBusy(true);
    try {
      await confirmationRef.current.confirm(code);
      // onAuthStateChanged fires next and loads/creates the profile.
    } catch {
      setError("Wrong OTP — try again");
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const resetPhoneStep = useCallback(() => {
    recaptchaRef.current?.clear();
    recaptchaRef.current = null;
    confirmationRef.current = null;
    setOtpSentTo(null);
    setError(null);
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
        sendOtp,
        verifyOtp,
        resetPhoneStep,
        completeProfile,
        logout,
        otpSentTo,
      }}
    >
      {children}
      <div id="recaptcha-container" />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

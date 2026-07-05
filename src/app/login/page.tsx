"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import TopNav from "@/components/layout/TopNav";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { IconSend, IconCheck, IconRefresh } from "@tabler/icons-react";

export default function LoginPage() {
  const {
    firebaseUser,
    profile,
    loading,
    authBusy,
    error,
    clearError,
    sendOtp,
    verifyOtp,
    resetPhoneStep,
    otpSentTo,
  } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (loading || !firebaseUser) return;
    router.replace(profile?.name ? "/" : "/complete-profile");
  }, [loading, firebaseUser, profile, router]);

  return (
    <div>
      <TopNav title="Log in" />
      <div className="px-4 pt-10 pb-7 text-center">
        <div className="mb-3 text-4xl">📱</div>
        <h2 className="text-xl font-bold">Welcome back</h2>
        <p className="text-sm text-muted">
          We&apos;ll send a one-time code to your Nigerian phone number
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {error && (
          <div className="rounded-[10px] border border-[#E24B4A] bg-[#FFF0F0] px-3.5 py-3 text-sm text-[#C83030]">
            {error}
          </div>
        )}

        {!otpSentTo ? (
          <>
            <Field
              label="Phone number"
              hint="Enter your number starting with 0 — e.g. 0801 234 5678"
            >
              <div className="flex items-center gap-2">
                <div className="whitespace-nowrap rounded-[10px] border border-border bg-surface px-3.5 py-3 text-[15px] font-semibold text-muted">
                  🇳🇬 +234
                </div>
                <input
                  type="tel"
                  placeholder="0801 234 5678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearError();
                  }}
                  className="flex-1 rounded-[10px] border border-border px-3.5 py-3 text-[15px]"
                />
              </div>
            </Field>
            <Button
              variant="orange"
              full
              loading={authBusy}
              onClick={() => sendOtp(phone)}
              className="text-base"
            >
              <IconSend size={18} /> {authBusy ? "Sending…" : "Send OTP"}
            </Button>
            <div className="py-2 text-center text-xs text-muted">
              new to fudur?
            </div>
            <p className="text-center text-[13px] text-muted">
              Enter your phone number above — riders finish setup on the next
              screen.
            </p>
            <Link href="/driver/register">
              <Button variant="ghost" full type="button">
                Register as a partner driver
              </Button>
            </Link>
          </>
        ) : (
          <>
            <div className="rounded-xl bg-green-light p-3.5 text-center">
              <p className="text-sm font-semibold text-green">OTP sent!</p>
              <p className="text-[13px] text-muted">
                We sent a 6-digit code to
              </p>
              <p className="mt-1 text-[15px] font-bold">{otpSentTo}</p>
            </div>
            <Field label="Enter 6-digit OTP">
              <input
                type="number"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  clearError();
                }}
                className="w-full rounded-[10px] border border-border py-3.5 text-center text-2xl tracking-[8px]"
              />
            </Field>
            <Button
              variant="orange"
              full
              loading={authBusy}
              onClick={() => verifyOtp(code)}
              className="text-base"
            >
              <IconCheck size={18} /> {authBusy ? "Verifying…" : "Verify OTP"}
            </Button>
            <Button variant="ghost" full onClick={resetPhoneStep}>
              <IconRefresh size={18} /> Wrong number? Resend
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

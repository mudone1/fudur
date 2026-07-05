"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import TopNav from "@/components/layout/TopNav";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import clsx from "@/lib/clsx";
import { IconArmchair, IconSteeringWheel } from "@tabler/icons-react";
import type { AccountType } from "@/types";

const AREAS = [
  "Dutse",
  "Gwarimpa",
  "Kubwa",
  "Karu",
  "Lugbe",
  "Nyanya",
  "Life Camp",
  "Mararaba",
];

export default function CompleteProfilePage() {
  const { firebaseUser, profile, loading, authBusy, error, clearError, completeProfile } =
    useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [area, setArea] = useState(AREAS[0]);
  const [type, setType] = useState<AccountType>("rider");

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (profile?.name) {
      router.replace(profile.type === "driver" ? "/driver/dashboard" : "/rider/home");
    }
  }, [loading, firebaseUser, profile, router]);

  async function handleSubmit() {
    await completeProfile({ name, area, type });
  }

  return (
    <div>
      <TopNav title="Almost there!" showBack={false} />
      <div className="px-4 pt-10 pb-7 text-center">
        <div className="mb-3 text-4xl">🙌</div>
        <h2 className="text-xl font-bold">Phone verified!</h2>
        <p className="text-sm text-muted">
          Just tell us your name and you&apos;re in
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {error && (
          <div className="rounded-[10px] border border-[#E24B4A] bg-[#FFF0F0] px-3.5 py-3 text-sm text-[#C83030]">
            {error}
          </div>
        )}

        <Field label="Full name">
          <input
            type="text"
            placeholder="e.g. Amaka Obi"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError();
            }}
          />
        </Field>

        <Field label="I want to">
          <div className="mt-1 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setType("rider")}
              className={clsx(
                "rounded-xl border-2 p-4 text-center",
                type === "rider"
                  ? "border-orange bg-orange-light"
                  : "border-border bg-white"
              )}
            >
              <IconArmchair
                size={28}
                className={clsx(
                  "mx-auto mb-1.5",
                  type === "rider" ? "text-orange" : "text-muted"
                )}
              />
              <div
                className={clsx(
                  "text-sm font-bold",
                  type === "rider" ? "text-orange" : "text-muted"
                )}
              >
                Book rides
              </div>
              <div className="text-[11px] text-muted">I am a rider</div>
            </button>
            <button
              type="button"
              onClick={() => setType("driver")}
              className={clsx(
                "rounded-xl border-2 p-4 text-center",
                type === "driver"
                  ? "border-green bg-green-light"
                  : "border-border bg-white"
              )}
            >
              <IconSteeringWheel
                size={28}
                className={clsx(
                  "mx-auto mb-1.5",
                  type === "driver" ? "text-green" : "text-muted"
                )}
              />
              <div
                className={clsx(
                  "text-sm font-bold",
                  type === "driver" ? "text-green" : "text-muted"
                )}
              >
                Drive &amp; earn
              </div>
              <div className="text-[11px] text-muted">I am a driver</div>
            </button>
          </div>
        </Field>

        <Field label="Your main area in Abuja">
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>

        <Button
          variant="orange"
          full
          loading={authBusy}
          onClick={handleSubmit}
          className="text-base"
        >
          {authBusy ? "Saving…" : "Create my account"}
        </Button>
      </div>
    </div>
  );
}

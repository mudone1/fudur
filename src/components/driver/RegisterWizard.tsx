"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import clsx from "@/lib/clsx";
import { IconArrowLeft, IconArrowRight, IconCheck } from "@tabler/icons-react";

const AREAS = [
  "Dutse",
  "Gwarimpa",
  "Kubwa",
  "Karu",
  "Lugbe",
  "Nyanya",
  "Life Camp",
];
const DESTINATIONS = [
  "Federal Secretariat",
  "Wuse",
  "Area 1",
  "Katampe",
  "CBD",
  "Garki",
  "Maitama",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COLOURS = [
  ["Silver", "#C0C0C0"],
  ["Black", "#1a1a18"],
  ["White", "#ffffff"],
  ["Blue", "#1a3a8f"],
  ["Red", "#b22222"],
  ["Green", "#2e7d32"],
  ["Gold", "#d4a017"],
  ["Grey", "#888888"],
] as const;

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  from: string;
  to: string;
  departureTime: string;
  meetingPoint: string;
  days: string[];
  pricePerSeat: string;
  make: string;
  model: string;
  plate: string;
  year: string;
  colour: string;
  seats: number;
}

const initialState: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  from: AREAS[0],
  to: DESTINATIONS[0],
  departureTime: "07:15",
  meetingPoint: "",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  pricePerSeat: "800",
  make: "",
  model: "",
  plate: "",
  year: "",
  colour: "Silver",
  seats: 4,
};

const STEPS = ["Personal", "Route", "Car", "Done"];

export default function RegisterWizard() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleDay(day: string) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day)
        ? f.days.filter((d) => d !== day)
        : [...f.days, day],
    }));
  }

  async function submitApplication() {
    if (!firebaseUser) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/driver/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          route: {
            from: form.from,
            to: form.to,
            departureTime: form.departureTime,
            meetingPoint: form.meetingPoint,
            days: form.days,
            pricePerSeat: form.pricePerSeat,
          },
          car: {
            make: form.make,
            model: form.model,
            plate: form.plate,
            year: form.year,
            colour: form.colour,
            seats: form.seats,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Application failed");
      }
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {step < 4 && (
        <div className="flex px-2 py-4">
          {STEPS.slice(0, 3).map((label, i) => {
            const n = i + 1;
            const state =
              n < step ? "done" : n === step ? "active" : "pending";
            return (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                    state === "done" && "bg-green text-white",
                    state === "active" && "bg-orange text-white",
                    state === "pending" && "bg-surface text-muted"
                  )}
                >
                  {n}
                </div>
                <span className="text-[11px] text-muted">{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mx-4 mb-3 rounded-[10px] border border-[#E24B4A] bg-[#FFF0F0] px-3.5 py-3 text-sm text-[#C83030]">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3 px-4">
          <p className="mb-1 text-base font-bold">Personal details</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <input
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="Musa"
              />
            </Field>
            <Field label="Last name">
              <input
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="Kabir"
              />
            </Field>
          </div>
          <Field label="Phone number">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="0801 234 5678"
            />
          </Field>
          <Field label="Email address (optional)">
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@email.com"
            />
          </Field>
          <div className="notice-box notice-orange">
            As a partner driver, you agree to Fudur&apos;s community
            guidelines and driver code of conduct.
          </div>
          <Button
            variant="green"
            full
            className="mt-1"
            onClick={() => setStep(2)}
            disabled={!form.firstName || !form.lastName || !form.phone}
          >
            Next: Route details <IconArrowRight size={18} />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3 px-4">
          <p className="mb-1 text-base font-bold">Your commute route</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Route from">
              <select value={form.from} onChange={(e) => update("from", e.target.value)}>
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Route to">
              <select value={form.to} onChange={(e) => update("to", e.target.value)}>
                {DESTINATIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Departure time">
            <input
              type="time"
              value={form.departureTime}
              onChange={(e) => update("departureTime", e.target.value)}
            />
          </Field>
          <Field label="Meeting point / bus stop">
            <input
              value={form.meetingPoint}
              onChange={(e) => update("meetingPoint", e.target.value)}
              placeholder="e.g. Total Petrol Station, Dutse junction"
            />
          </Field>
          <Field label="Days you drive">
            <div className="mt-1 flex flex-wrap gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={clsx(
                    "rounded-lg border px-3 py-2 text-[13px]",
                    form.days.includes(d)
                      ? "border-green bg-green-light text-green"
                      : "border-border text-muted"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field
            label="Price per seat (₦)"
            hint="Set a fair price — riders see this before booking"
          >
            <input
              type="number"
              min={200}
              max={5000}
              step={50}
              value={form.pricePerSeat}
              onChange={(e) => update("pricePerSeat", e.target.value)}
            />
          </Field>
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={() => setStep(1)} className="flex-none px-5">
              <IconArrowLeft size={18} />
            </Button>
            <Button
              variant="green"
              full
              onClick={() => setStep(3)}
              disabled={!form.meetingPoint}
            >
              Next: Car details <IconArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3 px-4">
          <p className="mb-1 text-base font-bold">Your car details</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Car make">
              <input
                value={form.make}
                onChange={(e) => update("make", e.target.value)}
                placeholder="e.g. Toyota"
              />
            </Field>
            <Field label="Car model">
              <input
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                placeholder="e.g. Camry"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plate number">
              <input
                value={form.plate}
                onChange={(e) => update("plate", e.target.value.toUpperCase())}
                placeholder="ABC 234 EK"
                className="font-mono text-base uppercase tracking-widest"
              />
            </Field>
            <Field label="Year">
              <input
                type="number"
                min={2005}
                max={2026}
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                placeholder="2020"
              />
            </Field>
          </div>
          <Field label="Car colour">
            <div className="mt-1.5 flex flex-wrap gap-2">
              {COLOURS.map(([name, hex]) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => update("colour", name)}
                  style={{ background: hex }}
                  className={clsx(
                    "h-7 w-7 rounded-full border",
                    form.colour === name
                      ? "border-2 border-orange"
                      : "border-border"
                  )}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[13px] font-semibold text-green">
              Selected: {form.colour}
            </p>
          </Field>
          <Field label="Number of seats to offer">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update("seats", n)}
                  className={clsx(
                    "flex flex-1 flex-col items-center rounded-lg border py-2",
                    form.seats === n
                      ? "border-orange bg-orange-light text-orange"
                      : "border-border text-muted"
                  )}
                >
                  <span className="text-base font-bold">{n}</span>
                  <span className="text-[10px]">seat{n > 1 ? "s" : ""}</span>
                </button>
              ))}
            </div>
          </Field>
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={() => setStep(2)} className="flex-none px-5">
              <IconArrowLeft size={18} />
            </Button>
            <Button
              variant="green"
              full
              loading={submitting}
              onClick={submitApplication}
              disabled={!form.make || !form.plate}
            >
              {submitting ? "Submitting…" : "Submit application"}{" "}
              <IconCheck size={18} />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="px-4 py-10 text-center">
          <div className="mb-4 text-6xl">🎉</div>
          <h2 className="mb-2.5 text-2xl font-bold">
            Application submitted!
          </h2>
          <p className="mb-6 leading-7 text-muted">
            We&apos;ll review your details within 24 hours and send an SMS to
            your phone when approved. Welcome to the Fudur partner family!
          </p>
          <div className="notice-box notice-green mb-6 text-left">
            <strong>What happens next:</strong>
            <br />
            1. We verify your details and plate number
            <br />
            2. You receive an approval SMS
            <br />
            3. Your route goes live and riders can book
          </div>
          <Button
            variant="green"
            full
            className="mb-2.5"
            onClick={() => router.push("/driver/dashboard")}
          >
            Go to driver dashboard
          </Button>
        </div>
      )}
    </div>
  );
}

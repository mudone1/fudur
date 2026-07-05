"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import Button from "@/components/ui/Button";
import clsx from "@/lib/clsx";
import type { Booking, DriverRoute } from "@/types";

const TAGS = [
  "On time",
  "Clean car",
  "Friendly",
  "Safe driver",
  "Smooth ride",
  "Good music",
  "Quiet ride",
];

const RATING_LABELS: Record<number, string> = {
  1: "Not great",
  2: "Okay",
  3: "Good",
  4: "Great!",
  5: "Excellent!",
};

interface RateDetail {
  booking: Booking;
  route: DriverRoute | null;
  driver: { uid: string; name: string; rating: number } | null;
  coRiders: { uid: string; name: string; rating: number }[];
}

function RateContent() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const [detail, setDetail] = useState<RateDetail | null>(null);
  const [driverRating, setDriverRating] = useState(5);
  const [tags, setTags] = useState<string[]>(["On time", "Clean car"]);
  const [coRiderRatings, setCoRiderRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await authFetch(firebaseUser, `/api/bookings/${params.bookingId}`);
      if (res.ok) setDetail(await res.json());
    }
    load();
  }, [firebaseUser, params.bookingId]);

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  async function submit() {
    setSubmitting(true);
    try {
      await authFetch(firebaseUser, `/api/bookings/${params.bookingId}/rate`, {
        method: "POST",
        body: JSON.stringify({ driverRating, tags, comment, coRiderRatings }),
      });
      router.push("/rider/home");
    } finally {
      setSubmitting(false);
    }
  }

  if (!detail) {
    return (
      <div>
        <TopNav title="Rate your ride" />
        <p className="p-6 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const { route, driver, coRiders } = detail;

  return (
    <div>
      <TopNav title="Rate your ride" />
      <div className="flex flex-col items-center gap-1 px-4 py-7 text-center">
        <div className="mb-1 text-5xl">🏁</div>
        <h2 className="text-xl font-bold">You&apos;ve arrived!</h2>
        <p className="mb-4 text-sm text-muted">
          {route?.from} → {route?.to} · ₦{detail.booking.fare}
        </p>
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-orange-light text-xl font-bold text-orange">
          {(driver?.name ?? "??").slice(0, 2).toUpperCase()}
        </div>
        <div className="mb-2 text-base font-bold">Rate {driver?.name}</div>
        <div className="flex gap-1.5 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setDriverRating(n)}
              className={clsx(
                "text-3xl leading-none",
                n <= driverRating ? "text-[#F0A500]" : "text-border"
              )}
            >
              ★
            </button>
          ))}
        </div>
        <p className="text-sm font-semibold text-orange">
          {RATING_LABELS[driverRating]}
        </p>
      </div>

      <div className="px-4 pb-6">
        <p className="mb-2 text-xs font-bold text-muted">What stood out?</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={clsx(
                "rounded-full px-3.5 py-2 text-[13px] font-medium",
                tags.includes(tag)
                  ? "bg-green-light text-green"
                  : "bg-surface text-muted"
              )}
            >
              {tag} {tags.includes(tag) && "✓"}
            </button>
          ))}
        </div>

        {coRiders.length > 0 && (
          <div className="mb-4 border-t border-border pt-4">
            <p className="mb-1 text-xs font-bold text-muted">Rate your co-riders</p>
            <p className="mb-3 text-xs text-muted">
              This helps drivers know who to pick
            </p>
            <div className="flex flex-col gap-2.5">
              {coRiders.map((r) => (
                <div
                  key={r.uid}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-light text-xs font-bold text-green">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-sm font-medium">{r.name}</div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() =>
                          setCoRiderRatings((c) => ({ ...c, [r.uid]: n }))
                        }
                        className={clsx(
                          "text-lg leading-none",
                          n <= (coRiderRatings[r.uid] ?? 0)
                            ? "text-[#F0A500]"
                            : "text-border"
                        )}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="field mb-4">
          <label>Any comments? (optional)</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell others about this ride..."
          />
        </div>

        <Button variant="orange" full loading={submitting} onClick={submit} className="mb-2.5 text-base">
          Submit ratings
        </Button>
        <Button variant="ghost" full onClick={() => router.push("/rider/home")}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}

export default function PostRidePage() {
  return (
    <RequireAuth>
      <RateContent />
    </RequireAuth>
  );
}

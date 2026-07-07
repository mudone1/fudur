"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import {
  IconMapPin,
  IconMessageCircle,
  IconShieldCheck,
  IconCoin,
  IconSearch,
  IconUsers,
  IconCar,
} from "@tabler/icons-react";

const FEATURES = [
  {
    Icon: IconCoin,
    title: "Split the cost",
    body: "Share a ride with commuters on your route and pay a fraction of a solo cab fare.",
  },
  {
    Icon: IconShieldCheck,
    title: "Verified drivers",
    body: "Every partner driver's details and car are on file before their route goes live.",
  },
  {
    Icon: IconMessageCircle,
    title: "Stay in the loop",
    body: "Group chat with your driver and co-riders to coordinate pickup, every trip.",
  },
];

const RIDER_STEPS = [
  { Icon: IconSearch, title: "Search your route", body: "Pick where you're commuting from and to." },
  { Icon: IconUsers, title: "Book a seat", body: "See the driver, car, and who else is riding, then confirm." },
  { Icon: IconMapPin, title: "Ride & pay direct", body: "Meet at the pickup point, ride together, pay the driver in cash." },
];

function dashboardPathFor(type: "rider" | "driver" | undefined) {
  return type === "driver" ? "/driver/dashboard" : "/rider/home";
}

export default function LandingPage() {
  const { firebaseUser, profile, loading } = useAuth();
  const router = useRouter();

  // Signed-in users with no profile yet still need onboarding — that's not
  // optional, so this redirect stays. Everyone else (including fully signed-in
  // users) sees the landing page and can choose to enter their dashboard.
  useEffect(() => {
    if (loading || !firebaseUser) return;
    if (!profile?.name) {
      router.replace("/complete-profile");
    }
  }, [loading, firebaseUser, profile, router]);

  const signedIn = !loading && firebaseUser && profile?.name;

  return (
    <div className="pb-10">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 px-4 pt-10 pb-8 text-center">
        <Image src="/fudur-logo.png" alt="Fudur" width={72} height={72} priority />
        <h1 className="text-2xl font-bold">
          <span className="text-green">fu</span>
          <span className="text-orange">dur</span>
        </h1>
        <p className="max-w-xs text-muted">
          Abuja&apos;s commuter rideshare — split your daily commute with
          verified drivers and fellow riders.
        </p>

        {signedIn ? (
          <div className="mt-2 flex w-full max-w-xs flex-col gap-2.5">
            <p className="text-sm text-muted">
              Welcome back, {profile?.name?.split(" ")[0]} 👋
            </p>
            <Link href={dashboardPathFor(profile?.type)} className="w-full">
              <Button variant="orange" full>
                Go to my dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-2 flex w-full max-w-xs flex-col gap-2.5">
            <Link href="/login" className="w-full">
              <Button variant="orange" full>
                Log in / Sign up
              </Button>
            </Link>
            <Link href="/driver/register" className="w-full">
              <Button variant="green" full>
                Become a partner driver
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="px-4 py-6">
        <div className="flex flex-col gap-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="flex gap-3 rounded-xl border border-border p-3.5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-light text-orange">
                <Icon size={20} />
              </div>
              <div>
                <div className="text-sm font-bold">{title}</div>
                <div className="text-[13px] text-muted">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-border px-4 py-6">
        <h2 className="mb-4 text-center text-lg font-bold">How riding works</h2>
        <div className="flex flex-col gap-4">
          {RIDER_STEPS.map(({ Icon, title, body }, i) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-light text-sm font-bold text-green">
                {i + 1}
              </div>
              <div>
                <div className="mb-0.5 flex items-center gap-1.5 text-sm font-bold">
                  <Icon size={16} className="text-green" /> {title}
                </div>
                <div className="text-[13px] text-muted">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Driver CTA */}
      <div className="mx-4 mt-2 flex items-center gap-3 rounded-xl bg-gradient-to-br from-green to-green-dark p-4 text-white">
        <IconCar size={32} className="flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-bold">Drive your usual route, earn</div>
          <div className="text-xs opacity-85">
            Post your commute once — riders book instantly, no waiting.
          </div>
        </div>
      </div>
      {!signedIn && (
        <div className="mx-4 mt-3">
          <Link href="/driver/register">
            <Button variant="outline-green" full>
              Register as a driver
            </Button>
          </Link>
        </div>
      )}

      <p className="mt-8 px-4 text-center text-xs text-muted">
        Fudur doesn&apos;t process payments — riders pay drivers directly.
      </p>
    </div>
  );
}

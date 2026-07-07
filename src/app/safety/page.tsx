"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import Button from "@/components/ui/Button";
import {
  IconAlertTriangle,
  IconShare,
  IconX,
  IconPlus,
  IconFlag,
  IconShieldCheck,
} from "@tabler/icons-react";
import type { TrustedContact } from "@/types";

const TIPS = [
  {
    emoji: "🔍",
    title: "Verify the car before you enter",
    body: "Always confirm the plate number and car colour match what's shown in the app before getting in.",
  },
  {
    emoji: "📱",
    title: "Keep contact through the app",
    body: "Use the call/chat buttons in your trip screen so there's a record of your ride.",
  },
  {
    emoji: "👥",
    title: "Only ride with verified drivers",
    body: "Fudur partner drivers register their real details and car before their route goes live.",
  },
  {
    emoji: "⭐",
    title: "Always rate your ride",
    body: "Ratings keep the community honest. If anything felt wrong, rate accordingly — it matters.",
  },
];

const REPORT_REASONS = [
  "Driver didn't show up",
  "Unsafe driving",
  "Rude or inappropriate behaviour",
  "Car didn't match the app",
  "Overcharged",
  "Other",
];

function SafetyContent() {
  const { firebaseUser } = useAuth();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [sosStatus, setSosStatus] = useState<"idle" | "busy" | "sent">("idle");
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  async function loadContacts() {
    const res = await authFetch(firebaseUser, "/api/safety/contacts");
    if (res.ok) setContacts((await res.json()).contacts ?? []);
  }

  useEffect(() => {
    if (firebaseUser) loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  async function addContact() {
    if (!contactName.trim() || !contactPhone.trim()) return;
    const res = await authFetch(firebaseUser, "/api/safety/contacts", {
      method: "POST",
      body: JSON.stringify({ name: contactName, phone: contactPhone }),
    });
    if (res.ok) {
      setContactName("");
      setContactPhone("");
      setShowAddContact(false);
      loadContacts();
    }
  }

  async function removeContact(id: string) {
    await authFetch(firebaseUser, `/api/safety/contacts/${id}`, { method: "DELETE" });
    loadContacts();
  }

  async function handleSOS() {
    setSosStatus("busy");
    const res = await authFetch(firebaseUser, "/api/safety/sos", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSosStatus("sent");
    if (data.contact?.phone) {
      window.location.href = `tel:${data.contact.phone}`;
    }
  }

  async function shareTrip() {
    const res = await authFetch(firebaseUser, "/api/bookings/current");
    const data = await res.json().catch(() => ({}));
    if (!data?.booking?.id) {
      alert("You don't have an active ride right now to share.");
      return;
    }
    const url = `${window.location.origin}/share/${data.booking.id}`;
    if (navigator.share) {
      navigator.share({ title: "My Fudur trip", url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert("Trip link copied — send it to whoever you'd like to keep informed.");
    }
  }

  async function submitReport() {
    if (!reportReason) return;
    const res = await authFetch(firebaseUser, "/api/safety/report", {
      method: "POST",
      body: JSON.stringify({ reason: reportReason, description: reportDescription }),
    });
    if (res.ok) {
      setReportSubmitted(true);
      setReportReason("");
      setReportDescription("");
    }
  }

  return (
    <div>
      <TopNav title="Safety centre" />
      <div className="bg-gradient-to-br from-green to-green-dark px-4 py-6 text-center text-white">
        <IconShieldCheck size={44} className="mx-auto mb-2 opacity-90" />
        <h2 className="mb-1.5 text-xl font-bold">Your safety is our priority</h2>
        <p className="text-sm opacity-85">
          Every driver registers real details and a real car before their route goes live.
        </p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* Emergency SOS */}
        <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-[#E24B4A] bg-[#FFF0F0] p-4">
          <IconAlertTriangle size={28} className="flex-shrink-0 text-[#E24B4A]" />
          <div className="flex-1">
            <div className="mb-0.5 text-sm font-bold text-[#C83030]">Emergency SOS</div>
            <div className="text-xs text-[#8B2020]">
              {sosStatus === "sent"
                ? "Logged. Calling your trusted contact now if one's on file."
                : "Logs this ride for review and calls your first trusted contact"}
            </div>
          </div>
          <button
            onClick={handleSOS}
            disabled={sosStatus === "busy"}
            className="rounded-[10px] bg-[#E24B4A] px-3.5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {sosStatus === "busy" ? "…" : "SOS"}
          </button>
        </div>

        {/* Share trip */}
        <div className="flex items-center gap-3 rounded-xl border border-border p-3.5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-orange-light">
            <IconShare size={22} className="text-orange" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold">Share your trip</div>
            <div className="text-xs text-muted">Send a live trip link to someone you trust</div>
          </div>
          <Button variant="orange" onClick={shareTrip} className="px-3.5 py-2 text-xs">
            Share
          </Button>
        </div>

        {/* Trusted contacts */}
        <div>
          <p className="mb-2 text-sm font-bold">Trusted contacts</p>
          <div className="flex flex-col gap-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-light text-xs font-bold text-green">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-muted">{c.phone}</div>
                </div>
                <button onClick={() => removeContact(c.id)} className="text-muted">
                  <IconX size={16} />
                </button>
              </div>
            ))}

            {showAddContact ? (
              <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
                <input
                  placeholder="Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                />
                <input
                  placeholder="Phone number"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <Button variant="ghost" full onClick={() => setShowAddContact(false)}>
                    Cancel
                  </Button>
                  <Button variant="green" full onClick={addContact}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline-green" full onClick={() => setShowAddContact(true)}>
                <IconPlus size={16} /> Add trusted contact
              </Button>
            )}
          </div>
        </div>

        {/* Safety tips */}
        <div>
          <p className="mb-2 mt-1 text-sm font-bold">Safety tips</p>
          <div className="flex flex-col gap-2">
            {TIPS.map((tip) => (
              <div key={tip.title} className="flex gap-3 rounded-xl border border-border p-3">
                <span className="text-xl">{tip.emoji}</span>
                <div>
                  <div className="mb-0.5 text-sm font-semibold">{tip.title}</div>
                  <div className="text-xs text-muted">{tip.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report */}
        <div className="mt-1 rounded-2xl bg-surface p-4 text-center">
          <p className="mb-1.5 text-sm font-semibold">Something go wrong?</p>
          <p className="mb-3 text-xs text-muted">
            Report a driver, incident, or safety concern.
          </p>
          {reportSubmitted ? (
            <p className="text-sm font-semibold text-green">Report submitted ✓</p>
          ) : showReport ? (
            <div className="flex flex-col gap-2 text-left">
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="">Select a reason…</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <textarea
                rows={3}
                placeholder="What happened? (optional)"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button variant="ghost" full onClick={() => setShowReport(false)}>
                  Cancel
                </Button>
                <Button variant="orange" full onClick={submitReport} disabled={!reportReason}>
                  Submit report
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline-orange" full onClick={() => setShowReport(true)}>
              <IconFlag size={16} /> Report an issue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SafetyPage() {
  return (
    <RequireAuth>
      <SafetyContent />
    </RequireAuth>
  );
}

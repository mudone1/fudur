"use client";

import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";

export default function TopNav({
  title,
  showBack = true,
  action,
}: {
  title: string;
  showBack?: boolean;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <nav className="sticky top-0 z-20 flex h-nav items-center gap-3 border-b border-border bg-white px-4">
      {showBack ? (
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface"
          aria-label="Go back"
        >
          <IconArrowLeft size={18} />
        </button>
      ) : (
        <div className="w-9" />
      )}
      <span className="flex-1 text-center text-base font-semibold">
        {title}
      </span>
      <div className="w-9 flex-shrink-0">{action}</div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconChartBar,
  IconBell,
  IconUser,
} from "@tabler/icons-react";
import clsx from "@/lib/clsx";

const items = [
  { href: "/driver/dashboard", label: "Home", Icon: IconHome },
  { href: "/driver/earnings", label: "Earnings", Icon: IconChartBar },
  { href: "/driver/notifications", label: "Alerts", Icon: IconBell },
  { href: "/driver/profile", label: "Profile", Icon: IconUser },
];

export default function DriverBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex h-bottom-nav items-center justify-around border-t border-border bg-white px-2 pb-1">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2",
              active ? "text-orange" : "text-muted"
            )}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

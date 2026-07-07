"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import DriverBottomNav from "@/components/layout/DriverBottomNav";

export default function DriverNotificationsPage() {
  return (
    <RequireAuth driverOnly>
      <div className="pb-24">
        <TopNav title="Notifications" showBack={false} />
        <div className="p-6 text-center text-sm text-muted">
          No notifications yet.
        </div>
        <DriverBottomNav />
      </div>
    </RequireAuth>
  );
}

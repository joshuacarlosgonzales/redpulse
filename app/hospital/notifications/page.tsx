"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import HospitalNotification from "@/components/hospital/HospitalNotification";

export default function HospitalNotificationsPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Fallback page background */}
      <div className="flex min-h-screen items-center justify-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
        >
          <Bell className="h-4 w-4" />
          Open Notifications
        </button>
      </div>

      <HospitalNotification
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
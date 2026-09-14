"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import {
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";

import { HospitalNavbar } from "@/components/layouts/HospitalNavbar";
import { HospitalSidebar } from "@/components/layouts/HospitalSidebar";

import HospitalProfileModal from "@/components/hospital/HospitalProfileModal";
import { HospitalSetupModal } from "@/components/hospital/HospitalSetupModal";
import { Footer } from "@/components/layouts/Footer";

// Inner component that has access to sidebar state
function HospitalLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  /*
   * =========================================================
   * STANDALONE NOTIFICATIONS PAGE
   * =========================================================
   */

  const isNotificationsPage = pathname === "/hospital/notifications";

  const handleProfileUpdate = () => {
    // Hospital profile can be refreshed here if needed.
  };

  const handleSetupComplete = () => {
    // Hospital profile can be refreshed here if needed.
  };

  /*
   * =========================================================
   * NOTIFICATIONS PAGE
   * =========================================================
   */

  if (isNotificationsPage) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        {children}
      </div>
    );
  }

  /*
   * =========================================================
   * NORMAL HOSPITAL LAYOUT
   * =========================================================
   */

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-black">

      {/* =================================================
          HOSPITAL SIDEBAR - Fixed height
      ================================================= */}

      <div className="flex h-screen flex-shrink-0">
        <HospitalSidebar />
      </div>

      {/* =================================================
          MAIN AREA - Takes remaining space
      ================================================= */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* =================================================
            NAVBAR - Full width
        ================================================= */}

        <HospitalNavbar />

        {/* =================================================
            CONTENT - Scrollable
        ================================================= */}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
            {children}
          </div>
        </main>

        {/* =================================================
            FOOTER
        ================================================= */}

        <Footer />
      </div>

      {/* =================================================
          PROFILE MODAL
      ================================================= */}

      <HospitalProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdate={handleProfileUpdate}
      />

      {/* =================================================
          SETUP MODAL
      ================================================= */}

      <HospitalSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSetupComplete={handleSetupComplete}
      />
    </div>
  );
}

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <HospitalLayoutContent>{children}</HospitalLayoutContent>
    </SidebarProvider>
  );
}
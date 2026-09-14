"use client";

import { Sidebar } from "@/components/layouts/Sidebar";
import { Navbar } from "@/components/layouts/Navbar";
import { Footer } from "@/components/layouts/Footer";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/* =========================================================
   ADMIN CONTENT
   This component must be inside SidebarProvider so that
   useSidebar() can control the real sidebar.
========================================================= */

function AdminLayoutContent({
  children,
}: AdminLayoutProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-black">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar />

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* ===================================================
            NAVBAR

            Pass toggleSidebar to Navbar so the hamburger
            button controls the actual SidebarProvider.
        =================================================== */}

        <Navbar onMenuClick={toggleSidebar} />

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5 lg:p-6">
            {children}
          </div>
        </main>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <Footer />
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN LAYOUT
========================================================= */

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}
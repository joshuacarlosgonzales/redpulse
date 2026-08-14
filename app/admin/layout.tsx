"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layouts/Sidebar";
import { Navbar } from "@/components/layouts/Navbar";
import { Footer } from "@/components/layouts/Footer";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
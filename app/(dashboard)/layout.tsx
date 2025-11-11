
"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PromptBar from "@/components/PromptBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-black text-white flex min-h-screen">
      {/* Sidebar - Fixed */}
      <div className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-800 bg-zinc-950 z-40">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-lg">
          <Header />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-2 pb-48">{children}</main>

        {/* Fixed PromptBar */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
          <PromptBar />
        </div>
      </div>
    </div>
  );
}


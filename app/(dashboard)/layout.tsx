"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PromptBar from "@/components/PromptBar";
import { useState } from "react";
import { usePathname } from "next/navigation";
export default function DashboardLayout({ children }: any) {
  const [loading, setLoading] = useState(false);
  const [numberOfImages, setNumberOfImages] = useState(1);
  const pathname = usePathname();
  const pageName = pathname.split("/")[1] || "Explore";
  return (
    <div className="bg-black text-white flex min-h-screen">
      <div className="fixed left-0 top-0 h-screen w-54 bg-black z-40">
        <Sidebar />
      </div>

      <div className="flex-1 ml-54 flex flex-col min-h-screen relative">
        <div className="sticky top-0 w-full flex justify-end z-30">
          <Header loading={loading} numberOfImages={numberOfImages} />
        </div>

        <main className="flex-1 -mt-18 overflow-y-auto pb-48">
          <h1 className="text-lg font-semibold px-6 py-5 capitalize">{pageName}</h1>
          {children}
        </main>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
          <PromptBar
            loading={loading}
            setLoading={setLoading}
            numberOfImages={numberOfImages}
            setNumberOfImages={setNumberOfImages}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { Bell, User } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const pageName = pathname.split("/")[1] || "Explore";

  return (
    <header className="flex items-center justify-between px-6 py-4 backdrop-blur">
      <h1 className="text-lg font-semibold capitalize">{pageName}</h1>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-zinc-800 rounded-full">
          <Bell className="w-5 h-5 text-zinc-400" />
        </button>
        <button className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold">
          U
        </button>
      </div>
    </header>
  );
}

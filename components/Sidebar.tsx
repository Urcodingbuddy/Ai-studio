"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Image, Star, Heart } from "lucide-react";

const navItems = [
  { name: "Explore", icon: Compass, href: "/explore" },
  { name: "Images", icon: Image, href: "/images" },
  { name: "Top", icon: Star, href: "/top" },
  { name: "Likes", icon: Heart, href: "/likes" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 p-4 flex flex-col">
      <div className="text-2xl font-bold tracking-tight mb-8 text-white">
        AI Studio
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

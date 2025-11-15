"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, User } from "lucide-react";
import { usePathname } from "next/navigation";

interface HeaderProps {
  loading: boolean;
  numberOfImages: number;
}

export default function Header({ loading, numberOfImages }: HeaderProps) {
  const [showDot, setShowDot] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame: NodeJS.Timeout;

    if (loading) {
      setProgress(0);

      const minTime = 45000; // 45 sec
      const maxTime = 90000; // 90 sec
      const totalDuration =
        Math.floor(Math.random() * (maxTime - minTime)) + minTime;

      const start = Date.now();

      const tick = () => {
        const elapsed = Date.now() - start;
        const pct = Math.min((elapsed / totalDuration) * 100, 95);
        setProgress(pct);

        if (pct < 95 && loading) frame = setTimeout(tick, 150);
      };

      tick();
    }

    if (!loading && progress < 100) {
      const finish = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(finish);
            setShowDot(true);
            return 100;
          }
          return p + 3;
        });
      }, 50);
    }

    return () => clearTimeout(frame);
  }, [loading]);

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        {loading ? (
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90deg" viewBox="0 0 36 36">
              <path
                d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"
                fill="none"
                stroke="#333"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"
                fill="none"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="100"
                strokeDashoffset={100 - progress}
                className="transition-all duration-150"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
              {numberOfImages}
            </div>
          </div>
        ) : (
          <button
            className="relative p-1.5 group bg-black rounded-full transition"
            onClick={() => setShowDot(false)}
          >
            <div className="p-1 rounded-full group-hover:bg-zinc-500">
              <Bell className="w-5 h-5 text-white" />
              {showDot && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
          </button>
        )}

        <button className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-sm font-bold">
          <img
            src="https://lh3.googleusercontent.com/a/ACg8ocJgz92ndqaUxVRp_mGFt72-BtqdTt2nwVdi_pb3NfynFaI0ceOQ=s96-c"
            alt="U"
            className="w-8 h-8 rounded-full object-cover"
          />
        </button>
      </div>
    </header>
  );
}

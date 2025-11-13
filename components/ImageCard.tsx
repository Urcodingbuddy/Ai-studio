"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { getOptimizedImageUrl, type Generation } from "@/lib/images/fetch";

export default function ImageCard({
  img,
  user_id,
}: {
  img: Generation;
  user_id: string | null;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [heartKey, setHeartKey] = useState(0);

  // UI states
  const [liked, setLiked] = useState<boolean>(img.user_liked ?? false);
  const [likeCount, setLikeCount] = useState<number>(img.like_count ?? 0);

  // debouncing refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastActionRef = useRef<boolean>(liked);

  // Check initial like status on mount
  useEffect(() => {
    if (!user_id) return;

    async function checkLike() {
      const res = await fetch(
        `/api/likes?user_id=${user_id}&generation_id=${img.id}`
      );
      const result = await res.json();
      setLiked(result.liked);
      lastActionRef.current = result.liked;
    }

    checkLike();
  }, [img.id, user_id]);

  // Lazy load observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0.01 }
    );

    if (imgRef.current) obs.observe(imgRef.current);

    return () => obs.disconnect();
  }, []);

  const sendLikeRequest = useCallback(async () => {
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        body: JSON.stringify({ generation_id: img.id }),
      });

      const data = await res.json();

      lastActionRef.current = data.liked;
    } catch (err) {
      console.error("Like API error:", err);

      // rollback on error
      setLiked(lastActionRef.current);
      setLikeCount((prev) =>
        lastActionRef.current ? prev + 1 : Math.max(0, prev - 1)
      );
    }
  }, [img.id]);

  const toggleLike = () => {
    const newState = !liked;

    // Optimistic UI update
    setLiked(newState);
    setLikeCount((c) => (newState ? c + 1 : Math.max(0, c - 1)));

    if (newState) {
      setShowHeartBurst(true);
      setHeartKey((prev) => prev + 1);
      setTimeout(() => setShowHeartBurst(false), 800);
    }

    // Save latest state
    lastActionRef.current = newState;

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Debounce API call for 600ms
    debounceRef.current = setTimeout(() => {
      sendLikeRequest();
    }, 600);
  };

  const dottedLoader = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      @keyframes dotsDrop {
        0% {
          transform: translateY(-${h}px);
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateY(${h}px);
          opacity: 0;
        }
      }
    </style>
  </defs>
  <rect width="${w}" height="${h}" fill="#18181b" />
  
  <!-- Dots falling animation -->
  <g id="dots" style="animation: dotsDrop 2s infinite;">
    <circle cx="${
      w / 2
    }" cy="20" r="3" fill="#52525b" style="animation: dotsDrop 2s infinite; animation-delay: 0s;" />
    <circle cx="${
      w / 2
    }" cy="20" r="3" fill="#52525b" style="animation: dotsDrop 2s infinite; animation-delay: 0.2s;" />
    <circle cx="${
      w / 2
    }" cy="20" r="3" fill="#52525b" style="animation: dotsDrop 2s infinite; animation-delay: 0.4s;" />
    <circle cx="${
      w / 2
    }" cy="20" r="3" fill="#52525b" style="animation: dotsDrop 2s infinite; animation-delay: 0.6s;" />
    <circle cx="${
      w / 2
    }" cy="20" r="3" fill="#52525b" style="animation: dotsDrop 2s infinite; animation-delay: 0.8s;" />
  </g>
</svg>`;

  const toBase64 = (str: string) =>
    typeof window === "undefined"
      ? Buffer.from(str).toString("base64")
      : window.btoa(str);

  return (
    <div
      ref={imgRef}
      className="relative mb-2 break-inside-avoid group overflow-hidden rounded-lg"
    >
      {isVisible ? (
        <>
          <Image
            src={
              getOptimizedImageUrl(img.image_path, 400) || "/placeholder.svg"
            }
            alt={img.title || "Generated"}
            width={400}
            height={400}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(
              dottedLoader(400, 400)
            )}`}
            unoptimized
          />

          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {showHeartBurst && (
            <div
              key={heartKey}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                className="heart-burst"
                style={{
                  animation:
                    "heartBurst 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                }}
              >
                <defs>
                  <linearGradient
                    id="heartGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#00F0FF" stopOpacity="1" />
                    <stop offset="40%" stopColor="#FFE500" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FF58E4" stopOpacity="1" />
                  </linearGradient>
                  <filter id="heartGlow">
                    {/* <feGaussianBlur stdDeviation="3" result="coloredBlur" /> */}
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Heart path with vibrant gradient fill */}
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="url(#heartGradient)"
                  filter="url(#heartGlow)"
                  strokeWidth="0"
                />
              </svg>
              <style>{`
                @keyframes heartBurst {
                        0% {
                        transform: scale(0.5) rotateZ(0deg);
                        opacity: 1;
                        }
                        10% {
                        transform: scale(0.8) rotateZ(3deg);
                        opacity: 1;
                        }
                        20% {
                        transform: scale(1.1) rotateZ(5deg);
                        opacity: 1;
                        }
                        30% {
                        transform: scale(1.2) rotateZ(2deg);
                        opacity: 1;
                        }
                        40% {
                        transform: scale(1.25) rotateZ(-3deg);
                        opacity: 1;
                        }
                        50% {
                        transform: scale(1.3) rotateZ(1deg);
                        opacity: 1;
                        }
                        65% {
                        transform: scale(1.35) rotateZ(-2deg);
                        opacity: 1;
                        }
                        80% {
                        transform: scale(1.4) rotateZ(1deg);
                        opacity: 1;
                        }
                        100% {
                        transform: scale(1.5) rotateZ(0deg);
                        opacity: 0;
                    }
                }
                .heart-burst {
                  will-change: transform;
                  fill: none;
                }
              `}</style>
            </div>
          )}

          <div className="absolute select-none bottom-0 left-0 right-0 p-3 flex justify-between items-center transition-all duration-300">
            <p className="text-xs text-zinc-200 truncate max-w-[70%] font-medium">
              {img.enhanced_prompt || img.original_prompt || "AI Generated"}
            </p>

            <div
              onClick={toggleLike}
              className="flex items-center gap-1.5 px-3 py-2 cursor-pointer rounded-full backdrop-blur-0 group-hover:backdrop-blur-md group-hover:bg-white/10 group-hover:border group-hover:border-white/20 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <Heart
                className={`w-5 h-5 transition-all duration-300 ${
                  liked
                    ? "text-red-500 drop-shadow-lg"
                    : "text-zinc-300 hover:text-red-400"
                }`}
                fill={liked ? "currentColor" : "none"}
              />
              <span className="text-sm font-semibold text-zinc-100 min-w-fit">
                {likeCount}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full aspect-square bg-zinc-900 animate-pulse" />
      )}
    </div>
  );
}

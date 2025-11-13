"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Heart, Loader2 } from "lucide-react";
import {
  fetchImages,
  getOptimizedImageUrl,
  type Generation,
} from "@/lib/images/fetch";
import { useUser } from "@/lib/auth/useUser";
import ImageCard from "@/components/ImageCard";

export default function ExplorePage() {
  const [images, setImages] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { user, loading: userLoading } = useUser();
  const ITEMS_PER_PAGE = 20;
  const loadImages = async (isInitial = false) => {
    if (!hasMore && !isInitial) return;

    try {
      isInitial ? setLoading(true) : setLoadingMore(true);

      const currentOffset = isInitial ? 0 : offset;

      const { data, error } = await fetchImages({
        orderBy: "created_at",
        ascending: false,
        limit: ITEMS_PER_PAGE,
        offset: currentOffset,
      });

      if (error) throw new Error(error);

      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      setImages((prev) => (isInitial ? data : [...prev, ...data]));
      setOffset(currentOffset + data.length);
    } catch (err: any) {
      console.error("Error fetching images:", err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadImages(true);
  }, []);

  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadImages();
        }
      },
      { threshold: 0.5, rootMargin: "200px" }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-zinc-500 text-center mt-20">No images found.</p>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-2 [column-fill:balance]">
              {images.map((img, index) => (
                <ImageCard
                  key={`${img.id}-${img.image_path}-${index}`}
                  img={img}
                  user_id={user?.id}
                />
              ))}
            </div>

            {hasMore && (
              <div
                ref={loadMoreRef}
                className="flex justify-center items-center py-8"
              >
                {loadingMore && (
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#27272a" offset="20%" />
      <stop stop-color="#3f3f46" offset="50%" />
      <stop stop-color="#27272a" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#18181b" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;






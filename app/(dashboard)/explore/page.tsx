"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import { Heart, Eye, Loader2 } from "lucide-react";

interface Generation {
  id: string;
  user_id: string;
  image_path: string;
  enhanced_prompt: string | null;
  created_at: string;
  like_count: number;
}

export default function ExplorePage() {
  const [images, setImages] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("generations")
        .select(
          "id, user_id, image_path, enhanced_prompt, created_at, like_count"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).flatMap((item) => {
        const urls = item.image_path.split(",");
        return urls.map((url: any) => ({
          ...item,
          image_path: url.trim(),
        }));
      });

      setImages(formatted);
    } catch (err: any) {
      console.error("Error fetching images:", err.message);
    } finally {
      setLoading(false);
    }
  }

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
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-2 [column-fill:balance]">
            {images.map((img) => (
              <div
                key={`${img.id}-${img.image_path}`}
                className="relative mb-2 break-inside-avoid group overflow-hidden"
              >
                <Image
                  src={img.image_path}
                  alt="Generated"
                  width={800}
                  height={800}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  unoptimized
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-zinc-300 truncate max-w-[75%]">
                    {img.enhanced_prompt || "AI Generated"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-zinc-400 hover:text-red-500 transition cursor-pointer" />
                    <Eye className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

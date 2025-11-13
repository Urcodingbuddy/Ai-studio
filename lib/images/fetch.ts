import { supabase } from "@/lib/supabase/client";

export interface Generation {
  id: string;
  user_id: string;
  image_path: string;
  original_prompt?: string | null;
  enhanced_prompt?: string | null;
  model?: string | null;
  aspect_ratio?: string | null;
  like_count?: number | null;
  created_at: string;
  title?: string | null;
  user_liked?: boolean;
}

export interface FetchImagesParams {
  userId?: string;
  model?: string;
  aspectRatio?: string;
  orderBy?: "created_at" | "like_count";
  ascending?: boolean;
  limit?: number;
  offset?: number;
}

export async function fetchImages(params: FetchImagesParams = {}) {
  const {
    userId,
    model,
    orderBy = "created_at",
    ascending = false,
    limit,
    offset = 0,
  } = params;

  try {
    let query = supabase
      .from("generations")
      .select(
        "id, user_id, image_path, original_prompt, enhanced_prompt, model, like_count, created_at, title"
      );

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (model) {
      query = query.eq("model", model);
    }

    query = query.order(orderBy, { ascending });

    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formatted = (data || []).flatMap((item) => {
      const urls = item.image_path.split(",");
      return urls.map((url: string) => ({
        ...item,
        image_path: url.trim(),
      }));
    });

    return { data: formatted, error: null };
  } catch (err: any) {
    console.error("Error fetching images:", err.message);
    return { data: [], error: err.message };
  }
}

export function getOptimizedImageUrl(url: string, width: number = 400): string {
  return url;
}

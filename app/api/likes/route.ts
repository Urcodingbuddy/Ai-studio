// app/api/likes/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/likes?generation_id=... 
 *   - returns { liked: boolean, like_count: number }
 *   - uses session user (if any). If no user, liked = false but like_count returned.
 *
 * POST /api/likes
 *   - body: { generation_id: string }
 *   - toggles like for authenticated user; returns { liked: boolean, like_count: number }
 */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const generation_id = url.searchParams.get("generation_id");
    if (!generation_id) {
      return NextResponse.json({ error: "generation_id is required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get authoritative like_count from generations table
    const { data: genData, error: genErr } = await supabase
      .from("generations")
      .select("like_count")
      .eq("id", generation_id)
      .single();

    if (genErr && genErr.code !== "PGRST116") {
      // PGRST116 often indicates no rows; fallback handled below
      console.warn("generations fetch error:", genErr);
    }

    const likeCount = (genData && genData.like_count) ?? 0;

    let liked = false;
    if (user) {
      const { data: existing, error: existingErr } = await supabase
        .from("likes")
        .select("user_id")
        .eq("generation_id", generation_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingErr) {
        console.warn("likes check error:", existingErr);
      } else {
        liked = !!existing;
      }
    }

    return NextResponse.json({ liked, like_count: likeCount });
  } catch (err: any) {
    console.error("GET /api/likes error:", err);
    return NextResponse.json({ error: err.message || "Unexpected" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const { generation_id } = await req.json();

    if (!generation_id) {
      return NextResponse.json({ error: "generation_id is required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user_id = user.id;

    // Check existing like
    const { data: existingLike } = await supabase
      .from("likes")
      .select("*")
      .eq("generation_id", generation_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (!existingLike) {
      // INSERT LIKE
      await supabase
        .from("likes")
        .insert({ user_id, generation_id });

      // INCREMENT like_count safely
      const { data: updatedGen } = await supabase
        .rpc("increment_like_count", { gid: generation_id });

      return NextResponse.json({
        liked: true,
        like_count: updatedGen ?? null,
      });
    }

    // REMOVE LIKE
    await supabase
      .from("likes")
      .delete()
      .eq("generation_id", generation_id)
      .eq("user_id", user_id);

    // DECREMENT like_count (never below 0)
    const { data: updatedGen } = await supabase
      .rpc("decrement_like_count", { gid: generation_id });

    return NextResponse.json({
      liked: false,
      like_count: updatedGen ?? null,
    });
  } catch (err: any) {
    console.error("POST /api/likes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

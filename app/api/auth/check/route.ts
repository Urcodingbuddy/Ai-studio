import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

async function verifyTurnstile(token: string | undefined, req: Request) {
  if (!token) {
    console.error("Turnstile token missing");
    return { ok: false, error: "no_token" };
  }

  const ip =
    req.headers.get("CF-Connecting-IP") ||
    req.headers.get("X-Forwarded-For") ||
    undefined;

  const form = new FormData();
  form.append("secret", process.env.CLOUDFLARE_TURNSTILE_SECRET!);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  try {
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );

    const json = await r.json();
    console.log("TURNSTILE RESPONSE:", json);

    return { ok: Boolean(json.success), error: json["error-codes"] ?? null };
  } catch (err: any) {
    console.error("Turnstile Exception:", err);
    return { ok: false, error: err.message };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("INCOMING BODY:", body);

    const email = body.email?.trim().toLowerCase();
    const token = body.turnstileToken;

    if (!email) {
      console.error("No email provided");
      return NextResponse.json(
        { error: "email_required" },
        { status: 400 }
      );
    }

    // TURNSTILE VALIDATION
    if (process.env.CLOUDFLARE_TURNSTILE_SECRET) {
      const result = await verifyTurnstile(token, req);

      if (!result.ok) {
        return NextResponse.json(
          { error: "turnstile_failed", detail: result.error },
          { status: 400 }
        );
      }
    }

    const supabase = await createServerSupabase();

    const { data: user, error: dbError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json(
        { error: "db_error", detail: dbError.message },
        { status: 500 }
      );
    }

    console.log("USER FOUND:", user);

    return NextResponse.json({ exists: Boolean(user) });
  } catch (err: any) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { error: "server_error", detail: err.message },
      { status: 500 }
    );
  }
}

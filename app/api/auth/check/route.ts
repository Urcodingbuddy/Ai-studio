import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

async function verifyTurnstile(token: string | undefined, req: Request) {
  if (!token) return false;

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
    if (!r.ok) return false;

    const json = await r.json();
    return Boolean(json.success);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  const token = body.turnstileToken;

  if (!email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  // LOCAL ENVIRONMENT → SKIP TURNSTILE
  const isLocal =
    req.headers.get("host")?.startsWith("localhost") ||
    req.headers.get("host")?.startsWith("127.0.0.1");

  if (!isLocal) {
    if (process.env.CLOUDFLARE_TURNSTILE_SECRET) {
      const valid = await verifyTurnstile(token, req);
      if (!valid) {
        return NextResponse.json(
          { error: "turnstile_failed" },
          { status: 400 }
        );
      }
    }
  } else {
    console.log("Turnstile skipped: Local environment");
  }

  const supabase = await createServerSupabase();

  const { data: user } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  return NextResponse.json({ exists: Boolean(user) });
}

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  const { data: record, error } = await supabase
    .from("email_otps")
    .select("otp, created_at, expires_at")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !record) {
    return NextResponse.json({ error: "no_otp" }, { status: 400 });
  }

  if (record.otp !== code) {
    return NextResponse.json({ error: "invalid_otp" }, { status: 400 });
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "expired_otp" }, { status: 400 });
  }

  return NextResponse.json({ verified: true });
}

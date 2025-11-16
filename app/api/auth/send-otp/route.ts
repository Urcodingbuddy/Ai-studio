import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const supabase = await createServerSupabase();

  const { error: dbError } = await supabase
    .from("email_otps")
    .insert({
      email: email.toLowerCase(),
      otp,
      created_at: new Date().toISOString(),
      expires_at: expires
    });

  if (dbError) {
    console.error("OTP DB INSERT ERROR:", dbError);
    return NextResponse.json({ error: "db_insert_failed" }, { status: 500 });
  }

  console.log("SendGrid not configured; OTP:", otp);

  return NextResponse.json({ ok: true });
}

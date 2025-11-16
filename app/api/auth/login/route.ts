import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  console.log("LOGIN: request received");
  try {
    const { email, password } = await req.json();
    console.log("LOGIN BODY:", { email, passwordPresent: !!password });

    if (!email || !password) {
      console.log("LOGIN ERROR: missing_fields");
      return NextResponse.json(
        { error: "missing_fields" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data: user, error: dbErr } = await supabase
      .from("profiles")
      .select("id, email, password_hash")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    console.log("USER FROM DB:", user, "DB ERROR:", dbErr);

    if (dbErr || !user) {
      console.log("LOGIN ERROR: user_not_found");
      return NextResponse.json(
        { error: "user_not_found" },
        { status: 400 }
      );
    }

    if (!user.password_hash) {
      console.log("LOGIN ERROR: no_password_hash_in_db");
      return NextResponse.json(
        { error: "no_password_set" },
        { status: 400 }
      );
    }

    const match = await bcrypt.compare(password, user.password_hash);
    console.log("PASSWORD MATCH:", match);

    if (!match) {
      console.log("LOGIN ERROR: invalid_password");
      return NextResponse.json(
        { error: "invalid_password" },
        { status: 400 }
      );
    }

    console.log("LOGIN: password correct, signing session...");

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInErr) {
      console.log("SESSION ERROR:", signInErr);
      return NextResponse.json(
        { error: "session_failed" },
        { status: 500 }
      );
    }

    console.log("LOGIN SUCCESS");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.log("LOGIN EXCEPTION:", err);
    return NextResponse.json(
      { error: "server_error", detail: err.message },
      { status: 500 }
    );
  }
}

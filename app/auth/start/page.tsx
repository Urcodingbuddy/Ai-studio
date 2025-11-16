"use client";

import { useState } from "react";
import Turnstile from "react-turnstile";

export default function StartAuthPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setResult("");

    const res = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, turnstileToken: token }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.status === "existing-user") {
      setResult("Existing user — show password form next.");
    } else if (data.status === "new-user") {
      setResult("New user — redirect to signup flow.");
    } else {
      setResult(data.error || "Unknown error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleSubmit}
        className="p-6 w-full max-w-sm bg-zinc-900 rounded-xl space-y-4"
      >
        <h1 className="text-xl font-semibold">Continue with Email</h1>

        <input
          type="email"
          placeholder="Enter email"
          className="w-full p-3 rounded bg-zinc-800 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="w-full bg-white/60 border rounded-full"></div>
        <div className="w-full flex flex-col justify-center items-center">
          <h6>Please verify you are not a robot</h6>
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onVerify={(token) => setToken(token)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-3 rounded bg-white text-black font-semibold disabled:bg-zinc-700"
        >
          {loading ? "Checking..." : "Continue"}
        </button>

        {result && <p className="text-sm text-zinc-300 pt-2">{result}</p>}
      </form>
    </div>
  );
}

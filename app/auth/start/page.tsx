"use client";

import { useState, useEffect, useRef } from "react";
import Turnstile from "react-turnstile";

export default function StartAuthPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const [stage, setStage] = useState<
    "email" | "verify-otp" | "login" | "signup"
  >("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleEmailSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, turnstileToken: token }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Unknown error");
      return;
    }

    if (data.exists === true) {
      setStage("login");
      return;
    }

    const otpRes = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!otpRes.ok) {
      const d = await otpRes.json().catch(() => ({}));
      setError(d?.error || "Failed to send OTP");
      return;
    }

    setStage("verify-otp");
  }

  function OtpBox({
    email,
    onVerified,
    onBackToEmail,
  }: {
    email: string;
    onVerified: () => void;
    onBackToEmail: () => void;
  }) {
    const [digits, setDigits] = useState(Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
      inputsRef.current[0]?.focus();
    }, []);

    function onChangeDigit(i: number, v: string) {
      if (!/^\d?$/.test(v)) return;
      const copy = [...digits];
      copy[i] = v;
      setDigits(copy);
      if (v && i < 5) inputsRef.current[i + 1]?.focus();
    }

    function onKey(e: React.KeyboardEvent, i: number) {
      if (e.key === "Backspace" && !digits[i] && i > 0) {
        inputsRef.current[i - 1]?.focus();
      }
    }

    async function verify() {
      const code = digits.join("");
      if (code.length !== 6) {
        setError("Enter 6-digit code");
        return;
      }

      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok || !data.verified) {
        setError(data.error || "Invalid code");
        setLoading(false);
        return;
      }

      onVerified();
    }

    async function resend() {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resend: true }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error || "Resend failed");
      }

      setLoading(false);
    }

    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Create new account</h1>
        <p className="text-sm text-zinc-400">{email}</p>

        <div className="flex gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              value={d}
              onChange={(e) => onChangeDigit(i, e.target.value.trim())}
              onKeyDown={(e) => onKey(e, i)}
              className="w-12 h-12 text-center rounded bg-zinc-800"
              inputMode="numeric"
              maxLength={1}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={verify}
            disabled={loading}
            className="px-4 py-2 bg-white text-black rounded"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

          <button
            onClick={resend}
            disabled={loading}
            className="px-3 py-2 rounded border"
          >
            Resend
          </button>
        </div>

        <button
          onClick={onBackToEmail}
          className="text-sm text-zinc-400 underline"
        >
          Change email
        </button>
      </div>
    );
  }

  async function handleLogin() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "login_failed");
      return;
    }

    window.location.href = "/dashboard"; // after login
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="p-6 w-full max-w-sm bg-zinc-900 rounded-xl space-y-4">
        {}
        {stage === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <h1 className="text-xl font-semibold">Continue with Email</h1>

            <input
              type="email"
              placeholder="Enter email"
              className="w-full p-3 rounded bg-zinc-800 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="w-full border-t border-zinc-700" />

            <div className="w-full flex flex-col justify-center items-center">
              <h6>Please verify you are not a robot</h6>

              <Turnstile
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onVerify={(t) => setToken(t)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded bg-white text-black font-semibold disabled:bg-zinc-700"
            >
              {loading ? "Checking..." : "Continue"}
            </button>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        )}

        {}
        {stage === "verify-otp" && (
          <OtpBox
            email={email}
            onVerified={() => setStage("signup")}
            onBackToEmail={() => setStage("email")}
          />
        )}

        {}
        {stage === "login" && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="text-sm text-zinc-400">{email}</p>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full p-3 rounded bg-zinc-800 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded bg-white text-black font-semibold"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <button
              onClick={() => setStage("email")}
              className="text-sm text-zinc-400 underline w-full text-center"
            >
              Change email
            </button>
          </div>
        )}

        {}
        {stage === "signup" && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Create new account</h1>
            <p className="text-sm text-zinc-400">{email}</p>

            <input
              type="password"
              placeholder="Create password"
              className="w-full p-3 rounded bg-zinc-800 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm password"
              className="w-full p-3 rounded bg-zinc-800 outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button className="w-full py-3 rounded bg-white text-black font-semibold">
              Create Account
            </button>

            <button
              onClick={() => setStage("email")}
              className="text-sm text-zinc-400 underline w-full text-center"
            >
              Change email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

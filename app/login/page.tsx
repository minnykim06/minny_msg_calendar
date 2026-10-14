"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-5xl mb-3">🌙♡☀️</div>
      <h1 className="text-2xl font-semibold mb-1">minny &amp; msg</h1>
      <p className="text-sm text-[#3A2E2A]/60 mb-8">San Diego ⟷ Seoul</p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-paper rounded-xl2 shadow-cozy p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#3A2E2A]/70" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-minny/40"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#3A2E2A]/70" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-minny/40"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-minny text-white py-2.5 font-medium disabled:opacity-60 transition-opacity"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-xs text-[#3A2E2A]/40 mt-6 text-center max-w-sm px-6">
        This app is just for the two of us — accounts are created ahead of
        time, there&apos;s no public sign-up.
      </p>
    </div>
  );
}

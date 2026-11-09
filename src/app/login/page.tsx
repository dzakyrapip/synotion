
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login gagal.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-6 py-12">

      {/* Background Image */}
      <div
        className="absolute inset-0 scale-105 bg-[url('/images/background_def.jpeg')] bg-cover bg-center blur-md"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Login Content */}
      <div className="relative z-10 w-full max-w-md">

        {/* Brand */}
        <a
          href="/"
          className="block text-center text-3xl font-bold text-blue-400"
        >
          synotion<span className="text-orange-400">.a</span>
        </a>

        <p className="mt-2 text-center text-xs font-semibold tracking-[0.25em] text-white/60">
          ADMINISTRATION PANEL
        </p>

        {/* Login Card */}
        <div className="mt-10 rounded-3xl border border-white/20 bg-white/90 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">
              Welcome Back!
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to manage your class website.
            </p>
          </div>

          {/* FORM LOGIN */}
          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-500"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Authorized access only.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-white/50">
          © 2026 synotion.a
        </p>

      </div>
    </main>
  );
}

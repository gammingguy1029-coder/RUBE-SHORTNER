"use client";
import { useState } from "react";

export default function LoginForm() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  async function submit() {
    if (!pw) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) location.reload();
      else setErr(data.error ?? "Invalid password");
    } catch {
      setErr("Network error. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <p className="text-sm text-neutral-500 mt-1">Enter your admin password to manage links.</p>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900/30 p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-neutral-400">Password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 pr-16 text-sm focus:outline-none focus:border-neutral-600"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-1 top-1 bottom-1 px-3 text-xs text-neutral-500 hover:text-neutral-300"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button
          onClick={submit}
          disabled={loading || !pw}
          className="w-full bg-white text-black rounded px-3 py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition"
        >
          {loading ? "Checking..." : "Login"}
        </button>
        {err && (
          <p className="text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded px-3 py-2" role="alert">
            {err}
          </p>
        )}
      </div>
    </div>
  );
}

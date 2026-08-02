"use client";
import { useState } from "react";

export default function LoginForm() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setErr("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setLoading(false);
    if (res.ok) location.reload();
    else setErr((await res.json()).error ?? "Error");
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Admin Login</h1>
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Password"
        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="bg-white text-black rounded px-3 py-2 font-medium disabled:opacity-50"
      >
        {loading ? "..." : "Login"}
      </button>
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}

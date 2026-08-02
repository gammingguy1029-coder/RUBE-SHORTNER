"use client";
import { useState } from "react";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    setErr("");
    setResult("");
    const res = await fetch("/api/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    setLoading(false);
    const data = await res.json();
    if (res.ok) {
      setResult(data.url);
      setUrl("");
    } else {
      setErr(data.error ?? "Error");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Create Link</h1>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://destination.com"
        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2"
      />
      <button
        onClick={create}
        disabled={loading || !url}
        className="bg-white text-black rounded px-3 py-2 font-medium disabled:opacity-50"
      >
        {loading ? "..." : "Create"}
      </button>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      {result && (
        <p className="text-green-400 text-sm break-all">
          {result}
        </p>
      )}
    </div>
  );
}

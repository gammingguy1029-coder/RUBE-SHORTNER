"use client";
import { useState, useEffect, useCallback } from "react";
import CountUp from "@/app/components/CountUp";

type LinkRow = {
  id: string;
  short_code: string;
  destination_url: string;
  views: number;
  enabled: boolean;
  created_at: string;
};

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const fetchLinks = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/links", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setLinks(data.links ?? []);
    } catch {}
    setListLoading(false);
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Debounce filter so a 200ms typing burst doesn't re-filter the table on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(filter), 200);
    return () => clearTimeout(t);
  }, [filter]);

  async function create() {
    if (!isValidUrl(url)) {
      setErr("Enter a valid http(s) URL");
      return;
    }
    setLoading(true);
    setErr("");
    setResult("");
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult(data.url);
        setUrl("");
        fetchLinks();
      } else {
        setErr(data.error ?? "Error");
      }
    } catch {
      setErr("Network error");
    }
    setLoading(false);
  }

  async function del(code: string) {
    if (!confirm(`Delete /${code}? This cannot be undone.`)) return;
    setActionLoading(code);
    try {
      const res = await fetch(`/api/links/${code}`, { method: "DELETE" });
      if (res.ok) fetchLinks();
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Failed to delete");
      }
    } catch {
      alert("Network error");
    }
    setActionLoading(null);
  }

  async function toggle(code: string, enabled: boolean) {
    setActionLoading(code);
    try {
      const res = await fetch(`/api/links/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (res.ok) fetchLinks();
    } catch {}
    setActionLoading(null);
  }

  function copy(text: string) {
    const cb = navigator.clipboard;
    if (!cb?.writeText) {
      // Fallback for http / old Safari — still copy via execCommand
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
      } catch {}
      return;
    }
    cb.writeText(text)
      .then(() => {
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => {});
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    location.reload();
  }

  const filtered = links.filter(
    (l) =>
      l.short_code.toLowerCase().includes(debouncedFilter.toLowerCase()) ||
      l.destination_url.toLowerCase().includes(debouncedFilter.toLowerCase())
  );
  const totalViews = links.reduce((a, b) => a + (b.views ?? 0), 0);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>
        <button onClick={logout} className="text-xs border border-neutral-700 rounded px-3 py-1.5 hover:bg-neutral-900 hover:border-neutral-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-900/60 hover:shadow-lg">
          <p className="text-xs text-neutral-500">Total links</p>
          <p className="text-xl font-semibold"><CountUp value={links.length} /></p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-900/60 hover:shadow-lg">
          <p className="text-xs text-neutral-500">Total views</p>
          <p className="text-xl font-semibold"><CountUp value={totalViews} /></p>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 flex flex-col gap-3 transition-colors duration-200 hover:border-neutral-700/60">
        <h2 className="text-sm font-medium">Create Link</h2>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="https://destination.com"
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600 transition-colors"
          />
          <button
            onClick={create}
            disabled={loading || !url}
            className="bg-white text-black rounded px-5 py-2 text-sm font-medium disabled:opacity-40 shrink-0 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] shimmer-btn disabled:hover:scale-100"
          >
            {loading ? "..." : "Create"}
          </button>
        </div>
        {err && <p className="text-red-400 text-sm animate-fadeIn">{err}</p>}
        {result && (
          <div className="flex items-center gap-2 bg-green-950/30 border border-green-900/40 rounded px-3 py-2 animate-popIn">
            <p className="text-green-400 text-sm break-all flex-1">{result}</p>
            <button
              onClick={() => copy(result)}
              aria-label="Copy short URL"
              className="text-xs bg-white text-black rounded px-2 py-1 shrink-0 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] inline-flex items-center gap-1"
            >
              {copied === result ? (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse-dot" />
                  Copied!
                </>
              ) : (
                "Copy"
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Your Links</h2>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search codes or URLs"
            className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs w-48 focus:outline-none focus:border-neutral-700"
          />
        </div>

        {listLoading ? (
          <div className="space-y-2">
            <div className="h-10 bg-neutral-900 rounded animate-pulse" />
            <div className="h-10 bg-neutral-900 rounded animate-pulse" />
            <div className="h-10 bg-neutral-900 rounded animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center border border-dashed border-neutral-800 rounded-lg">
            {links.length === 0 ? "No links yet. Create your first above." : "No matches."}
          </p>
        ) : (
          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-900/60 text-neutral-400 text-xs">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Short</th>
                    <th className="text-left px-3 py-2 font-medium">Destination</th>
                    <th className="text-center px-3 py-2 font-medium">Views</th>
                    <th className="text-center px-3 py-2 font-medium">Status</th>
                    <th className="text-right px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filtered.map((l, i) => {
                    const shortUrl = `${baseUrl}/${l.short_code}`;
                    return (
                      <tr
                        key={l.id}
                        className="hover:bg-neutral-900/30 transition-colors duration-150"
                        style={{ animation: `staggerIn 0.4s ease ${Math.min(i * 0.04, 0.3)}s both` }}
                      >
                        <td className="px-3 py-2">
                          <a href={shortUrl} target="_blank" rel="noopener" className="font-mono text-white hover:underline">
                            /{l.short_code}
                          </a>
                        </td>
                        <td className="px-3 py-2 max-w-[180px] truncate text-neutral-400" title={l.destination_url}>
                          {l.destination_url}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums">{l.views ?? 0}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => toggle(l.short_code, l.enabled)}
                            disabled={actionLoading === l.short_code}
                            className={`text-xs px-2 py-1 rounded-full border ${l.enabled ? "bg-green-950/40 border-green-900 text-green-400" : "bg-red-950/30 border-red-900 text-red-400"}`}
                          >
                            {l.enabled ? "Enabled" : "Disabled"}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => copy(shortUrl)}
                              aria-label={`Copy ${l.short_code}`}
                              className="text-xs border border-neutral-700 rounded px-2 py-1 hover:bg-neutral-800 transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] inline-flex items-center gap-1"
                            >
                              {copied === shortUrl ? (
                                <>
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse-dot" />
                                  Copied
                                </>
                              ) : (
                                "Copy"
                              )}
                            </button>
                            <button
                              onClick={() => del(l.short_code)}
                              disabled={actionLoading === l.short_code}
                              className="text-xs border border-red-900/50 text-red-400 rounded px-2 py-1 hover:bg-red-950/30 disabled:opacity-40 transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

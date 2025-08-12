"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function DbSwitchPage() {
  const [activeDb, setActiveDb] = useState("db1");
  const [maintenance, setMaintenance] = useState(false);
  const [target, setTarget] = useState("db1");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      setActiveDb(data.activeDb || "db1");
      setMaintenance(!!data.maintenance);
      setTarget(data.activeDb || "db1");
    } catch (_) {}
  };

  useEffect(() => {
    load();
  }, []);

  const switchDb = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/active-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Placeholder admin gate; replace with proper auth
          "x-admin": "true",
        },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to switch");
      setMsg(`Switched to ${data.activeDb}`);
      await load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto bg-white/80 dark:bg-gray-900/50 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold tracking-tight">
              Active DB Switch
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Current</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent/20 text-primary border border-accent">
                {activeDb}
              </span>
              <span className="text-sm text-gray-500 ml-2">Maintenance</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  maintenance
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "bg-green-100 text-green-800 border-green-200"
                }`}
              >
                {maintenance ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Choose the target database and click Switch. The system briefly
            enters maintenance while warming the new connection.
          </p>

          <fieldset className="mb-6">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Target database
            </legend>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="db"
                  value="db1"
                  checked={target === "db1"}
                  onChange={() => setTarget("db1")}
                  className="accent-accent"
                />
                <span className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
                  DB1
                </span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="db"
                  value="db2"
                  checked={target === "db2"}
                  onChange={() => setTarget("db2")}
                  className="accent-accent"
                />
                <span className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
                  DB2
                </span>
              </label>
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <button
              onClick={switchDb}
              disabled={loading || target === activeDb}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              title={target === activeDb ? "Already active" : "Switch database"}
            >
              {loading ? "Switching..." : "Switch"}
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
            >
              Refresh
            </button>
          </div>

          {msg && (
            <div
              className={`mt-4 text-sm px-3 py-2 rounded-md border ${
                msg.startsWith("Switched")
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

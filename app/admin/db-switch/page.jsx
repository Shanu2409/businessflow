"use client";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  FiDatabase,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";

export default function DbSwitchPage() {
  const [user, setUser] = useState(null);
  const [activeDb, setActiveDb] = useState("db1");
  const [maintenance, setMaintenance] = useState(false);
  const [target, setTarget] = useState("db1");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAdmin = useMemo(() => user?.type === "admin", [user]);

  const load = async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setActiveDb(data.activeDb || "db1");
        setMaintenance(!!data.maintenance);
        setTarget(data.activeDb || "db1");
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = sessionStorage.getItem("user");
      if (u) setUser(JSON.parse(u));
    }
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
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
      toast.success(`Switched to ${data.activeDb}`);
      await load();
    } catch (e) {
      setMsg(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const DbCard = ({ id, label }) => {
    const isActive = activeDb === id;
    const isSelected = target === id;
    return (
      <button
        onClick={() => setTarget(id)}
        className={`relative flex-1 min-w-[220px] p-5 rounded-xl border transition-all text-left shadow-sm hover:shadow-md ${
          isSelected
            ? "border-primary ring-2 ring-primary/20"
            : "border-gray-200 dark:border-gray-800"
        } ${
          isActive
            ? "bg-green-50/60 dark:bg-green-900/10"
            : "bg-white dark:bg-gray-900/40"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <FiDatabase />
          </div>
          <div>
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-lg font-semibold">{id.toUpperCase()}</div>
          </div>
        </div>
        {/* badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          {isActive && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
              <FiCheckCircle /> Active
            </span>
          )}
          {isSelected && !isActive && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Selected
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Database Control Center</h1>
            <p className="text-sm text-gray-600 mt-1">
              Flip the active database safely. During the flip, the system
              briefly enters maintenance mode.
            </p>
          </div>

          {/* Admin guard */}
          {!isAdmin ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <FiAlertTriangle className="mx-auto text-yellow-500" size={36} />
              <h2 className="mt-3 text-lg font-semibold">Admins only</h2>
              <p className="text-sm text-gray-600 mt-1">
                You don’t have permission to manage database switching.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status bar */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Active DB</span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent/20 text-primary border border-accent">
                    {activeDb.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Maintenance</span>
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
                <button
                  onClick={load}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
                >
                  <FiRefreshCw className={loading ? "animate-spin" : ""} />{" "}
                  Refresh
                </button>
              </div>

              {/* DB cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DbCard id="db1" label="Primary" />
                <DbCard id="db2" label="Secondary" />
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-600">
                    Target:{" "}
                    <strong className="text-gray-900">
                      {target.toUpperCase()}
                    </strong>
                  </div>
                  <div className="text-xs text-gray-500">
                    You’ll be asked to confirm before switching.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setConfirmOpen(true)}
                    disabled={loading || target === activeDb}
                    title={
                      target === activeDb ? "Already active" : "Switch database"
                    }
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Switching..." : "Switch Now"}
                  </button>
                </div>
              </div>

              {/* Helper notes */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold mb-2">Notes</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>
                    The system enters maintenance automatically during the
                    switch.
                  </li>
                  <li>
                    All write requests are blocked during maintenance; reads may
                    proceed.
                  </li>
                  <li>
                    Make sure background jobs are idempotent if they run during
                    the flip.
                  </li>
                </ul>
              </div>

              {/* Message banner */}
              {msg && (
                <div
                  className={`text-sm px-3 py-2 rounded-md border ${
                    msg.startsWith("Switched")
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {msg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 mt-0.5">
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-lg font-semibold">Confirm switch</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Switch active database from{" "}
                  <strong>{activeDb.toUpperCase()}</strong> to{" "}
                  <strong>{target.toUpperCase()}</strong>? The app may be
                  read-only for a few seconds.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-primary text-white hover:bg-secondary text-sm"
                onClick={switchDb}
                disabled={loading}
              >
                {loading ? "Switching..." : "Confirm Switch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

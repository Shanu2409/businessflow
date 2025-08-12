"use client";

import { useEffect, useState } from "react";

export default function MaintenanceBanner() {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    let alive = true;
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setMaintenance(!!data?.maintenance);
      } catch (_) {}
    };

    fetchHealth();
    const id = setInterval(fetchHealth, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!maintenance) return null;

  return (
    <div
      style={{
        background: "#fff3cd",
        color: "#856404",
        padding: "8px 12px",
        textAlign: "center",
        borderBottom: "1px solid #ffeeba",
        fontSize: 14,
      }}
    >
      Brief maintenance—please retry shortly.
    </div>
  );
}

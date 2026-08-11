"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-card border border-line px-3.5 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-black/[0.03] disabled:opacity-60"
    >
      {loading ? "Signing out…" : "Log out"}
    </button>
  );
}

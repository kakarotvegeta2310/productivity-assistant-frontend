"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("http://127.0.0.1:8000/health");
        const data = await res.json();
        setStatus(data.status);
      } catch {
        setStatus("backend not reachable");
      }
    }

    fetchStatus();
  }, []);

  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Productivity Assistant</h1>
        <p className="text-lg">Backend status: {status}</p>
      </div>
    </main>
  );
}
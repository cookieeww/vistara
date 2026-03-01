"use client";

import dynamic from "next/dynamic";

const CanvasWrapper = dynamic(() => import("@/components/CanvasWrapper"), {
  ssr: false,
  loading: () => (
    <div className="vistara-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0e14" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 700, background: "linear-gradient(135deg, #e94560, #9b59b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>
          Vistara
        </div>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>Initializing canvas…</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <CanvasWrapper />;
}

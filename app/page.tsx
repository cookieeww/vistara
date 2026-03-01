"use client";

import dynamic from "next/dynamic";

const CanvasWrapper = dynamic(() => import("@/components/CanvasWrapper"), {
  ssr: false,
  loading: () => (
    <div className="vistara-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0c0f15" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 36, fontWeight: 800,
          background: "linear-gradient(135deg, #4f8eff 0%, #7c5cff 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 16
        }}>
          Vistara
        </div>
        <div style={{ color: "#8892a4", fontSize: 14, fontWeight: 500 }}>Initializing canvas…</div>
        <div style={{
          marginTop: 24, width: 120, height: 3,
          background: "rgba(79, 142, 255, 0.15)",
          borderRadius: 100, overflow: "hidden",
          margin: "24px auto 0"
        }}>
          <div style={{
            width: "40%", height: "100%",
            background: "linear-gradient(90deg, #4f8eff, #7c5cff)",
            borderRadius: 100,
            animation: "loading 1.5s ease infinite"
          }} />
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <CanvasWrapper />;
}

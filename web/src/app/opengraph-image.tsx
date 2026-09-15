import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Buy Modafinil Reddit: What People Are Actually Searching For";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "64px 72px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#2d6a4f",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Modempic
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
          <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.15, color: "#0f172a" }}>
            {"Buy Modafinil Reddit: What People Are Actually Searching For"}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: "#475569" }}>
            Searching “Buy Modafinil Reddit”? See what people are actually trying to find.
          </div>
        </div>
        <div style={{ display: "flex", color: "#3d5a80", fontSize: 22, fontWeight: 600 }}>
          modempic.com
        </div>
      </div>
    ),
    { ...size },
  );
}

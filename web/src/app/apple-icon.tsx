import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2D6A4F",
          borderRadius: "40px",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 96,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          M
        </span>
      </div>
    ),
    {
      ...size,
    },
  );
}

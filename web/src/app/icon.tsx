import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "8px",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 20,
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

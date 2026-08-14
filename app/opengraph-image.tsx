import { ImageResponse } from "next/og";

export const alt =
  "TruHu, the work your best accounts get, for your whole book";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0F2A44",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "#FFFFFF",
              borderRadius: "14px 14px 0 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                background: "#38B000",
                borderRadius: "0 13px 0 13px",
              }}
            />
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 40, fontWeight: 700 }}>
            TruHu
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#FFFFFF",
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          <div>The work your clients see,</div>
          <div style={{ color: "#5FC15E" }}>produced by your team,</div>
          <div>at the speed of your whole book.</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#EAF1F9",
            fontSize: 26,
          }}
        >
          <div>TruHu Advisor</div>
          <div style={{ color: "#38B000" }}>·</div>
          <div>TruHu Workforce</div>
          <div style={{ color: "#38B000" }}>·</div>
          <div>Two products, bought separately</div>
        </div>
      </div>
    ),
    size,
  );
}

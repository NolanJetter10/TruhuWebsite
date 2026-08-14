import { ImageResponse } from "next/og";

export const alt =
  "TruHu, the AI benefits communication platform brokers trust most";
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
          background: "#050E1A",
          padding: 72,
        }}
      >
        {/* Stands in for the aurora on the live hero. */}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -120,
            width: 620,
            height: 620,
            borderRadius: 999,
            background: "radial-gradient(circle, #0582DC 0%, transparent 70%)",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -140,
            bottom: -200,
            width: 560,
            height: 560,
            borderRadius: 999,
            background: "radial-gradient(circle, #38B000 0%, transparent 70%)",
            opacity: 0.4,
          }}
        />

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
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
          }}
        >
          <div>The AI Benefits Communication</div>
          {/* Satori needs an explicit display on any node with more than one
              child, so the two-tone line is a flex row rather than a span. */}
          <div style={{ display: "flex", gap: 18 }}>
            <div>Platform</div>
            <div style={{ color: "#57D95E" }}>Brokers Trust Most</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, color: "#9DB2C7", fontSize: 26 }}>
          <div>Better guidance.</div>
          <div>Smarter enrollment.</div>
          <div style={{ color: "#38B6FF" }}>Cover your whole book.</div>
        </div>
      </div>
    ),
    size,
  );
}

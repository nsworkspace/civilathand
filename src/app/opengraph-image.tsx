import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Civil At Hand — Civil Engineering, Architectural Design and Consultancy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#07111f",
          color: "#f8fafc",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* Engineering blueprint background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.18,
            backgroundImage:
              "linear-gradient(rgba(96,165,250,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,.28) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Blueprint glow / drafting geometry */}
        <div
          style={{
            position: "absolute",
            right: -130,
            top: -180,
            width: 620,
            height: 620,
            display: "flex",
            border: "2px solid rgba(96,165,250,.18)",
            borderRadius: 310,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -90,
            width: 430,
            height: 430,
            display: "flex",
            border: "1px dashed rgba(249,115,22,.32)",
            borderRadius: 215,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 115,
            top: 65,
            width: 115,
            height: 115,
            display: "flex",
            border: "1px solid rgba(248,250,252,.16)",
            borderRadius: 58,
          }}
        />

        {/* Premium top accent */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 9,
            display: "flex",
            background:
              "linear-gradient(90deg, #f97316 0%, #fb923c 42%, #60a5fa 100%)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: "48px 62px 42px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* Geometric brand mark — no external asset dependency */}
            <div
              style={{
                width: 82,
                height: 82,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 22,
                borderRadius: 16,
                background: "#f97316",
                boxShadow: "0 12px 30px rgba(0,0,0,.32)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 58,
                  height: 58,
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid #ffffff",
                  borderRadius: 12,
                  color: "#ffffff",
                  fontSize: 25,
                  fontWeight: 900,
                  letterSpacing: -1,
                }}
              >
                CAH
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 50,
                  fontWeight: 900,
                  letterSpacing: -2,
                  lineHeight: 1,
                }}
              >
                CIVIL AT HAND
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  color: "#fb923c",
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: 3,
                }}
              >
                ENGINEERING • DESIGN • CONSULTANCY
              </div>
            </div>
          </div>

          {/* Hero copy */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 48,
              width: 790,
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#93c5fd",
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: 3,
                marginBottom: 13,
              }}
            >
              BUILD • DESIGN • DELIVER
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 43,
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: -1.2,
              }}
            >
              Complete Civil Engineering & Architectural Services
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 18,
                color: "#cbd5e1",
                fontSize: 20,
                lineHeight: 1.35,
                width: 760,
              }}
            >
              Structural design, architectural planning, BOQ estimation,
              BIM, CAD, quantity surveying and construction consultancy.
            </div>
          </div>

          {/* Right-side engineering badge */}
          <div
            style={{
              position: "absolute",
              right: 62,
              top: 196,
              width: 250,
              height: 170,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 22px",
              border: "1px solid rgba(148,163,184,.24)",
              borderRadius: 16,
              background: "rgba(7,17,31,.72)",
              boxShadow: "0 18px 45px rgba(0,0,0,.24)",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#f97316",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 2,
                marginBottom: 10,
              }}
            >
              ENGINEERED FOR
            </div>
            <div
              style={{
                display: "flex",
                color: "#ffffff",
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1.25,
              }}
            >
              Residential • Commercial • Industrial
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 12,
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              IS-code aligned engineering solutions
            </div>
          </div>

          {/* Footer chips */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "auto",
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              {["STRUCTURAL DESIGN", "BOQ & ESTIMATION", "BIM & CAD"].map(
                (item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      padding: "9px 13px",
                      border: "1px solid rgba(148,163,184,.25)",
                      borderRadius: 7,
                      color: "#e2e8f0",
                      fontSize: 12,
                      fontWeight: 800,
                      background: "rgba(15,39,69,.78)",
                    }}
                  >
                    {item}
                  </div>
                )
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: "auto",
                color: "#f8fafc",
                fontSize: 17,
                fontWeight: 800,
              }}
            >
              <span
                style={{
                  display: "flex",
                  width: 9,
                  height: 9,
                  borderRadius: 9,
                  background: "#f97316",
                  marginRight: 9,
                }}
              />
              civilathan.in
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

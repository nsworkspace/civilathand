"use client";

import { useEffect } from "react";

// This only fires if the root layout itself throws (very rare — e.g. a
// crash inside the top-level providers). It must render its own <html> and
// <body> because the normal layout may not have mounted. Kept intentionally
// simple and dependency-free so it can never itself fail to render.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0f172a", color: "#fff" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px" }}>
            Civil At Hand is temporarily unavailable
          </h1>
          <p style={{ color: "#94a3b8", maxWidth: "420px", marginBottom: "24px", fontSize: "14px" }}>
            Something went wrong loading the site. Please try again in a moment.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#f97316",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "12px 28px",
              fontWeight: 700,
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

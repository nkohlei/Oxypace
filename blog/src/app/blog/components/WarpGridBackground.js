"use client";

export default function WarpGridBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        backgroundColor: "var(--background)",
        transition: "background-color 0.2s ease",
      }}
    />
  );
}

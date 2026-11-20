import { Capacitor } from "@capacitor/core";

export default function WarpGridBackground() {
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        backgroundColor: "var(--background)",
        transition: "background-color 0.2s ease",
      }}
    />
  );
}

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

export default function WarpGridBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isNative = Capacitor.isNativePlatform();

    // Native mobile: smaller grid + 30fps cap to avoid killing the CPU
    const cols = isNative ? 16 : 28;
    const rows = isNative ? 16 : 28;
    const TARGET_FPS = isNative ? 30 : 60;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    let animationId;
    let lastFrameTime = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let time = 0;

    // Cache theme check — re-read only on a MutationObserver change, not every frame
    let isDark =
      !document.documentElement.classList.contains("light") &&
      document.documentElement.getAttribute("data-theme") !== "light";

    const themeObserver = new MutationObserver(() => {
      isDark =
        !document.documentElement.classList.contains("light") &&
        document.documentElement.getAttribute("data-theme") !== "light";
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const animate = (timestamp) => {
      animationId = requestAnimationFrame(animate);

      // Pause when tab/app is hidden — no wasted CPU
      if (document.hidden) return;

      // Throttle to TARGET_FPS
      if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = timestamp;

      time += isNative ? 0.004 : 0.003;

      // Background fill
      ctx.fillStyle = isDark ? "#050505" : "#FAF9F6";
      ctx.fillRect(0, 0, width, height);

      // Precompute grid points
      const centerX = width / 2;
      const centerY = height / 2;
      const spacingX = width / (cols - 1);
      const spacingY = height / (rows - 1);

      const points = [];
      for (let r = 0; r < rows; r++) {
        points[r] = [];
        for (let c = 0; c < cols; c++) {
          const x = c * spacingX;
          const y = r * spacingY;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const gravityWell = -120 * (1 / (1 + dist / 150));
          const wave = 25 * Math.sin(dist * 0.006 - time * 5) * (dist / (dist + 80));
          const z = gravityWell + wave;
          const fov = 350;
          const scale = fov / (fov + z);
          points[r][c] = { x: centerX + dx * scale, y: centerY + dy * scale };
        }
      }

      // Draw ALL horizontal lines in one batched path (was 1,176 individual strokes before)
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)";
      ctx.lineWidth = 0.8;

      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          ctx.moveTo(points[r][c].x, points[r][c].y);
          ctx.lineTo(points[r][c + 1].x, points[r][c + 1].y);
        }
      }
      ctx.stroke();

      // Draw ALL vertical lines in one batched path
      ctx.beginPath();
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.moveTo(points[r][c].x, points[r][c].y);
          ctx.lineTo(points[r + 1][c].x, points[r + 1][c].y);
        }
      }
      ctx.stroke();
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      themeObserver.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}

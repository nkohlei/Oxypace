import { useEffect, useRef } from "react";

export default function WarpGridBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const cols = 28;
    const rows = 28;
    let time = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const animate = () => {
      time += 0.003;

      // Dark vs Light theme check
      const isDark = document.documentElement.classList.contains("dark") || 
                     document.documentElement.getAttribute("data-theme") !== "light";

      // Background color: Pure Dark (#050505) vs Pure Light (#FAF9F6)
      ctx.fillStyle = isDark ? "#050505" : "#FAF9F6";
      ctx.fillRect(0, 0, width, height);

      // Line stroke
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)";
      ctx.lineWidth = 0.8;

      const points = [];
      const centerX = width / 2;
      const centerY = height / 2;
      const spacingX = width / (cols - 1);
      const spacingY = height / (rows - 1);

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

          const projX = centerX + dx * scale;
          const projY = centerY + dy * scale;

          points[r][c] = { x: projX, y: projY };
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c < cols - 1) {
            ctx.beginPath();
            ctx.moveTo(points[r][c].x, points[r][c].y);
            ctx.lineTo(points[r][c + 1].x, points[r][c + 1].y);
            ctx.stroke();
          }
          if (r < rows - 1) {
            ctx.beginPath();
            ctx.moveTo(points[r][c].x, points[r][c].y);
            ctx.lineTo(points[r + 1][c].x, points[r + 1][c].y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
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

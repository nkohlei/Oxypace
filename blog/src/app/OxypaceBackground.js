"use client";

import { useEffect, useRef } from "react";

// Rich, vivid classic colors (kırmızı, sarı, yeşil, mavi, mor, turuncu, camgöbeği, pembe, kehribar)
const REAL_COLORS = [
  { fill: "#EF4444", stroke: "#FCA5A5", name: "kırmızı" },
  { fill: "#FACC15", stroke: "#FEF08A", name: "sarı" },
  { fill: "#22C55E", stroke: "#BBF7D0", name: "yeşil" },
  { fill: "#3B82F6", stroke: "#BFDBFE", name: "mavi" },
  { fill: "#A855F7", stroke: "#E9D5FF", name: "mor" },
  { fill: "#F97316", stroke: "#FED7AA", name: "turuncu" },
  { fill: "#06B6D4", stroke: "#A5F3FC", name: "camgöbeği" },
  { fill: "#EC4899", stroke: "#FBCFE8", name: "pembe" },
  { fill: "#D97706", stroke: "#FDE68A", name: "kehribar" },
];

export default function OxypaceBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Cache pre-tinted offscreen logo canvases for all real colors + default white/silver
    const logoCanvases = {};
    let isLogosReady = false;

    const baseLogo = new Image();
    baseLogo.src = "/oxypace-ice-logo.png";
    baseLogo.onload = () => {
      try {
        const size = 48;

        // Default pure white/silver ice logo
        const silverCanvas = document.createElement("canvas");
        silverCanvas.width = size;
        silverCanvas.height = size;
        const sCtx = silverCanvas.getContext("2d");
        if (sCtx) {
          sCtx.drawImage(baseLogo, 0, 0, size, size);
          logoCanvases["silver"] = silverCanvas;
        }

        // Tinted versions for all real colors
        REAL_COLORS.forEach((col, idx) => {
          const c = document.createElement("canvas");
          c.width = size;
          c.height = size;
          const cCtx = c.getContext("2d");
          if (cCtx) {
            cCtx.drawImage(baseLogo, 0, 0, size, size);
            cCtx.globalCompositeOperation = "source-in";
            cCtx.fillStyle = col.fill;
            cCtx.fillRect(0, 0, size, size);
            logoCanvases[idx] = c;
          }
        });

        isLogosReady = true;
      } catch (_) {}
    };

    // Track mouse with fast velocity & instant color cycling
    const mouse = {
      x: -3000,
      y: -3000,
      targetX: -3000,
      targetY: -3000,
      radius: 200,
      radiusSq: 200 * 200,
      colorCycle: 0,
    };

    let prevX = -3000;
    let prevY = -3000;

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;

      const dist = Math.hypot(e.clientX - prevX, e.clientY - prevY);
      if (dist > 1 && dist < 500) {
        // Fast, highly responsive color shifting upon mouse movement
        mouse.colorCycle = (mouse.colorCycle + dist * 0.12) % REAL_COLORS.length;
      }
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -3000;
      mouse.targetY = -3000;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    let nodes = [];

    // 7 shape types distributed homogeneously across the entire screen:
    // 0: Oxypace Ice Logo Emblem
    // 1: 4-Point Star / Sparkle (✦)
    // 2: Precision Diamond (◆)
    // 3: Geometric Hexagon (⬡)
    // 4: Micro Crosshair (+)
    // 5: Tech Ring / Circle (○)
    // 6: Equilateral Triangle (▲)
    const SHAPE_COUNT = 7;

    const initGrid = (w, h) => {
      nodes = [];
      const spacing = w < 768 ? 42 : 50;
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = (c - 1) * spacing;
          const baseY = (r - 1) * spacing;

          // Mathematically uniform, homogeneous distribution:
          // No two adjacent shapes are the same in any direction!
          const shapeType = (r * 3 + c * 2) % SHAPE_COUNT;

          const phase = Math.random() * Math.PI * 2;
          // Faster, lively motion speed (2.0 - 3.5x faster than before)
          const speed = 2.0 + Math.random() * 1.4;
          const colorOffset = (r * 3 + c * 5) % REAL_COLORS.length;

          nodes.push({
            baseX,
            baseY,
            shapeType,
            phase,
            speed,
            colorOffset,
            currIntensity: 0,
          });
        }
      }
    };

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      initGrid(width, height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        animationId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const animate = (now) => {
      if (!isVisible) return;

      // Fast, snappy mouse catch-up
      mouse.x += (mouse.targetX - mouse.x) * 0.35;
      mouse.y += (mouse.targetY - mouse.y) * 0.35;

      // Pure solid deep canvas base
      ctx.fillStyle = "#020204";
      ctx.fillRect(0, 0, width, height);

      const timeSec = now * 0.001;
      const count = nodes.length;
      const rSq = mouse.radiusSq;
      const rInv = 1 / mouse.radius;

      for (let i = 0; i < count; i++) {
        const node = nodes[i];

        // Fast, multi-harmonic fluid floating motion
        const floatX =
          Math.sin(timeSec * node.speed + node.phase) * 4.2 +
          Math.cos(timeSec * (node.speed * 1.6) + node.phase) * 2.0;
        const floatY =
          Math.cos(timeSec * node.speed + node.phase) * 4.2 +
          Math.sin(timeSec * (node.speed * 1.6) + node.phase) * 2.0;

        const effectiveX = node.baseX + floatX;
        const effectiveY = node.baseY + floatY;

        const dx = mouse.x - effectiveX;
        const dy = mouse.y - effectiveY;
        const distSq = dx * dx + dy * dy;

        let targetIntensity = 0;
        let trackOffsetX = 0;
        let trackOffsetY = 0;

        if (distSq < rSq) {
          const dist = Math.sqrt(distSq);
          const ratio = 1 - dist * rInv;
          targetIntensity = ratio * ratio;

          // Strong springy magnetic attraction to cursor
          const pull = targetIntensity * 14;
          trackOffsetX = (dx / (dist + 0.001)) * pull;
          trackOffsetY = (dy / (dist + 0.001)) * pull;
        }

        // Fast intensity lerp for immediate visual response
        node.currIntensity += (targetIntensity - node.currIntensity) * 0.32;
        const intensity = node.currIntensity;

        const drawX = effectiveX + trackOffsetX;
        const drawY = effectiveY + trackOffsetY;

        // Vivid color under cursor:
        const activeColorIndex = Math.floor(
          (mouse.colorCycle + node.colorOffset) % REAL_COLORS.length
        );
        const activeColor = REAL_COLORS[activeColorIndex];

        const isHovered = intensity > 0.06;
        const scale = 1.0 + intensity * 0.85;

        // Render each of the 7 homogeneously distributed shape types:
        switch (node.shapeType) {
          case 0: {
            // 0: OXYPACE ICE LOGO EMBLEM
            if (isLogosReady && logoCanvases["silver"]) {
              const size = (isHovered ? 18 : 12) * scale;
              const logoToDraw =
                isHovered && logoCanvases[activeColorIndex]
                  ? logoCanvases[activeColorIndex]
                  : logoCanvases["silver"];

              ctx.globalAlpha = isHovered ? 0.98 : 0.22;
              ctx.drawImage(
                logoToDraw,
                drawX - size / 2,
                drawY - size / 2,
                size,
                size
              );
              ctx.globalAlpha = 1.0;
            }
            break;
          }

          case 1: {
            // 1: 4-POINT STAR / SPARKLE (✦)
            const rad = (isHovered ? 7.5 : 3.6) * scale;
            ctx.beginPath();
            for (let a = 0; a < 8; a++) {
              const ang = (a * Math.PI) / 4;
              const r = a % 2 === 0 ? rad : rad * 0.32;
              const px = drawX + Math.cos(ang) * r;
              const py = drawY + Math.sin(ang) * r;
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();

            if (isHovered) {
              ctx.fillStyle = activeColor.fill;
              ctx.fill();
              ctx.strokeStyle = activeColor.stroke;
              ctx.lineWidth = 1.4;
              ctx.stroke();
            } else {
              ctx.strokeStyle = "rgba(226, 232, 240, 0.20)";
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
            break;
          }

          case 2: {
            // 2: PRECISION DIAMOND (◆)
            const rad = (isHovered ? 5.5 : 2.8) * scale;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY - rad);
            ctx.lineTo(drawX + rad, drawY);
            ctx.lineTo(drawX, drawY + rad);
            ctx.lineTo(drawX - rad, drawY);
            ctx.closePath();

            if (isHovered) {
              ctx.fillStyle = activeColor.fill;
              ctx.fill();
              ctx.strokeStyle = activeColor.stroke;
              ctx.lineWidth = 1.4;
              ctx.stroke();
            } else {
              ctx.strokeStyle = "rgba(226, 232, 240, 0.20)";
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
            break;
          }

          case 3: {
            // 3: GEOMETRIC HEXAGON (⬡)
            const rad = (isHovered ? 6.2 : 3.2) * scale;
            ctx.beginPath();
            for (let a = 0; a < 6; a++) {
              const ang = (a * Math.PI) / 3;
              const px = drawX + Math.cos(ang) * rad;
              const py = drawY + Math.sin(ang) * rad;
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();

            if (isHovered) {
              ctx.fillStyle = activeColor.fill;
              ctx.fill();
              ctx.strokeStyle = activeColor.stroke;
              ctx.lineWidth = 1.4;
              ctx.stroke();
            } else {
              ctx.strokeStyle = "rgba(226, 232, 240, 0.20)";
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
            break;
          }

          case 4: {
            // 4: MICRO CROSSHAIR (+)
            const arm = (isHovered ? 6.5 : 3.2) * scale;
            ctx.beginPath();
            ctx.moveTo(drawX - arm, drawY);
            ctx.lineTo(drawX + arm, drawY);
            ctx.moveTo(drawX, drawY - arm);
            ctx.lineTo(drawX, drawY + arm);

            if (isHovered) {
              ctx.strokeStyle = activeColor.fill;
              ctx.lineWidth = 1.8;
              ctx.stroke();

              ctx.fillStyle = activeColor.stroke;
              ctx.fillRect(drawX - 1.5, drawY - 1.5, 3, 3);
            } else {
              ctx.strokeStyle = "rgba(226, 232, 240, 0.18)";
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
            break;
          }

          case 5: {
            // 5: TECH RING / CIRCLE (○)
            const rad = (isHovered ? 5.2 : 2.6) * scale;
            ctx.beginPath();
            ctx.arc(drawX, drawY, rad, 0, Math.PI * 2);

            if (isHovered) {
              ctx.strokeStyle = activeColor.fill;
              ctx.lineWidth = 1.6;
              ctx.stroke();

              ctx.fillStyle = activeColor.stroke;
              ctx.beginPath();
              ctx.arc(drawX, drawY, 2, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.strokeStyle = "rgba(226, 232, 240, 0.20)";
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
            break;
          }

          case 6:
          default: {
            // 6: EQUILATERAL TRIANGLE (▲)
            const rad = (isHovered ? 6.0 : 3.0) * scale;
            ctx.beginPath();
            for (let a = 0; a < 3; a++) {
              const ang = (a * 2 * Math.PI) / 3 - Math.PI / 2;
              const px = drawX + Math.cos(ang) * rad;
              const py = drawY + Math.sin(ang) * rad;
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();

            if (isHovered) {
              ctx.fillStyle = activeColor.fill;
              ctx.fill();
              ctx.strokeStyle = activeColor.stroke;
              ctx.lineWidth = 1.4;
              ctx.stroke();
            } else {
              ctx.strokeStyle = "rgba(226, 232, 240, 0.20)";
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
            break;
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="oxy-canvas-bg" />
      <div className="oxy-vignette" />
    </>
  );
}

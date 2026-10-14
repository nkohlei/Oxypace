"use client";

import { useEffect, useRef } from "react";

// Classic vivid, unmistakable real colors (sarı, kırmızı, yeşil, mavi, kahverengi, mor, turuncu, camgöbeği)
const REAL_COLORS = [
  { fill: "#EF4444", stroke: "#FCA5A5", name: "kırmızı" },
  { fill: "#FACC15", stroke: "#FEF08A", name: "sarı" },
  { fill: "#22C55E", stroke: "#BBF7D0", name: "yeşil" },
  { fill: "#3B82F6", stroke: "#BFDBFE", name: "mavi" },
  { fill: "#A855F7", stroke: "#E9D5FF", name: "mor" },
  { fill: "#B45309", stroke: "#FDE68A", name: "kahverengi" },
  { fill: "#F97316", stroke: "#FED7AA", name: "turuncu" },
  { fill: "#06B6D4", stroke: "#A5F3FC", name: "camgöbeği" },
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

    // Cache pre-tinted offscreen logo canvases for all 8 real colors + default silver
    const logoCanvases = {};
    let isLogosReady = false;

    const baseLogo = new Image();
    baseLogo.src = "/logo.png";
    baseLogo.onload = () => {
      try {
        const size = 32;
        // Default silver logo
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

    // Track mouse with velocity & color shift
    const mouse = {
      x: -3000,
      y: -3000,
      targetX: -3000,
      targetY: -3000,
      radius: 190,
      radiusSq: 190 * 190,
      colorCycle: 0,
    };

    let prevX = -3000;
    let prevY = -3000;

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;

      const dist = Math.hypot(e.clientX - prevX, e.clientY - prevY);
      if (dist > 2 && dist < 400) {
        // Cycling through the real colors upon mouse motion
        mouse.colorCycle = (mouse.colorCycle + dist * 0.04) % REAL_COLORS.length;
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

    const initGrid = (w, h) => {
      nodes = [];
      const spacing = w < 768 ? 44 : 52;
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = (c - 1) * spacing;
          const baseY = (r - 1) * spacing;

          // 3 shape types:
          // 0: Micro crosshair (+)
          // 1: Precision Diamond (◆)
          // 2: Oxypace Emblem Logo
          const rand = (r * 13 + c * 7) % 7;
          let shapeType = 0;
          if (rand === 1 || rand === 5) {
            shapeType = 2; // Logo emblem
          } else if (rand % 2 === 0) {
            shapeType = 1; // Diamond
          } else {
            shapeType = 0; // Crosshair
          }

          const phase = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 0.4;
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

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.22;
      mouse.y += (mouse.targetY - mouse.y) * 0.22;

      // Solid pitch black base
      ctx.fillStyle = "#020204";
      ctx.fillRect(0, 0, width, height);

      const timeSec = now * 0.001;
      const count = nodes.length;
      const rSq = mouse.radiusSq;
      const rInv = 1 / mouse.radius;

      for (let i = 0; i < count; i++) {
        const node = nodes[i];

        // Organic floating motion
        const floatX = Math.sin(timeSec * node.speed + node.phase) * 1.5;
        const floatY = Math.cos(timeSec * node.speed + node.phase) * 1.5;

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

          // Magnetic attraction to cursor
          const pull = targetIntensity * 6;
          trackOffsetX = (dx / (dist + 0.001)) * pull;
          trackOffsetY = (dy / (dist + 0.001)) * pull;
        }

        node.currIntensity += (targetIntensity - node.currIntensity) * 0.25;
        const intensity = node.currIntensity;

        const drawX = effectiveX + trackOffsetX;
        const drawY = effectiveY + trackOffsetY;

        // Determine color:
        // When active under cursor: distinct, rich, real colors (sarı, kırmızı, yeşil, mavi, mor, kahverengi...)
        const activeColorIndex = Math.floor((mouse.colorCycle + node.colorOffset) % REAL_COLORS.length);
        const activeColor = REAL_COLORS[activeColorIndex];

        const scale = 1.0 + intensity * 0.9;

        if (node.shapeType === 2 && isLogosReady && logoCanvases["silver"]) {
          // OXYPACE EMBLEM LOGO
          const size = (intensity > 0.08 ? 16 : 11) * scale;
          const logoToDraw = intensity > 0.08 && logoCanvases[activeColorIndex]
            ? logoCanvases[activeColorIndex]
            : logoCanvases["silver"];

          ctx.globalAlpha = intensity > 0.08 ? 0.95 : 0.20;
          ctx.drawImage(logoToDraw, drawX - size / 2, drawY - size / 2, size, size);
          ctx.globalAlpha = 1.0;
        } else if (node.shapeType === 1) {
          // PRECISION DIAMOND (◆)
          const rad = (intensity > 0.08 ? 4.5 : 2.5) * scale;
          ctx.beginPath();
          ctx.moveTo(drawX, drawY - rad);
          ctx.lineTo(drawX + rad, drawY);
          ctx.lineTo(drawX, drawY + rad);
          ctx.lineTo(drawX - rad, drawY);
          ctx.closePath();

          if (intensity > 0.08) {
            ctx.fillStyle = activeColor.fill;
            ctx.fill();
            ctx.strokeStyle = activeColor.stroke;
            ctx.lineWidth = 1.4;
            ctx.stroke();
          } else {
            ctx.strokeStyle = "rgba(226, 232, 240, 0.18)";
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        } else {
          // MICRO CROSSHAIR (+)
          const arm = (intensity > 0.08 ? 5.5 : 3.0) * scale;
          ctx.beginPath();
          ctx.moveTo(drawX - arm, drawY);
          ctx.lineTo(drawX + arm, drawY);
          ctx.moveTo(drawX, drawY - arm);
          ctx.lineTo(drawX, drawY + arm);

          if (intensity > 0.08) {
            ctx.strokeStyle = activeColor.fill;
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Center highlight pixel
            ctx.fillStyle = activeColor.stroke;
            ctx.fillRect(drawX - 1.5, drawY - 1.5, 3, 3);
          } else {
            ctx.strokeStyle = "rgba(226, 232, 240, 0.16)";
            ctx.lineWidth = 0.9;
            ctx.stroke();
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

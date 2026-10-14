"use client";

import { useEffect, useRef } from "react";

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

    // Pre-rendered offscreen canvas for micro-hat logo for ultra-high FPS blitting
    let offscreenLogo = null;
    let isLogoReady = false;

    const logoImg = new Image();
    logoImg.src = "/oxypace-glyph-logo.png";
    logoImg.onload = () => {
      try {
        const off = document.createElement("canvas");
        off.width = 36;
        off.height = 36;
        const offCtx = off.getContext("2d");
        if (offCtx) {
          offCtx.drawImage(logoImg, 0, 0, 36, 36);
          offscreenLogo = off;
          isLogoReady = true;
        }
      } catch (_) {}
    };

    // Track mouse with velocity & dynamic color hue
    const mouse = {
      x: -3000,
      y: -3000,
      targetX: -3000,
      targetY: -3000,
      radius: 175,
      radiusSq: 175 * 175,
      activeHue: 210, // Base metallic silver-blue
    };

    let prevMouseX = -3000;
    let prevMouseY = -3000;

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;

      // Mouse movement directly drives active color hue progression (Non-neon metallic cycle)
      const distMoved = Math.hypot(e.clientX - prevMouseX, e.clientY - prevMouseY);
      if (distMoved > 2 && distMoved < 600) {
        mouse.activeHue = (mouse.activeHue + distMoved * 0.45) % 360;
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -3000;
      mouse.targetY = -3000;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // Grid nodes structure
    let nodes = [];

    const initGrid = (w, h) => {
      nodes = [];
      // High-performance spacing (54px) ensures silky 120 FPS on all GPUs/CPUs
      const spacing = w < 768 ? 44 : 54;
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = (c - 1) * spacing;
          const baseY = (r - 1) * spacing;

          // 3 shape types:
          // 0: Micro 4-point crosshair (+)
          // 1: Precision Diamond (◆)
          // 2: Oxypace Hat Glyph Logo (same micro size)
          const rand = (r * 17 + c * 11) % 9;
          let shapeType = 0;
          if (rand === 0 || rand === 4) {
            shapeType = 2; // Hat glyph
          } else if (rand % 2 === 0) {
            shapeType = 1; // Diamond
          } else {
            shapeType = 0; // Crosshair
          }

          const phase = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 0.4;
          const localHueOffset = (r * 29 + c * 19) % 80;

          nodes.push({
            baseX,
            baseY,
            shapeType,
            phase,
            speed,
            localHueOffset,
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

      // Smooth mouse interpolation (ultra-responsive 0.25 lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.25;
      mouse.y += (mouse.targetY - mouse.y) * 0.25;

      // Solid pitch black background (fast clear)
      ctx.fillStyle = "#020204";
      ctx.fillRect(0, 0, width, height);

      const timeSec = now * 0.001;
      const count = nodes.length;
      const rSq = mouse.radiusSq;
      const rInv = 1 / mouse.radius;

      for (let i = 0; i < count; i++) {
        const node = nodes[i];

        // Minimal organic drift
        const floatX = Math.sin(timeSec * node.speed + node.phase) * 1.5;
        const floatY = Math.cos(timeSec * node.speed + node.phase) * 1.5;

        const effectiveX = node.baseX + floatX;
        const effectiveY = node.baseY + floatY;

        // Fast squared distance check to avoid Math.hypot when outside radius
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

          // Subtle tactile pull toward cursor
          const pull = targetIntensity * 4.5;
          trackOffsetX = (dx / (dist + 0.001)) * pull;
          trackOffsetY = (dy / (dist + 0.001)) * pull;
        }

        // Fast intensity lerp
        node.currIntensity += (targetIntensity - node.currIntensity) * 0.22;
        const intensity = node.currIntensity;

        const drawX = effectiveX + trackOffsetX;
        const drawY = effectiveY + trackOffsetY;

        // Dynamic Non-Neon Color Generation:
        // As the mouse moves, mouse.activeHue shifts actively!
        let strokeColor;
        let fillColor;

        if (intensity > 0.06) {
          // Dynamic continuous shifting color under cursor
          const currentHue = (mouse.activeHue + node.localHueOffset) % 360;
          // Saturation strictly kept low (28%-36%) to completely avoid neon colors!
          const sat = 32;
          const light = 78 + intensity * 16; // Radiant silver/pearl
          const alpha = 0.25 + intensity * 0.75;

          strokeColor = `hsla(${currentHue}, ${sat}%, ${light}%, ${alpha})`;
          fillColor = `hsla(${currentHue}, ${sat}%, ${light}%, ${alpha})`;
        } else {
          // Default state: Dim dark titanium slate
          strokeColor = "rgba(203, 213, 225, 0.11)";
          fillColor = "rgba(203, 213, 225, 0.11)";
        }

        const scale = 1.0 + intensity * 0.7;

        if (node.shapeType === 2 && isLogoReady && offscreenLogo) {
          // Oxypace Hat Glyph logo in micro size (9px)
          const size = 9 * scale;
          ctx.globalAlpha = 0.12 + intensity * 0.85;
          ctx.drawImage(offscreenLogo, drawX - size / 2, drawY - size / 2, size, size);
          ctx.globalAlpha = 1.0;
        } else if (node.shapeType === 1) {
          // Precision Diamond (◆)
          const rad = 2.2 * scale;
          ctx.beginPath();
          ctx.moveTo(drawX, drawY - rad);
          ctx.lineTo(drawX + rad, drawY);
          ctx.lineTo(drawX, drawY + rad);
          ctx.lineTo(drawX - rad, drawY);
          ctx.closePath();

          if (intensity > 0.2) {
            ctx.fillStyle = fillColor;
            ctx.fill();
          }
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        } else {
          // Micro 4-point crosshair (+)
          const arm = 2.4 * scale;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 0.85;

          ctx.beginPath();
          ctx.moveTo(drawX - arm, drawY);
          ctx.lineTo(drawX + arm, drawY);
          ctx.moveTo(drawX, drawY - arm);
          ctx.lineTo(drawX, drawY + arm);
          ctx.stroke();

          if (intensity > 0.3) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(drawX - 0.75, drawY - 0.75, 1.5, 1.5);
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

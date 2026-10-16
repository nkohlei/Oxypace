"use client";

import { useEffect, useRef } from "react";

/**
 * OxypaceInteractiveMatrixBackground
 * Recreates the exact digital halftone dot-matrix wave field from the reference visual:
 * - Fluid undulating ribbons of light on a dark matrix
 * - Dynamic cursor ripple / magnetic warp layer
 * - Luminous cursor wave bloom
 * - 120 FPS batched canvas rendering
 */
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

    // Track mouse position and velocity
    const mouse = {
      x: -3000,
      y: -3000,
      targetX: -3000,
      targetY: -3000,
      vx: 0,
      vy: 0,
      radius: 220,
      radiusSq: 220 * 220,
      active: false,
    };

    let prevX = -3000;
    let prevY = -3000;

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;

      mouse.vx = e.clientX - prevX;
      mouse.vy = e.clientY - prevY;

      prevX = e.clientX;
      prevY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -3000;
      mouse.targetY = -3000;
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    let spacing = 9.5;
    let cols = 0;
    let rows = 0;

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

      spacing = width < 768 ? 7.5 : 9.5;
      cols = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;
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

    let startTime = performance.now();

    const animate = (now) => {
      if (!isVisible) return;

      const elapsed = (now - startTime) * 0.001;

      // Smooth mouse spring interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.28;
      mouse.y += (mouse.targetY - mouse.y) * 0.28;

      // Pitch black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Animation time variables for fluid waves
      const t = elapsed * 0.42;

      // Pre-compute 6 batched path buckets for 120 FPS high performance
      // Bucket 0: Very faint matrix specks
      // Bucket 1: Soft cool blue/cyan edge dots
      // Bucket 2: Warm champagne/ivory crest dots
      // Bucket 3: Medium luminous silver dots
      // Bucket 4: Brilliant white wave highlights
      // Bucket 5: Interactive cursor bloom highlights
      const p0 = new Path2D();
      const p1 = new Path2D();
      const p2 = new Path2D();
      const p3 = new Path2D();
      const p4 = new Path2D();
      const p5 = new Path2D();

      const rSq = mouse.radiusSq;
      const rInv = 1 / mouse.radius;

      for (let r = 0; r < rows; r++) {
        const baseY = r * spacing;
        const ny = (baseY / height) * 2 - 1; // Normalized -1 to 1

        // Primary flowing ribbon S-curve center
        const ribbon1X =
          Math.sin(ny * 2.6 + t * 0.8) * 0.58 +
          Math.cos(ny * 4.8 - t * 0.5) * 0.16;

        // Secondary flowing ribbon curve
        const ribbon2X =
          Math.cos(ny * 2.1 - t * 0.7) * 0.72 +
          Math.sin(ny * 4.2 + t * 0.4) * 0.12;

        const thick1 = 0.26 + Math.sin(ny * 3.2 + t * 0.6) * 0.06;
        const thick2 = 0.30 + Math.cos(ny * 2.8 - t * 0.5) * 0.05;

        const invThick1Sq = 1 / (2 * thick1 * thick1);
        const invThick2Sq = 1 / (2 * thick2 * thick2);

        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing;
          const nx = (baseX / width) * 2 - 1; // Normalized -1 to 1

          // Calculate ribbon field intensity
          const d1 = nx - ribbon1X;
          const i1 = Math.exp(-d1 * d1 * invThick1Sq);

          const d2 = nx - ribbon2X;
          const i2 = Math.exp(-d2 * d2 * invThick2Sq);

          // Fluid organic interference wave
          const fluidNoise = Math.sin(nx * 3.2 + ny * 3.8 + t * 0.9) * 0.14;

          let rawIntensity = i1 * 1.15 + i2 * 0.75 + fluidNoise;
          let waveIntensity = Math.max(0, Math.min(1.0, rawIntensity));

          // Contrast curve matching reference visual: deep voids, luminous ribbons
          waveIntensity = Math.pow(waveIntensity, 2.1);

          // Interactive cursor displacement & energy ripple
          let drawX = baseX;
          let drawY = baseY;
          let cursorGlow = 0;

          const dx = mouse.x - baseX;
          const dy = mouse.y - baseY;
          const distSq = dx * dx + dy * dy;

          if (distSq < rSq) {
            const dist = Math.sqrt(distSq);
            const factor = 1 - dist * rInv;

            // Elastic ripple displacement on the matrix layer
            const ripple = Math.sin(dist * 0.06 - elapsed * 6.5) * factor * 14;
            drawX -= (dx / (dist + 0.001)) * ripple;
            drawY -= (dy / (dist + 0.001)) * ripple;

            // Luminous energy bloom trailing the cursor
            cursorGlow = factor * factor * 0.85;
          }

          const totalIntensity = Math.min(1.0, waveIntensity + cursorGlow);

          if (totalIntensity > 0.03) {
            // Determine square dot size (from 1px to ~6.5px)
            const dotSize = Math.max(1, Math.min(6.5, totalIntensity * 6.2));
            const halfSize = dotSize * 0.5;

            // Categorize into rendering buckets for maximum performance
            if (cursorGlow > 0.35) {
              // Cursor interaction energy
              p5.rect(drawX - halfSize, drawY - halfSize, dotSize, dotSize);
            } else if (totalIntensity > 0.82) {
              // Peak brilliant white core
              p4.rect(drawX - halfSize, drawY - halfSize, dotSize, dotSize);
            } else if (totalIntensity > 0.55) {
              // High silver
              p3.rect(drawX - halfSize, drawY - halfSize, dotSize, dotSize);
            } else if (totalIntensity > 0.28) {
              if (d1 > 0) {
                // Warm champagne/ivory tint on crest side
                p2.rect(drawX - halfSize, drawY - halfSize, dotSize, dotSize);
              } else {
                // Cool icy cyan/blue tint on shadow side
                p1.rect(drawX - halfSize, drawY - halfSize, dotSize, dotSize);
              }
            } else {
              // Faint matrix dot
              p0.rect(drawX - halfSize, drawY - halfSize, dotSize, dotSize);
            }
          }
        }
      }

      // Draw all 6 buckets in unified GPU passes:
      // Bucket 0: Faint background dots
      ctx.fillStyle = "rgba(160, 175, 195, 0.16)";
      ctx.fill(p0);

      // Bucket 1: Cool icy blue/cyan wave edge
      ctx.fillStyle = "rgba(165, 215, 255, 0.65)";
      ctx.fill(p1);

      // Bucket 2: Warm champagne/ivory wave edge
      ctx.fillStyle = "rgba(255, 240, 220, 0.72)";
      ctx.fill(p2);

      // Bucket 3: Luminous chrome silver
      ctx.fillStyle = "rgba(235, 240, 248, 0.90)";
      ctx.fill(p3);

      // Bucket 4: Pure brilliant white peak ribbons
      ctx.fillStyle = "#FFFFFF";
      ctx.fill(p4);

      // Bucket 5: Interactive cursor energy bloom
      ctx.fillStyle = "#FFFFFF";
      ctx.fill(p5);

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
    <canvas
      ref={canvasRef}
      className="oxy-canvas-bg select-none pointer-events-none"
    />
  );
}

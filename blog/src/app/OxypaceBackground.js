"use client";

import { useEffect, useRef } from "react";

/**
 * OxypaceMetallicMatrixBackground
 * - Circular, delicate metallic matrix (yuvarlak, metalik ve hafif sönük)
 * - Authentic metallic tones: liquid mercury, platinum, polished chrome, cool titanium steel
 * - Muted elegant luminance (hafif sönük, never blinding, luxury aesthetic)
 * - Sublime, organic, buttery-smooth cursor interaction (smooth fluid displacement & soft chrome sheen)
 * - Solid 120 FPS performance with batched Path2D bucket rendering
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

    // Smooth inertia mouse tracking
    const mouse = {
      x: -3000,
      y: -3000,
      targetX: -3000,
      targetY: -3000,
      radius: 170,
      radiusSq: 170 * 170,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -3000;
      mouse.targetY = -3000;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    let spacing = 11.5;
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

      spacing = width < 768 ? 9.5 : 11.5;
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

      // Gentle fluid inertia on mouse (eliminates all abrupt jumps)
      mouse.x += (mouse.targetX - mouse.x) * 0.16;
      mouse.y += (mouse.targetY - mouse.y) * 0.16;

      // Pure solid pitch-black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Flowing fluid wave parameters (slow, hypnotic, metallic silk currents)
      const t = elapsed * 0.32;

      // 5 batched circular Path2D buckets for solid 120 FPS:
      // Bucket 0: Faint gunmetal dots (deep dark areas)
      // Bucket 1: Cool titanium steel dots (wave shadow side)
      // Bucket 2: Warm champagne platinum dots (wave crest side)
      // Bucket 3: Luminous liquid mercury dots (wave highlight)
      // Bucket 4: Soft cursor mercury sheen (active cursor hover)
      const p0 = new Path2D();
      const p1 = new Path2D();
      const p2 = new Path2D();
      const p3 = new Path2D();
      const p4 = new Path2D();

      const rSq = mouse.radiusSq;
      const rInv = 1 / mouse.radius;

      for (let r = 0; r < rows; r++) {
        const baseY = r * spacing;
        const ny = (baseY / height) * 2 - 1; // -1 to 1

        // Primary 3D liquid mercury ribbon curve
        const ribbon1X =
          Math.sin(ny * 2.4 + t * 0.7) * 0.60 +
          Math.cos(ny * 4.6 - t * 0.4) * 0.14;

        // Secondary metallic current
        const ribbon2X =
          Math.cos(ny * 2.0 - t * 0.6) * 0.68 +
          Math.sin(ny * 3.8 + t * 0.35) * 0.12;

        const thick1 = 0.28 + Math.sin(ny * 3.0 + t * 0.5) * 0.05;
        const thick2 = 0.32 + Math.cos(ny * 2.5 - t * 0.4) * 0.05;

        const invThick1Sq = 1 / (2 * thick1 * thick1);
        const invThick2Sq = 1 / (2 * thick2 * thick2);

        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing;
          const nx = (baseX / width) * 2 - 1; // -1 to 1

          const d1 = nx - ribbon1X;
          const i1 = Math.exp(-d1 * d1 * invThick1Sq);

          const d2 = nx - ribbon2X;
          const i2 = Math.exp(-d2 * d2 * invThick2Sq);

          const fluidWave = Math.sin(nx * 2.8 + ny * 3.4 + t * 0.8) * 0.10;

          let rawIntensity = i1 * 0.95 + i2 * 0.65 + fluidWave;
          let waveIntensity = Math.max(0, Math.min(1.0, rawIntensity));

          // Softened contrast curve: elegant muted metallic aesthetic (hafif sönük)
          waveIntensity = Math.pow(waveIntensity, 2.3) * 0.75;

          // Organic, buttery-smooth cursor interaction
          let drawX = baseX;
          let drawY = baseY;
          let cursorGlow = 0;

          const dx = mouse.x - baseX;
          const dy = mouse.y - baseY;
          const distSq = dx * dx + dy * dy;

          if (distSq < rSq) {
            const dist = Math.sqrt(distSq);
            const factor = 1 - dist * rInv;

            // Gentle, smooth magnetic repulsion (fluid parting, zero harsh ripples)
            const push = factor * factor * 6.5;
            drawX -= (dx / (dist + 0.001)) * push;
            drawY -= (dy / (dist + 0.001)) * push;

            // Soft liquid mercury sheen around cursor
            cursorGlow = factor * factor * 0.38;
          }

          const totalIntensity = Math.min(1.0, waveIntensity + cursorGlow);

          if (totalIntensity > 0.02) {
            // Refined circular radius: from 0.9px to 2.8px (delicate, elegant circles)
            const dotRadius = Math.max(0.8, Math.min(2.8, totalIntensity * 2.8));

            if (cursorGlow > 0.18) {
              // Soft active cursor sheen
              p4.arc(drawX, drawY, dotRadius, 0, Math.PI * 2);
            } else if (totalIntensity > 0.48) {
              // Liquid mercury wave crest (soft chrome)
              p3.arc(drawX, drawY, dotRadius, 0, Math.PI * 2);
            } else if (totalIntensity > 0.24) {
              if (d1 > 0) {
                // Warm champagne platinum
                p2.arc(drawX, drawY, dotRadius, 0, Math.PI * 2);
              } else {
                // Cool titanium steel
                p1.arc(drawX, drawY, dotRadius, 0, Math.PI * 2);
              }
            } else {
              // Faint gunmetal slate speck
              p0.arc(drawX, drawY, dotRadius, 0, Math.PI * 2);
            }
          }
        }
      }

      // 5 Single-pass GPU executions for solid 120 FPS:
      // Bucket 0: Faint gunmetal slate
      ctx.fillStyle = "rgba(148, 163, 184, 0.09)";
      ctx.fill(p0);

      // Bucket 1: Cool titanium steel
      ctx.fillStyle = "rgba(175, 198, 222, 0.32)";
      ctx.fill(p1);

      // Bucket 2: Warm champagne platinum
      ctx.fillStyle = "rgba(226, 220, 210, 0.38)";
      ctx.fill(p2);

      // Bucket 3: Polished liquid mercury crest
      ctx.fillStyle = "rgba(238, 242, 248, 0.62)";
      ctx.fill(p3);

      // Bucket 4: Cursor liquid chrome sheen
      ctx.fillStyle = "rgba(241, 245, 250, 0.58)";
      ctx.fill(p4);

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

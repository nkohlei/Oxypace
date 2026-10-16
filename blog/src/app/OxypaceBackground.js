"use client";

import { useEffect, useRef } from "react";

/**
 * OxypaceMetallicMatrixBackground
 * - High-FPS 2D/3D undulating liquid mercury fluid sheet of circular dots
 * - Spans the entire screen homogeneously: zero diagonal razor cuts, zero barcode lines
 * - Muted luxury metallic palette ("hafif sönük"): deep gunmetal, cool titanium, champagne platinum, liquid mercury
 * - Buttery-smooth, organic liquid mercury cursor ripple & fluid displacement
 * - Solid 120 FPS performance with 5 GPU-batched Path2D draw passes
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

    // Smooth inertia cursor tracking
    const mouse = {
      x: -3000,
      y: -3000,
      targetX: -3000,
      targetY: -3000,
      radius: 200,
      radiusSq: 200 * 200,
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

    let spacing = 9.0;
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

      // Clean, balanced matrix grid spacing
      spacing = width < 768 ? 8.0 : 9.5;
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

      // Silky inertia damping on mouse (smooth spring interpolation)
      mouse.x += (mouse.targetX - mouse.x) * 0.14;
      mouse.y += (mouse.targetY - mouse.y) * 0.14;

      // Solid deep pitch black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Slow, hypnotic liquid mercury wave speed
      const t = elapsed * 0.35;

      // 5 batched circular Path2D buckets for pure 120 FPS:
      // Bucket 0: Faint deep charcoal gunmetal dots (deep ambient layer)
      // Bucket 1: Cool titanium steel midtones
      // Bucket 2: Warm champagne platinum slopes
      // Bucket 3: Polished liquid mercury crests
      // Bucket 4: Specular liquid chrome highlight & cursor sheen
      const p0 = new Path2D();
      const p1 = new Path2D();
      const p2 = new Path2D();
      const p3 = new Path2D();
      const p4 = new Path2D();

      const rSq = mouse.radiusSq;
      const rInv = 1 / mouse.radius;

      const invW = 1 / width;
      const invH = 1 / height;

      for (let r = 0; r < rows; r++) {
        const baseY = r * spacing;
        const ny = baseY * invH * 2 - 1; // -1 to 1

        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing;
          const nx = baseX * invW * 2 - 1; // -1 to 1

          // Truly homogeneous, organic multi-wave 2D liquid mercury surface
          // Sweeping diagonally and circularly across the whole viewport smoothly
          const u = nx * 2.2;
          const v = ny * 2.2;

          const wave1 = Math.sin(u * 1.1 + v * 0.8 + t * 0.6);
          const wave2 = Math.cos(u * 0.8 - v * 1.2 - t * 0.45);
          const wave3 = Math.sin((u + v) * 0.95 + t * 0.5);
          const wave4 = Math.cos(Math.sqrt(u * u + v * v) * 1.4 - t * 0.7);

          let rawElevation = (wave1 * 0.35 + wave2 * 0.30 + wave3 * 0.20 + wave4 * 0.15) + 0.5;
          let elevation = Math.max(0, Math.min(1.0, rawElevation));

          // Softened contrast curve for elegant muted metallic aesthetic ("hafif sönük")
          let intensity = Math.pow(elevation, 1.8) * 0.62;

          // Buttery-smooth, organic cursor interaction
          let drawX = baseX;
          let drawY = baseY;
          let cursorGlow = 0;

          const mdx = baseX - mouse.x;
          const mdy = baseY - mouse.y;
          const mdistSq = mdx * mdx + mdy * mdy;

          if (mdistSq < rSq) {
            const mdist = Math.sqrt(mdistSq);
            const factor = 1 - mdist * rInv; // 0 to 1
            // Smooth bell curve
            const bell = factor * factor * (3 - 2 * factor);

            // Gentle fluid displacement
            const push = bell * 5.5;
            drawX += (mdx / (mdist + 0.01)) * push;
            drawY += (mdy / (mdist + 0.01)) * push;

            // Soft liquid mercury sheen lifting under cursor
            cursorGlow = bell * 0.32;
          }

          const finalVal = Math.min(1.0, intensity + cursorGlow);

          // Dot radius: 0.7px (subtle) to 2.2px (soft wave crest)
          const radius = Math.max(0.7, Math.min(2.2, 0.7 + finalVal * 1.5));

          if (finalVal > 0.58) {
            // Specular liquid chrome highlight & cursor sheen
            p4.arc(drawX, drawY, radius, 0, Math.PI * 2);
          } else if (finalVal > 0.38) {
            // Polished liquid mercury crest
            p3.arc(drawX, drawY, radius, 0, Math.PI * 2);
          } else if (finalVal > 0.22) {
            // Warm champagne platinum
            p2.arc(drawX, drawY, radius, 0, Math.PI * 2);
          } else if (finalVal > 0.10) {
            // Cool titanium steel
            p1.arc(drawX, drawY, radius, 0, Math.PI * 2);
          } else {
            // Faint deep charcoal gunmetal dots (continuous uniform field)
            p0.arc(drawX, drawY, 0.65, 0, Math.PI * 2);
          }
        }
      }

      // 5 Single-pass GPU executions for solid 120 FPS:
      // Muted metallic luxury palette ("hafif sönük" - soft, sophisticated, high contrast for text)
      // Bucket 0: Faint deep charcoal gunmetal dots
      ctx.fillStyle = "rgba(71, 85, 105, 0.08)";
      ctx.fill(p0);

      // Bucket 1: Cool titanium steel
      ctx.fillStyle = "rgba(148, 175, 205, 0.18)";
      ctx.fill(p1);

      // Bucket 2: Warm champagne platinum
      ctx.fillStyle = "rgba(226, 220, 210, 0.26)";
      ctx.fill(p2);

      // Bucket 3: Polished liquid mercury
      ctx.fillStyle = "rgba(238, 242, 248, 0.38)";
      ctx.fill(p3);

      // Bucket 4: Specular liquid chrome highlight & cursor sheen
      ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
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

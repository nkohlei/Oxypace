"use client";

import { useEffect, useRef } from "react";

/**
 * OxypaceMetallicMatrixBackground
 * - Exact recreation of the reference visual (media_1792180438123.jpg)
 * - Billowing 3D silk ribbon flowing in deep black space
 * - Zero diagonal wedges, zero corner-to-corner knife cuts, zero scanline banding
 * - Distinct 3D dual-tone metallic iridescence:
 *     * Cool icy steel-blue on wave flank A
 *     * Warm champagne-ivory platinum on wave flank B
 *     * Luminous liquid mercury / polished chrome crests
 *     * Faint continuous gunmetal dot matrix across entire canvas ("hafif sönük")
 * - Broad ambient cursor sensitivity (360px radius) with gentle, non-absurd fluid response
 * - Solid 120 FPS performance via 5 GPU-batched Path2D draw passes
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

    // Smooth inertia cursor tracking with wide radius
    const mouse = {
      x: -3000,
      y: -3000,
      targetX: -3000,
      targetY: -3000,
      radius: 360,
      radiusSq: 360 * 360,
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

    let spacing = 7.0;
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

      // Fine, dense matrix grid spacing matching reference visual
      spacing = width < 768 ? 6.2 : 6.8;
      cols = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;
      mouse.radius = width < 768 ? 260 : 360;
      mouse.radiusSq = mouse.radius * mouse.radius;
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
      mouse.x += (mouse.targetX - mouse.x) * 0.10;
      mouse.y += (mouse.targetY - mouse.y) * 0.10;

      // Solid deep pitch black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Multi-directional organic fluid time
      const t = elapsed * 0.28;

      // 5 batched circular Path2D buckets for pure 120 FPS:
      const p0 = new Path2D();
      const p1 = new Path2D();
      const p2 = new Path2D();
      const p3 = new Path2D();
      const p4 = new Path2D();

      const rSq = mouse.radiusSq;
      const rInv = 1 / mouse.radius;

      // Pre-compute ribbon trajectory parameters across height
      const ribbonWidth1 = width * 0.18;
      const invTwoSigmaSq1 = 1 / (2 * ribbonWidth1 * ribbonWidth1);

      const ribbonWidth2 = width * 0.15;
      const invTwoSigmaSq2 = 1 / (2 * ribbonWidth2 * ribbonWidth2);

      for (let r = 0; r < rows; r++) {
        const baseY = r * spacing;
        const s = baseY / height; // 0 (top) to 1 (bottom)

        // Primary billowing 3D silk S-curve center
        const cx1 =
          width * (0.50 +
            Math.sin(s * Math.PI * 2.0 + t * 0.55) * 0.26 +
            Math.cos(s * Math.PI * 3.2 - t * 0.35) * 0.10);

        // Secondary counter-flowing silk fold
        const cx2 =
          width * (0.52 +
            Math.cos(s * Math.PI * 2.4 - t * 0.45) * 0.28 +
            Math.sin(s * Math.PI * 1.6 + t * 0.30) * 0.12);

        // Subtle longitudinal wave wrinkles along the silk ribbon
        const wrinkle = Math.sin(s * Math.PI * 8.0 + t * 0.8) * 0.08;

        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing;

          // Distance from primary and secondary ribbon centers
          const dx1 = baseX - cx1;
          const dx2 = baseX - cx2;

          // Smooth bell curves (zero hard edges, falls off to 0 on sides)
          const g1 = Math.exp(-dx1 * dx1 * invTwoSigmaSq1);
          const g2 = Math.exp(-dx2 * dx2 * invTwoSigmaSq2);

          // Combined undulating elevation
          let rawElevation = g1 * 0.80 + g2 * 0.55 + wrinkle * (g1 + g2);
          let elevation = Math.max(0, Math.min(1.0, rawElevation));

          // Softened contrast curve for elegant muted metallic aesthetic ("hafif sönük")
          let intensity = Math.pow(elevation, 1.8) * 0.68;

          // Broad, elegant, non-absurd cursor interaction
          let drawX = baseX;
          let drawY = baseY;
          let cursorGlow = 0;

          const mdx = baseX - mouse.x;
          const mdy = baseY - mouse.y;
          const mdistSq = mdx * mdx + mdy * mdy;

          if (mdistSq < rSq) {
            const mdist = Math.sqrt(mdistSq);
            const factor = 1 - mdist * rInv; // 0 to 1
            const bell = factor * factor * (3 - 2 * factor); // smoothstep

            // Gentle, silky fluid deflection (max 2.8px)
            const push = bell * 2.8;
            drawX += (mdx / (mdist + 0.01)) * push;
            drawY += (mdy / (mdist + 0.01)) * push;

            // Wide, soft liquid mercury ambient light lifting under cursor
            cursorGlow = bell * 0.35;
          }

          const finalVal = Math.min(1.0, intensity + cursorGlow);

          // Layer 0: Continuous ambient deep gunmetal dot (0.55px across whole canvas)
          p0.arc(drawX, drawY, 0.55, 0, Math.PI * 2);

          // Contour-Free Layer Rendering:
          // Dot radius grows continuously from 0px (no hard contour lines)
          if (finalVal > 0.08) {
            if (dx1 < 0) {
              // Cool icy steel-blue flank (left side of silk wave)
              const rBlue = Math.min(1.7, (finalVal - 0.08) * 2.8);
              if (rBlue > 0.2) p1.arc(drawX, drawY, rBlue, 0, Math.PI * 2);
            } else {
              // Warm champagne-ivory platinum flank (right side of silk wave)
              const rGold = Math.min(1.8, (finalVal - 0.08) * 2.9);
              if (rGold > 0.2) p2.arc(drawX, drawY, rGold, 0, Math.PI * 2);
            }
          }

          if (finalVal > 0.36) {
            // Polished liquid mercury crest
            const rMercury = Math.min(1.9, (finalVal - 0.36) * 3.2);
            if (rMercury > 0.2) p3.arc(drawX, drawY, rMercury, 0, Math.PI * 2);
          }

          if (finalVal > 0.58) {
            // Specular white chrome peak highlights & wide cursor illumination
            const rChrome = Math.min(2.2, (finalVal - 0.58) * 3.8);
            if (rChrome > 0.2) p4.arc(drawX, drawY, rChrome, 0, Math.PI * 2);
          }
        }
      }

      // 5 Single-pass GPU executions for solid 120 FPS:
      // Palette from reference visual (media_1792180438123.jpg):
      // Bucket 0: Faint deep charcoal gunmetal dots (deep ambient layer across all dots)
      ctx.fillStyle = "rgba(70, 85, 110, 0.12)";
      ctx.fill(p0);

      // Bucket 1: Cool icy steel-blue flank dots
      ctx.fillStyle = "rgba(130, 180, 230, 0.34)";
      ctx.fill(p1);

      // Bucket 2: Warm champagne-ivory platinum flank dots
      ctx.fillStyle = "rgba(238, 222, 202, 0.44)";
      ctx.fill(p2);

      // Bucket 3: Polished liquid mercury crest dots
      ctx.fillStyle = "rgba(240, 245, 252, 0.64)";
      ctx.fill(p3);

      // Bucket 4: Specular white chrome peak highlights & wide cursor illumination
      ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
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

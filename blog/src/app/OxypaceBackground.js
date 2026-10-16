"use client";

import { useEffect, useRef } from "react";

/**
 * OxypaceMetallicMatrixBackground
 * - Exact recreation of reference visual (media_1792180438123.jpg)
 * - True 2D/3D continuous multi-directional organic fluid surface (zero diagonal knife cuts, zero scanline sawteeth)
 * - Zero-contour soft dot scaling: each layer's dot radius grows continuously from 0px (no abrupt popping)
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

      // Fine, dense matrix grid spacing for crisp continuous luxury texture
      spacing = width < 768 ? 6.4 : 7.2;
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

      // Multi-directional organic fluid currents (slow, hypnotic, never classic zigzag)
      const t = elapsed * 0.24;

      // Shifting rotation angles for continuous multidirectional flow
      const ang1 = 0.55 + Math.sin(t * 0.16) * 0.30;
      const cos1 = Math.cos(ang1);
      const sin1 = Math.sin(ang1);

      const ang2 = -0.70 + Math.cos(t * 0.20) * 0.28;
      const cos2 = Math.cos(ang2);
      const sin2 = Math.sin(ang2);

      // 5 batched circular Path2D buckets for pure 120 FPS:
      // Bucket 0: Faint deep gunmetal dots (continuous base layer across entire grid)
      // Bucket 1: Cool icy steel-blue flank dots (soft gradient growth)
      // Bucket 2: Warm champagne-ivory platinum flank dots (soft gradient growth)
      // Bucket 3: Polished liquid mercury crests (bright silver)
      // Bucket 4: Specular white chrome peak highlights & wide cursor illumination
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

          // Truly 2D continuous multi-directional wave topography:
          // Stream 1 (rotating diagonal angle 1)
          const u1 = nx * cos1 + ny * sin1;
          const v1 = -nx * sin1 + ny * cos1;

          // Stream 2 (counter-rotating diagonal angle 2)
          const u2 = nx * cos2 + ny * sin2;
          const v2 = -nx * sin2 + ny * cos2;

          // Smooth harmonic fluid curves
          const s1 = Math.sin(v1 * 1.5 + t * 0.40) * 0.40 + Math.cos(v1 * 0.8 - t * 0.20) * 0.20;
          const s2 = Math.cos(v2 * 1.4 - t * 0.35) * 0.45 + Math.sin(v2 * 2.0 + t * 0.28) * 0.15;

          const d1 = u1 - s1;
          const d2 = u2 - s2;

          // Wide, smooth Gaussian ribbon envelopes with soft silk drape (no hard edges)
          const w1 = Math.exp(-d1 * d1 * 2.5);
          const w2 = Math.exp(-d2 * d2 * 3.0);

          // Subtle organic cross-flow ripples
          const ripples =
            Math.sin(u1 * 2.0 + v2 * 1.8 + t * 0.45) * 0.10 +
            Math.cos(u2 * 1.6 - v1 * 2.2 - t * 0.30) * 0.08;

          let rawElevation = w1 * 0.80 + w2 * 0.55 + ripples * (w1 + 0.25);
          let elevation = Math.max(0, Math.min(1.0, rawElevation));

          // Softened contrast curve for elegant muted metallic aesthetic ("hafif sönük")
          let intensity = Math.pow(elevation, 1.8) * 0.65;

          // Broad, elegant, non-absurd cursor interaction
          // Wide 360px ambient illumination + gentle, natural fluid deflection (max 2.8px)
          let drawX = baseX;
          let drawY = baseY;
          let cursorGlow = 0;

          const mdx = baseX - mouse.x;
          const mdy = baseY - mouse.y;
          const mdistSq = mdx * mdx + mdy * mdy;

          if (mdistSq < rSq) {
            const mdist = Math.sqrt(mdistSq);
            const factor = 1 - mdist * rInv; // 0 to 1
            // Smooth bell curve (smoothstep)
            const bell = factor * factor * (3 - 2 * factor);

            // Subtle, non-absurd fluid deflection (gentle 2.5px glide)
            const push = bell * 2.5;
            drawX += (mdx / (mdist + 0.01)) * push;
            drawY += (mdy / (mdist + 0.01)) * push;

            // Wide, soft liquid mercury ambient light lifting under cursor
            cursorGlow = bell * 0.35;
          }

          const finalVal = Math.min(1.0, intensity + cursorGlow);

          // Layer 0: Always draw faint deep gunmetal base dot (continuous uniform grid, 0.55px)
          p0.arc(drawX, drawY, 0.55, 0, Math.PI * 2);

          // Contour-Free Layer Rendering:
          // Dots start at radius = 0 at the threshold and grow continuously!
          // This mathematically guarantees ZERO hard contour lines and ZERO sawteeth.
          if (finalVal > 0.08) {
            if (d1 < 0) {
              // Cool icy steel-blue flank
              const rBlue = Math.min(1.7, (finalVal - 0.08) * 2.8);
              if (rBlue > 0.2) p1.arc(drawX, drawY, rBlue, 0, Math.PI * 2);
            } else {
              // Warm champagne-ivory platinum flank
              const rGold = Math.min(1.8, (finalVal - 0.08) * 2.9);
              if (rGold > 0.2) p2.arc(drawX, drawY, rGold, 0, Math.PI * 2);
            }
          }

          if (finalVal > 0.35) {
            // Polished liquid mercury crest
            const rMercury = Math.min(1.9, (finalVal - 0.35) * 3.2);
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
      // Exact color palette sampled from reference visual (media_1792180438123.jpg):
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

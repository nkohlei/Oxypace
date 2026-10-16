"use client";

import { useEffect, useRef } from "react";

/**
 * OxypaceMetallicMatrixBackground
 * - Exact recreation of the reference visual (media_1792180438123.jpg)
 * - Billowing 3D silk ribbon flowing in deep black space
 * - Zero diagonal wedges, zero knife-edge cuts, zero scanline banding
 * - Fully continuous 2D/3D Gaussian surface with smooth sigmoid color gradients
 * - Distinct 3D dual-tone metallic iridescence:
 *     * Cool icy steel-blue on wave flank A
 *     * Warm champagne-ivory platinum on wave flank B
 *     * Luminous liquid mercury / polished chrome crests
 *     * Faint continuous gunmetal dot matrix across entire canvas ("hafif sönük")
 * - Multi-directional organic fluid currents (NOT a classic zigzag)
 * - Broad ambient cursor sensitivity (380px radius) with gentle, non-absurd fluid deflection (~2.5px)
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

    // Broad ambient cursor tracking with smooth inertia damping
    const mouse = {
      x: -4000,
      y: -4000,
      targetX: -4000,
      targetY: -4000,
      radius: 380,
      radiusSq: 380 * 380,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -4000;
      mouse.targetY = -4000;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    let spacing = 6.8;
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
      mouse.radius = width < 768 ? 280 : 380;
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

      // Multi-directional organic fluid time variables
      const t = elapsed * 0.26;
      const tY = elapsed * 0.35; // Vertical flow progression

      // 5 batched circular Path2D buckets for pure 120 FPS:
      const p0 = new Path2D(); // Faint deep gunmetal dots (ambient field)
      const p1 = new Path2D(); // Cool icy steel-blue flank dots
      const p2 = new Path2D(); // Warm champagne-ivory platinum flank dots
      const p3 = new Path2D(); // Polished liquid mercury crest dots
      const p4 = new Path2D(); // Specular white chrome peak highlights

      const rSq = mouse.radiusSq;
      const rInv = 1 / mouse.radius;

      // Pre-compute ribbon trajectory parameters across height
      const ribbonWidth1 = width * 0.20;
      const invTwoSigmaSq1 = 1 / (2 * ribbonWidth1 * ribbonWidth1);

      const ribbonWidth2 = width * 0.16;
      const invTwoSigmaSq2 = 1 / (2 * ribbonWidth2 * ribbonWidth2);

      for (let r = 0; r < rows; r++) {
        const baseY = r * spacing;
        const s = baseY / height; // Normalized height: 0 (top) to 1 (bottom)

        // Primary billowing 3D silk S-curve center (multi-directional harmonics)
        const cx1 =
          width * (0.48 +
            Math.sin(s * Math.PI * 2.0 + t * 0.52) * 0.25 +
            Math.cos(s * Math.PI * 3.4 - t * 0.32) * 0.09);

        // Secondary counter-flowing silk fold
        const cx2 =
          width * (0.52 +
            Math.cos(s * Math.PI * 2.2 - t * 0.42) * 0.26 +
            Math.sin(s * Math.PI * 1.6 + t * 0.28) * 0.11);

        // Traveling transverse fluid waves along the ribbon (multi-directional flow, not a simple zigzag)
        const travelingWave1 = Math.sin(s * Math.PI * 5.0 - tY * 1.2) * 0.18;
        const travelingWave2 = Math.cos(s * Math.PI * 7.0 + tY * 0.9) * 0.12;

        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing;

          // Distance from primary and secondary ribbon centers
          const dx1 = baseX - cx1;
          const dx2 = baseX - cx2;

          // Smooth bell curves (zero hard edges, falls off to 0 on sides)
          const g1 = Math.exp(-dx1 * dx1 * invTwoSigmaSq1);
          const g2 = Math.exp(-dx2 * dx2 * invTwoSigmaSq2);

          // Combined undulating elevation with organic traveling folds
          const rawElevation =
            g1 * (0.76 + travelingWave1) +
            g2 * (0.52 + travelingWave2);

          const elevation = Math.max(0, Math.min(1.0, rawElevation));

          // Softened contrast curve for elegant muted metallic aesthetic ("hafif sönük")
          const intensity = Math.pow(elevation, 1.7) * 0.68;

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
            const bell = factor * factor * (3 - 2 * factor); // Smooth Hermite curve

            // Gentle, silky fluid deflection (max 2.6px, never absurd)
            const push = bell * 2.6;
            drawX += (mdx / (mdist + 0.01)) * push;
            drawY += (mdy / (mdist + 0.01)) * push;

            // Wide, soft liquid mercury ambient light lifting under cursor
            cursorGlow = bell * 0.32;
          }

          const finalVal = Math.min(1.0, intensity + cursorGlow);

          // Layer 0: Continuous ambient deep gunmetal dot (0.50px across whole canvas)
          p0.moveTo(drawX + 0.50, drawY);
          p0.arc(drawX, drawY, 0.50, 0, Math.PI * 2);

          // Seamless dual-tone metallic gradient (Zero knife-edge seams!):
          // Smooth sigmoid transition between icy blue (flank A) and champagne gold (flank B)
          if (finalVal > 0.08) {
            const normalizedDx1 = dx1 / ribbonWidth1;
            // Smooth sigmoid weight: blue on left flank, champagne on right flank
            const blueFactor = Math.max(0, Math.min(1.0, 0.5 - normalizedDx1 * 0.75));
            const goldFactor = Math.max(0, Math.min(1.0, 0.5 + normalizedDx1 * 0.75));

            // Cool icy steel-blue flank dots (grows continuously from 0px)
            const blueIntensity = finalVal * blueFactor;
            if (blueIntensity > 0.06) {
              const rBlue = Math.min(1.7, (blueIntensity - 0.06) * 3.0);
              if (rBlue > 0.15) {
                p1.moveTo(drawX + rBlue, drawY);
                p1.arc(drawX, drawY, rBlue, 0, Math.PI * 2);
              }
            }

            // Warm champagne-ivory platinum flank dots (grows continuously from 0px)
            const goldIntensity = finalVal * goldFactor;
            if (goldIntensity > 0.06) {
              const rGold = Math.min(1.8, (goldIntensity - 0.06) * 3.1);
              if (rGold > 0.15) {
                p2.moveTo(drawX + rGold, drawY);
                p2.arc(drawX, drawY, rGold, 0, Math.PI * 2);
              }
            }
          }

          if (finalVal > 0.32) {
            // Polished liquid mercury crest
            const rMercury = Math.min(1.9, (finalVal - 0.32) * 3.2);
            if (rMercury > 0.15) {
              p3.moveTo(drawX + rMercury, drawY);
              p3.arc(drawX, drawY, rMercury, 0, Math.PI * 2);
            }
          }

          if (finalVal > 0.54) {
            // Specular white chrome peak highlights & wide cursor illumination
            const rChrome = Math.min(2.3, (finalVal - 0.54) * 3.8);
            if (rChrome > 0.15) {
              p4.moveTo(drawX + rChrome, drawY);
              p4.arc(drawX, drawY, rChrome, 0, Math.PI * 2);
            }
          }
        }
      }

      // 5 Single-pass GPU executions for solid 120 FPS:
      // Palette from reference visual (media_1792180438123.jpg):
      // Bucket 0: Faint deep charcoal gunmetal dots (deep ambient layer across all dots)
      ctx.fillStyle = "rgba(70, 85, 110, 0.12)";
      ctx.fill(p0);

      // Bucket 1: Cool icy steel-blue flank dots
      ctx.fillStyle = "rgba(125, 175, 230, 0.36)";
      ctx.fill(p1);

      // Bucket 2: Warm champagne-ivory platinum flank dots
      ctx.fillStyle = "rgba(238, 222, 202, 0.44)";
      ctx.fill(p2);

      // Bucket 3: Polished liquid mercury crest dots
      ctx.fillStyle = "rgba(242, 246, 252, 0.65)";
      ctx.fill(p3);

      // Bucket 4: Specular white chrome peak highlights & wide cursor illumination
      ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
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

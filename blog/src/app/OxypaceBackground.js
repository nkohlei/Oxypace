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

    // Track mouse with smoothed position
    const mouse = {
      x: -2000,
      y: -2000,
      targetX: -2000,
      targetY: -2000,
      radius: 220,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -2000;
      mouse.targetY = -2000;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // Grid nodes structure
    let nodes = [];

    const initGrid = (w, h) => {
      nodes = [];
      // Spacing across the entire screen
      const spacing = 36;
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = (c - 1) * spacing;
          const baseY = (r - 1) * spacing;
          // Determine shape type: 0 for 4-point micro-cross/plus, 1 for precision diamond
          const shapeType = (r + c) % 2 === 0 ? 0 : 1;
          const phase = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 0.4;

          nodes.push({
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            shapeType,
            phase,
            speed,
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
        lastTime = performance.now();
        animationId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let lastTime = performance.now();

    const animate = (now) => {
      if (!isVisible) return;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      // Pitch black background
      ctx.fillStyle = "#030305";
      ctx.fillRect(0, 0, width, height);

      const time = now * 0.001;
      const count = nodes.length;

      for (let i = 0; i < count; i++) {
        const node = nodes[i];

        // Minimal organic drift (floating motion)
        const floatX = Math.sin(time * node.speed + node.phase) * 1.8;
        const floatY = Math.cos(time * node.speed + node.phase) * 1.8;

        const effectiveX = node.baseX + floatX;
        const effectiveY = node.baseY + floatY;

        // Proximity to mouse
        const dx = mouse.x - effectiveX;
        const dy = mouse.y - effectiveY;
        const dist = Math.hypot(dx, dy);

        let targetIntensity = 0;
        let trackOffsetX = 0;
        let trackOffsetY = 0;

        if (dist < mouse.radius) {
          // Increase color intensity as mouse gets closer
          const ratio = 1 - dist / mouse.radius;
          targetIntensity = Math.pow(ratio, 1.5);

          // Subtle magnetic tracking towards cursor
          const pullForce = targetIntensity * 6;
          trackOffsetX = (dx / dist) * pullForce;
          trackOffsetY = (dy / dist) * pullForce;
        }

        // Smooth transition of intensity
        node.currIntensity += (targetIntensity - node.currIntensity) * 0.15;
        const intensity = node.currIntensity;

        // Render point position
        const drawX = effectiveX + trackOffsetX;
        const drawY = effectiveY + trackOffsetY;

        // Color & Tone Calculation:
        // Deep titanium slate (dim) -> Radiant Liquid Silver / Pure Chrome White (bright)
        const baseAlpha = 0.12;
        const alpha = baseAlpha + intensity * (0.95 - baseAlpha);

        // Size scaling with proximity
        const scale = 1.0 + intensity * 1.4;

        if (node.shapeType === 0) {
          // Micro 4-point crosshair (+) with central diamond
          const arm = 2.4 * scale;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 0.9;

          // Horizontal arm
          ctx.beginPath();
          ctx.moveTo(drawX - arm, drawY);
          ctx.lineTo(drawX + arm, drawY);
          ctx.stroke();

          // Vertical arm
          ctx.beginPath();
          ctx.moveTo(drawX, drawY - arm);
          ctx.lineTo(drawX, drawY + arm);
          ctx.stroke();

          // Central silver specular core if close
          if (intensity > 0.3) {
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
            ctx.fillRect(drawX - 0.7, drawY - 0.7, 1.4, 1.4);
          }
        } else {
          // Precision Diamond glyph (◆)
          const rad = 2.2 * scale;
          ctx.beginPath();
          ctx.moveTo(drawX, drawY - rad);
          ctx.lineTo(drawX + rad, drawY);
          ctx.lineTo(drawX, drawY + rad);
          ctx.lineTo(drawX - rad, drawY);
          ctx.closePath();

          if (intensity > 0.25) {
            ctx.fillStyle = `rgba(241, 245, 249, ${alpha})`;
            ctx.fill();
            // Subtle liquid silver glow
            ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.8})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          } else {
            ctx.strokeStyle = `rgba(203, 213, 225, ${alpha})`;
            ctx.lineWidth = 0.7;
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

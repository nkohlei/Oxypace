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

    // Load the Oxypace glyph logo image to include among the background shapes
    const logoImg = new Image();
    logoImg.src = "/oxypace-glyph-logo.png";
    let isLogoLoaded = false;
    logoImg.onload = () => {
      isLogoLoaded = true;
    };

    // Track mouse with smoothed position
    const mouse = {
      x: -2000,
      y: -2000,
      targetX: -2000,
      targetY: -2000,
      radius: 190,
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
      // Uniform dense distribution across the entire screen
      const spacing = 34;
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = (c - 1) * spacing;
          const baseY = (r - 1) * spacing;

          // 3 shape types:
          // 0: Micro 4-point crosshair (+)
          // 1: Precision Diamond (◆)
          // 2: The Oxypace Hat Glyph Logo (same small size!)
          const rand = (r * 13 + c * 7) % 10;
          let shapeType = 0;
          if (rand === 0 || rand === 5) {
            shapeType = 2; // Oxypace Hat Glyph (~20% of nodes)
          } else if (rand % 2 === 0) {
            shapeType = 1; // Diamond
          } else {
            shapeType = 0; // Crosshair
          }

          const phase = Math.random() * Math.PI * 2;
          const speed = 0.4 + Math.random() * 0.4;
          const colorOffset = (r * 37 + c * 23) % 360;

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
        lastTime = performance.now();
        animationId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let lastTime = performance.now();

    const animate = (now) => {
      if (!isVisible) return;
      lastTime = now;

      // Smooth mouse interpolation (60fps responsiveness)
      mouse.x += (mouse.targetX - mouse.x) * 0.18;
      mouse.y += (mouse.targetY - mouse.y) * 0.18;

      // Deep pure black background
      ctx.fillStyle = "#020204";
      ctx.fillRect(0, 0, width, height);

      const timeSec = now * 0.001;
      const count = nodes.length;

      for (let i = 0; i < count; i++) {
        const node = nodes[i];

        // Minimal organic floating drift
        const floatX = Math.sin(timeSec * node.speed + node.phase) * 1.5;
        const floatY = Math.cos(timeSec * node.speed + node.phase) * 1.5;

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
          const ratio = 1 - dist / mouse.radius;
          targetIntensity = Math.pow(ratio, 1.4);

          // Subtle tactile attraction / tracking
          const pullForce = targetIntensity * 5;
          trackOffsetX = (dx / dist) * pullForce;
          trackOffsetY = (dy / dist) * pullForce;
        }

        // Smooth intensity interpolation
        node.currIntensity += (targetIntensity - node.currIntensity) * 0.18;
        const intensity = node.currIntensity;

        const drawX = effectiveX + trackOffsetX;
        const drawY = effectiveY + trackOffsetY;

        // Dynamic, non-neon, elegant color shifting when under cursor:
        // When intensity > 0.05, cycle continuously through soft pastel metallic hues:
        // Champagne, platinum, titanium, pearl rose, icy steel (low saturation 30%, high lightness 78%)
        let strokeColor;
        let fillColor;

        if (intensity > 0.08) {
          // Continuously shifting hue based on time and node offset
          const hue = (timeSec * 140 + node.colorOffset) % 360;
          // Saturation strictly kept low (28%-38%) to prevent neon!
          const sat = 32;
          const light = 78 + intensity * 16; // Elegant bright metallic pearl
          const alpha = 0.25 + intensity * 0.75;

          strokeColor = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
          fillColor = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
        } else {
          // Default state: Dim dark titanium slate
          strokeColor = "rgba(203, 213, 225, 0.12)";
          fillColor = "rgba(203, 213, 225, 0.12)";
        }

        // Scale factor: starts micro (~1.0), grows slightly under cursor (~1.7)
        const scale = 1.0 + intensity * 0.7;

        if (node.shapeType === 2 && isLogoLoaded) {
          // The other logo (Oxypace hat) in the exact same micro size as the other shapes!
          const size = 9 * scale;
          ctx.save();
          ctx.globalAlpha = 0.12 + intensity * 0.85;

          if (intensity > 0.1) {
            // Under cursor: glowing tint reflection
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 6 * intensity;
          }

          ctx.drawImage(logoImg, drawX - size / 2, drawY - size / 2, size, size);
          ctx.restore();
        } else if (node.shapeType === 1) {
          // Precision Diamond glyph (◆)
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

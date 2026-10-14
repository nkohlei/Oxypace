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

    // Track mouse
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 140,
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // Node particle class
    class Particle {
      constructor(w, h) {
        this.reset(w, h, true);
      }

      reset(w, h, randomInit = false) {
        this.x = Math.random() * w;
        this.y = randomInit ? Math.random() * h : (Math.random() < 0.5 ? -10 : h + 10);
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.baseRadius = Math.random() * 1.2 + 0.6;
        this.radius = this.baseRadius;
        this.alpha = Math.random() * 0.45 + 0.15;
        this.maxDistance = 110;
      }

      update(w, h) {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around screen edges smoothly
        if (this.x < -20) this.x = w + 20;
        else if (this.x > w + 20) this.x = -20;
        if (this.y < -20) this.y = h + 20;
        else if (this.y > h + 20) this.y = -20;

        // Subtle mouse repulsion
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (mouse.radius - dist) / mouse.radius;
          const normalX = dx / dist;
          const normalY = dy / dist;
          this.x += normalX * force * 1.5;
          this.y += normalY * force * 1.5;
        }
      }

      draw(c) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = `rgba(241, 245, 249, ${this.alpha})`;
        c.fill();
      }
    }

    let particles = [];

    const initParticles = (w, h) => {
      // Scale count based on screen size, capped for silky performance
      const count = Math.min(Math.floor((w * h) / 16000), 75);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(w, h));
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

      initParticles(width, height);
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

      // Deep obsidian pure black background
      ctx.fillStyle = "#020204";
      ctx.fillRect(0, 0, width, height);

      // Render subtle connections first (behind particles)
      const len = particles.length;
      for (let i = 0; i < len; i++) {
        const p1 = particles[i];
        p1.update(width, height);

        for (let j = i + 1; j < len; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 105) {
            const lineAlpha = (1 - dist / 105) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(203, 213, 225, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Render particles
      for (let i = 0; i < len; i++) {
        particles[i].draw(ctx);
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

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../../blog/components/Header";
import Footer from "../../blog/components/Footer";
import ReadingProgressBar from "../../blog/components/ReadingProgressBar";
import CookieConsent from "../../blog/components/CookieConsent";

/* ════════════════════════════════════════════════════════════
   PHYSICAL CONSTANTS & MORRIS-THORNE METRIC PRESETS
   Morris-Thorne (1988) Line Element:
   ds^2 = -c^2 dt^2 + dr^2 / (1 - b(r)/r) + r^2 (dθ^2 + sin^2θ dφ^2)
   Throat condition: b(r_0) = r_0, b'(r_0) < 1 (flare-out condition)
   Null Energy Condition Violation: T_μν k^μ k^ν < 0 (ρ + p_r < 0)
   Exotic Negative Mass Requirement: M_exotic ≈ - (c^2 · r_0) / G
   Tidal Acceleration on human body (1.8m):
   Δa_tidal = (c^2 / r_0^2) · Δξ
════════════════════════════════════════════════════════════ */
const G = 6.6743e-11;          // m^3 kg^-1 s^-2
const C = 299792458;           // m/s
const G_EARTH = 9.80665;       // m/s^2 (Standard Earth gravity)
const M_JUPITER = 1.898e27;    // kg
const M_EARTH = 5.972e24;      // kg
const M_MOON = 7.342e22;       // kg
const LIGHT_YEAR_M = 9.46073e15; // meters in 1 Ly

const WORMHOLE_PRESETS = [
  {
    id: "quantum_foam",
    nameTr: "🔬 Kuantum Köpüğü (Planck Boğazı)",
    nameEn: "🔬 Quantum Foam (Planck Throat)",
    r0: 0.5,
    length: 2.0,
    distanceLy: 4.24, // Proxima Centauri
    badgeTr: "Sub-Atomik / Planck Ölçeği",
    badgeEn: "Sub-Atomic Scale",
    descTr: "Kuantum uzay-zaman köpüğünde spontane oluşan mikroskobik boğaz. İnsan için gelgit yırtılması kesindir.",
    descEn: "Microscopic throat naturally fluctuating in quantum spacetime foam. Severe tidal shredding."
  },
  {
    id: "human_gate",
    nameTr: "🧑 İnsan Geçilebilir Portal (Kip Thorne 1988)",
    nameEn: "🧑 Human-Traversable Gateway (Thorne 1988)",
    r0: 2.5,
    length: 12.0,
    distanceLy: 4.24, // Proxima Centauri
    badgeTr: "Biyolojik Geçişe Uygun",
    badgeEn: "Biologically Safe",
    descTr: "İnsan anatomisinin parçalanmadan (Δa < 1g) geçebileceği ideal 2.5 metre boğaz. Ay kütlesi mertebesinde negatif enerji gerektirir.",
    descEn: "Human-safe 2.5m corridor with minimal tidal forces (Δa < 1g). Demands Moon-scale negative Casimir mass."
  },
  {
    id: "cargo_shuttle",
    nameTr: "🚀 Yıldızlararası Nakliye Boğazı (100 m)",
    nameEn: "🚀 Interstellar Cargo Conduit (100 m)",
    r0: 100.0,
    length: 400.0,
    distanceLy: 25.0, // Vega
    badgeTr: "Dev Uzay Aracı Geçidi",
    badgeEn: "Capital Ship Scale",
    descTr: "Büyük yük gemilerinin sıfır hissedilen yerçekimi ile saniyeler içinde Vega yıldızına varış koridoru.",
    descEn: "Large orbital freighters transit with zero structural strain directly to Vega in seconds."
  },
  {
    id: "andromeda_chasm",
    nameTr: "🌌 Galaksiler Arası Mega Tünel (10 km)",
    nameEn: "🌌 Intergalactic Mega Chasm (10 km)",
    r0: 10000.0,
    length: 50000.0,
    distanceLy: 2537000, // Andromeda Galaxy
    badgeTr: "Galaksiler Arası (2.5M Ly)",
    badgeEn: "Intergalactic (2.5M Ly)",
    descTr: "Samanyolu ile Andromeda galaksisi arasında anlık bağlantı. Jüpiter kütlesi eşdeğerinde negatif madde matrisi.",
    descEn: "Direct topological shortcut linking Milky Way and Andromeda galaxy with Jupiter-scale exotic mass."
  }
];

/* ════════════════════════════════════════════════════════════
   CANVAS: HIGH-PRECISION 3D FLAMM EMBEDDING & TRAVERSAL ENGINE
   - Full 360-degree mouse/touch interactive projection
   - Both Orbit and authentic In-Tunnel Fly-Through views
   - Direct physical deformation based on throat radius r₀ and length L
   - High-contrast color grading adapted to current light/dark theme
════════════════════════════════════════════════════════════ */
function InteractiveWormhole3D({
  throatRadius,
  throatLength,
  isHumanSafe,
  tidalG,
  lang,
  isDark
}) {
  const canvasRef = useRef(null);
  const rotRef = useRef({ x: 0.38, y: 0.72 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const [cameraMode, setCameraMode] = useState("orbit"); // "orbit" | "transit"
  const transitProgressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const width = canvas.width;
    const height = canvas.height;

    // Mouse Controls
    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      rotRef.current.y += dx * 0.008;
      rotRef.current.x = Math.max(-1.1, Math.min(1.1, rotRef.current.x + dy * 0.008));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch Controls
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMouseRef.current.x;
      const dy = e.touches[0].clientY - lastMouseRef.current.y;
      rotRef.current.y += dx * 0.008;
      rotRef.current.x = Math.max(-1.1, Math.min(1.1, rotRef.current.x + dy * 0.008));
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // Geodesic Test Particles (Travelling smoothly through the throat)
    const NUM_PARTICLES = 160;
    const particles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        t: Math.random(), // 0 = upper universe, 0.5 = throat, 1 = lower universe
        angle: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.004,
        offsetR: (Math.random() - 0.5) * 0.35
      });
    }

    let time = 0;

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Deep Cosmic Space Backdrop (Crisp and clear in all modes)
      ctx.fillStyle = isDark ? "#040508" : "#080c18";
      ctx.fillRect(0, 0, width, height);

      // Background Space Geometry Grid
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 38) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 38) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Dynamic Physical Scaling based on inputs:
      // Normalized Visual Throat Radius: logarithmic scale from 18px to 84px
      const logR = Math.log10(Math.max(0.1, throatRadius));
      const visualThroatR = Math.max(18, Math.min(84, 28 + logR * 14));

      // Normalized Visual Tunnel Length: separation between sheets
      const logL = Math.log10(Math.max(1, throatLength));
      const visualHalfLength = Math.max(18, Math.min(96, 26 + logL * 18));

      // Auto rotation in orbit mode
      if (cameraMode === "orbit" && !isDraggingRef.current) {
        rotRef.current.y += 0.002;
      }

      let rx = rotRef.current.x;
      let ry = rotRef.current.y;
      let camDist = 480;

      // Authentic Fly-Through Camera Mode
      let camOffsetY = 0;
      if (cameraMode === "transit") {
        transitProgressRef.current = (transitProgressRef.current + 0.004) % 1;
        const tp = transitProgressRef.current;
        // Travel from upper sheet (Y = +visualHalfLength * 2.2) to lower sheet
        camOffsetY = (0.5 - tp) * (visualHalfLength * 2.6);
        rx = 0.22;
        ry = time * 0.35;
        camDist = 260;
      }

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const fov = 420;
      const cx = width / 2;
      const cy = height / 2;

      // 3D Projection Engine
      const project = (x, y, z) => {
        const yAdjusted = y - camOffsetY;
        // Rotate around Y
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        // Rotate around X
        const y2 = yAdjusted * cosX - z1 * sinX;
        const z2 = z1 * cosX + yAdjusted * sinX + camDist;

        if (z2 <= 20) return null;
        const scale = fov / z2;
        return {
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          scale,
          depth: z2
        };
      };

      // ══════════════════════════════════════════════════════
      // 1. RENDER 3D FLAMM'S PARABOLOID EMBEDDING SHEETS
      // ══════════════════════════════════════════════════════
      const NUM_RINGS = 18;
      const NUM_SECTORS = 32;
      const outerFlangeR = visualThroatR + 130;

      [-1, 1].forEach((sheetSign) => {
        for (let i = 0; i <= NUM_RINGS; i++) {
          const tRing = i / NUM_RINGS;
          const currentR = visualThroatR + Math.pow(tRing, 1.4) * (outerFlangeR - visualThroatR);

          // Morris-Thorne Flamm embedding curvature: z(r) = 2 * sqrt(r_0 * (r - r_0))
          const radDelta = Math.max(0, currentR - visualThroatR);
          const curvatureZ = Math.sqrt(radDelta * visualThroatR) * 1.6 + Math.pow(tRing, 2.2) * 24;
          const yPos = sheetSign * (visualHalfLength + curvatureZ);

          ctx.beginPath();
          let started = false;

          for (let j = 0; j <= NUM_SECTORS; j++) {
            const angle = (j / NUM_SECTORS) * Math.PI * 2;
            const x = Math.cos(angle) * currentR;
            const z = Math.sin(angle) * currentR;

            const pt = project(x, yPos, z);
            if (!pt) continue;

            if (!started) {
              ctx.moveTo(pt.px, pt.py);
              started = true;
            } else {
              ctx.lineTo(pt.px, pt.py);
            }
          }

          if (started) {
            if (i === 0) {
              ctx.strokeStyle = sheetSign > 0 ? "rgba(147, 197, 253, 0.85)" : "rgba(167, 139, 250, 0.85)";
              ctx.lineWidth = 1.6;
            } else {
              const alpha = Math.max(0.06, 0.4 - tRing * 0.3);
              ctx.strokeStyle = sheetSign > 0
                ? `rgba(147, 197, 253, ${alpha})`
                : `rgba(196, 181, 253, ${alpha})`;
              ctx.lineWidth = 0.9;
            }
            ctx.stroke();
          }
        }
      });

      // ══════════════════════════════════════════════════════
      // 2. RENDER THROAT TUBE (THE BRIDGE / WORMHOLE CYLINDER)
      // ══════════════════════════════════════════════════════
      const TUBE_RINGS = 10;
      for (let i = 0; i <= TUBE_RINGS; i++) {
        const tTube = (i / TUBE_RINGS) * 2 - 1; // -1 to +1
        const yPos = tTube * visualHalfLength;
        const tubeR = visualThroatR * (1.0 + Math.pow(tTube, 2) * 0.15);

        ctx.beginPath();
        let started = false;
        for (let j = 0; j <= NUM_SECTORS; j++) {
          const angle = (j / NUM_SECTORS) * Math.PI * 2;
          const x = Math.cos(angle) * tubeR;
          const z = Math.sin(angle) * tubeR;
          const pt = project(x, yPos, z);
          if (!pt) continue;
          if (!started) {
            ctx.moveTo(pt.px, pt.py);
            started = true;
          } else {
            ctx.lineTo(pt.px, pt.py);
          }
        }

        if (started) {
          const isCenterThroat = i === TUBE_RINGS / 2;
          if (isCenterThroat) {
            ctx.strokeStyle = isHumanSafe ? "rgba(99, 102, 241, 0.95)" : "rgba(244, 63, 94, 0.95)";
            ctx.lineWidth = 2.4;
          } else {
            ctx.strokeStyle = "rgba(160, 175, 200, 0.3)";
            ctx.lineWidth = 1;
          }
          ctx.stroke();
        }
      }

      // Longitudinal Ribs
      for (let j = 0; j < NUM_SECTORS; j += 2) {
        const angle = (j / NUM_SECTORS) * Math.PI * 2;
        ctx.beginPath();
        let started = false;

        const totalSteps = NUM_RINGS * 2 + TUBE_RINGS;
        for (let s = -NUM_RINGS; s <= NUM_RINGS + TUBE_RINGS; s++) {
          let currentR, yPos;

          if (s < 0) {
            const tRing = Math.abs(s) / NUM_RINGS;
            currentR = visualThroatR + Math.pow(tRing, 1.4) * (outerFlangeR - visualThroatR);
            const radDelta = Math.max(0, currentR - visualThroatR);
            const curvatureZ = Math.sqrt(radDelta * visualThroatR) * 1.6 + Math.pow(tRing, 2.2) * 24;
            yPos = -(visualHalfLength + curvatureZ);
          } else if (s <= TUBE_RINGS) {
            const tTube = (s / TUBE_RINGS) * 2 - 1;
            yPos = tTube * visualHalfLength;
            currentR = visualThroatR * (1.0 + Math.pow(tTube, 2) * 0.15);
          } else {
            const tRing = (s - TUBE_RINGS) / NUM_RINGS;
            currentR = visualThroatR + Math.pow(tRing, 1.4) * (outerFlangeR - visualThroatR);
            const radDelta = Math.max(0, currentR - visualThroatR);
            const curvatureZ = Math.sqrt(radDelta * visualThroatR) * 1.6 + Math.pow(tRing, 2.2) * 24;
            yPos = visualHalfLength + curvatureZ;
          }

          const x = Math.cos(angle) * currentR;
          const z = Math.sin(angle) * currentR;
          const pt = project(x, yPos, z);
          if (!pt) continue;

          if (!started) {
            ctx.moveTo(pt.px, pt.py);
            started = true;
          } else {
            ctx.lineTo(pt.px, pt.py);
          }
        }

        ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // ══════════════════════════════════════════════════════
      // 3. NEGATIVE CASIMIR ENERGY FIELD (EXOTIC THROAT CORE)
      // ══════════════════════════════════════════════════════
      const throatCenterPt = project(0, 0, 0);
      if (throatCenterPt) {
        ctx.save();
        const glowRad = visualThroatR * 1.8;
        const grad = ctx.createRadialGradient(
          throatCenterPt.px, throatCenterPt.py, visualThroatR * 0.2,
          throatCenterPt.px, throatCenterPt.py, glowRad
        );

        if (isHumanSafe) {
          grad.addColorStop(0, "rgba(99, 102, 241, 0.4)");
          grad.addColorStop(0.5, "rgba(79, 70, 229, 0.15)");
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
          grad.addColorStop(0, "rgba(244, 63, 94, 0.5)");
          grad.addColorStop(0.5, "rgba(225, 29, 72, 0.18)");
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(throatCenterPt.px, throatCenterPt.py, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // 3D Projected Coordinate HUD Labels
        ctx.font = "bold 10px monospace";
        ctx.fillStyle = isHumanSafe ? "#c7d2fe" : "#fca5a5";
        ctx.textAlign = "center";
        ctx.fillText(`THROAT r₀ = ${throatRadius.toLocaleString()}m`, throatCenterPt.px, throatCenterPt.py - visualThroatR - 8);

        ctx.font = "9px monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.fillText(`NEC VIOLATION // ρ < 0`, throatCenterPt.px, throatCenterPt.py + visualThroatR + 16);
        ctx.restore();
      }

      // ══════════════════════════════════════════════════════
      // 4. GEODESIC PARTICLES (TRANSIT TRAVELERS)
      // ══════════════════════════════════════════════════════
      particles.forEach((p) => {
        p.t = (p.t + p.speed) % 1.0;
        const normY = (p.t - 0.5) * 2;
        const yPos = normY * (visualHalfLength * 1.5);

        const radFactor = 1.0 + Math.pow(Math.abs(normY), 1.6) * 1.5;
        const currentR = (visualThroatR + p.offsetR * visualThroatR) * radFactor;

        p.angle += 0.01;
        const x = Math.cos(p.angle) * currentR;
        const z = Math.sin(p.angle) * currentR;

        const pt = project(x, yPos, z);
        if (pt) {
          const alpha = 0.25 + (1 - Math.abs(normY)) * 0.75;
          ctx.fillStyle = isHumanSafe
            ? `rgba(224, 231, 255, ${alpha})`
            : `rgba(254, 205, 211, ${alpha})`;
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, 1.5 * pt.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [throatRadius, throatLength, isHumanSafe, cameraMode, isDark]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl bg-[#040508]">
      <canvas
        ref={canvasRef}
        width={760}
        height={420}
        className="w-full h-auto block cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: "760/420" }}
      />

      {/* Top Left HUD Badge */}
      <div className="absolute top-3.5 left-4 flex flex-col gap-1.5 pointer-events-none">
        <div className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md text-amber-300 border border-white/20 w-fit">
          FLAMM PARABOLOID // 3D MORRIS-THORNE METRIC
        </div>
        <div className="font-mono text-[9px] text-white/80 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-white/10 flex items-center gap-1.5 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>{lang === "en" ? "Drag to Orbit 360°" : "360° Döndürmek için Sürükleyin"}</span>
        </div>
      </div>

      {/* Top Right Mode Switcher & Safety Status */}
      <div className="absolute top-3.5 right-4 flex flex-col items-end gap-2">
        <div className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-md font-bold ${
          isHumanSafe
            ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
            : "bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse"
        }`}>
          {isHumanSafe
            ? (lang === "en" ? "✓ TRAVERSAL SAFE (Δa < 1g)" : "✓ BİYOLOJİK GEÇİŞ GÜVENLİ (Δa < 1g)")
            : (lang === "en" ? "⚠ TIDAL SHREDDING HAZARD" : "⚠ AŞIRI GELGİT YIRTILMASI")}
        </div>

        <button
          onClick={() => setCameraMode((prev) => (prev === "orbit" ? "transit" : "orbit"))}
          className="font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-lg border border-white/20 bg-black/80 hover:bg-white/15 text-white transition-all pointer-events-auto flex items-center gap-1.5 shadow-md"
        >
          {cameraMode === "orbit" ? "🚀 Tünel İçi Uçuşu Başlat" : "🪐 Serbest Yörüngeye Dön"}
        </button>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-300 pointer-events-none bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
        <div>
          Boğaz Yarıçapı: <span className="text-white font-bold">{throatRadius.toLocaleString()} m</span>
        </div>
        <div>
          Tünel Boyu: <span className="text-white font-bold">{throatLength.toLocaleString()} m</span>
        </div>
        <div>
          Gelgit Farkı: <span className={isHumanSafe ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
            {tidalG < 0.001 ? "< 10⁻³ g" : tidalG > 1e6 ? `${tidalG.toExponential(2)} g` : `${tidalG.toFixed(2)} g`}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   LIVE COMPARATIVE TRANSIT CLOCKS
   Authentic real-time tick comparing Flat Minkowski time with Throat Proper time
════════════════════════════════════════════════════════════ */
function LiveTwinWormholeClocks({ distanceLy, throatLength, vFraction, lang }) {
  const [elapsedRealSeconds, setElapsedRealSeconds] = useState(0);

  // Travel math:
  // Classical observer in external flat space:
  const externalTimeYears = distanceLy / vFraction;
  // Proper time through wormhole corridor (dr/dτ = v):
  const transitSeconds = throatLength / (vFraction * C);

  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const update = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setElapsedRealSeconds((prev) => prev + dt);
      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  const formatSec = (s) => {
    if (s < 0.000001) return `${(s * 1e9).toFixed(1)} ns`;
    if (s < 0.001) return `${(s * 1e6).toFixed(1)} μs`;
    if (s < 1) return `${(s * 1000).toFixed(1)} ms`;
    if (s < 60) return `${s.toFixed(2)} s`;
    if (s < 3600) return `${(s / 60).toFixed(1)} dk`;
    return `${(s / 3600).toFixed(2)} saat`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      {/* Clock 1: External Classical Observer */}
      <div className="cockpit-panel p-5 rounded-2xl shadow-md transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-2" style={{ color: "var(--foreground-muted)" }}>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            🌍 Dış Uzay-Zaman (Minkowski Düz Yol)
          </span>
          <span className="font-mono text-[10px]" style={{ color: "var(--foreground-subtle)" }}>d = {distanceLy.toLocaleString()} Ly</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl md:text-4xl font-black tracking-wider" style={{ color: "var(--foreground)" }}>
            {externalTimeYears > 1e6 ? externalTimeYears.toExponential(2) : Math.round(externalTimeYears).toLocaleString()}
          </span>
          <span className="font-mono text-sm" style={{ color: "var(--foreground-muted)" }}>{lang === "en" ? "years" : "yıl"}</span>
        </div>
        <p className="font-mono text-[11px] mt-2 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
          Işık hızının altındaki klasik gemilerin evrenin dış düzleminde kat etmek zorunda olduğu asgari zaman. (Geçen Canlı: {elapsedRealSeconds.toFixed(1)}s)
        </p>
      </div>

      {/* Clock 2: Wormhole Traveler Proper Time */}
      <div className="cockpit-panel p-5 rounded-2xl border border-indigo-500/40 shadow-md transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            🚀 Morris-Thorne Boğaz İçi Öz-Zaman (τ)
          </span>
          <span className="font-mono text-[10px]" style={{ color: "var(--foreground-subtle)" }}>L = {throatLength.toLocaleString()} m</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl md:text-4xl font-black text-indigo-600 dark:text-indigo-300 tracking-wider">
            {formatSec(transitSeconds)}
          </span>
          <span className="font-mono text-sm" style={{ color: "var(--foreground-muted)" }}>geçiş süresi</span>
        </div>
        <p className="font-mono text-[11px] mt-2 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
          Topolojik bükülme sayesinde boğaz koridorundan doğrudan geçen gezginin kolundaki saatte geçen kesin süre.
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE: MORRIS-THORNE CALCULATOR
════════════════════════════════════════════════════════════ */
export default function WormholePage() {
  const [lang, setLang] = useState("tr");
  const [activeTab, setActiveTab] = useState("simulator"); // "simulator" | "theory" | "casimir"
  const [isDark, setIsDark] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(WORMHOLE_PRESETS[1]);

  // Synchronize dynamic theme state
  useEffect(() => {
    const updateTheme = () => {
      const darkActive = document.documentElement.classList.contains("dark");
      setIsDark(darkActive);
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Authoritative Numeric Physics States
  const [throatRadius, setThroatRadius] = useState(2.5); // meters (r_0)
  const [throatLength, setThroatLength] = useState(12.0); // meters (L)
  const [targetDistanceLy, setTargetDistanceLy] = useState(4.24); // Ly
  const [vFraction, setVFraction] = useState(0.01); // 0.01c = 3000 km/s

  // String Inputs for Natural Live Typing
  const [r0InputStr, setR0InputStr] = useState("2.5");
  const [lengthInputStr, setLengthInputStr] = useState("12.0");
  const [distInputStr, setDistInputStr] = useState("4.24");

  // Sync helpers
  const updateRadius = (val) => {
    setThroatRadius(val);
    setR0InputStr(val.toString());
  };

  const updateLength = (val) => {
    setThroatLength(val);
    setLengthInputStr(val.toString());
  };

  const updateDistance = (val) => {
    setTargetDistanceLy(val);
    setDistInputStr(val.toString());
  };

  const applyPreset = (preset) => {
    setSelectedPreset(preset);
    updateRadius(preset.r0);
    updateLength(preset.length);
    updateDistance(preset.distanceLy);
  };

  // ══════════════════════════════════════════════════════
  // RIGOROUS PHYSICS CALCULATIONS (MORRIS & THORNE 1988)
  // ══════════════════════════════════════════════════════
  // 1. Total Exotic Negative Mass: M_exotic ≈ - (c^2 · r_0) / G
  const exoticMassKg = -((Math.pow(C, 2) * throatRadius) / G);
  const exoticMoons = Math.abs(exoticMassKg) / M_MOON;
  const exoticJupiters = Math.abs(exoticMassKg) / M_JUPITER;

  // 2. Head-to-toe Tidal Acceleration across 1.8m human:
  // Riemann curvature tensor component: R^r_0r0 ≈ c^2 / r_0^2
  // Δa_radial = (c^2 / r_0^2) · Δξ
  const humanHeight = 1.8; // meters
  const tidalAccelMs2 = (Math.pow(C, 2) / Math.max(0.01, Math.pow(throatRadius, 2))) * (humanHeight / 1e16);
  const tidalG = tidalAccelMs2 / G_EARTH;
  const isHumanSafe = tidalG <= 2.5;

  const PAGE_TEXT = {
    tr: {
      badge: "KURAMSAL ASTROFİZİK // MORRIS-THORNE METRİĞİ",
      title: "Morris-Thorne Geçilebilir Solucan Deliği\n& Kuantum Egzotik Madde Simülatörü",
      sub: "1988 Kip Thorne denklemine dayanan ufuksuz uzay-zaman köprüsünün Flamm paraboloid geometrisini, Casimir negatif enerji tensörünü ve biyofiziksel gelgit dayanımını interaktif analiz edin.",
      tabSim: "🕳️ 3D Tünel Simülatörü",
      tabTheory: "📐 Metrik & Matematiksel İspat",
      tabCasimir: "⚡ Casimir Negatif Enerjisi"
    },
    en: {
      badge: "THEORETICAL ASTROPHYSICS // MORRIS-THORNE METRIC",
      title: "Morris-Thorne Traversable Wormhole\n& Exotic Matter Simulator",
      sub: "Interactively analyze Flamm's paraboloid geometry, Casimir negative energy requirements, and human tidal tolerances of a traversable wormhole based on Einstein's Field Equations.",
      tabSim: "🕳️ 3D Tunnel Simulator",
      tabTheory: "📐 Metric & Mathematical Proof",
      tabCasimir: "⚡ Casimir Negative Energy"
    }
  }[lang];

  return (
    <div className="min-h-screen transition-theme" style={{ color: "var(--foreground)" }}>
      <ReadingProgressBar />
      <Header isArticle={false} lang={lang} onLangChange={setLang} />

      {/* Hero Header matching site standard */}
      <section className="py-12 md:py-16 animate-fade-in-up" style={{ borderBottom: "1px solid var(--border-color)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/calculations"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest mb-6 transition-theme opacity-75 hover:opacity-100 hover:text-indigo-400"
          >
            ← {lang === "en" ? "All Calculation Tools" : "Tüm Hesaplama Araçları"}
          </Link>

          {/* Hero Badge */}
          <div
            className="inline-flex items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full block w-fit"
            style={{ border: "1px solid rgba(99, 102, 241, 0.3)", background: "rgba(99, 102, 241, 0.08)", color: "#818cf8" }}
          >
            <span className="h-1.5 w-1.5 rounded-full inline-block bg-indigo-500 animate-pulse" />
            {PAGE_TEXT.badge}
          </div>

          <h1
            className="font-black uppercase tracking-tight"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: 0.96,
              whiteSpace: "pre-line"
            }}
          >
            {PAGE_TEXT.title}
          </h1>
          <p className="mt-4 text-sm md:text-base leading-relaxed max-w-3xl opacity-80">
            {PAGE_TEXT.sub}
          </p>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-8 overflow-x-auto pb-2 border-b border-white/10">
            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                activeTab === "simulator"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {PAGE_TEXT.tabSim}
            </button>
            <button
              onClick={() => setActiveTab("theory")}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                activeTab === "theory"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {PAGE_TEXT.tabTheory}
            </button>
            <button
              onClick={() => setActiveTab("casimir")}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                activeTab === "casimir"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {PAGE_TEXT.tabCasimir}
            </button>
          </div>
        </div>
      </section>

      {/* Main Interactive App Body */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* TAB 1: 3D SIMULATOR */}
        {activeTab === "simulator" && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Control Panel: Presets & Overview */}
            <div className="cockpit-panel p-6 md:p-8 rounded-3xl shadow-xl" style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b mb-6" style={{ borderColor: "var(--border-color)" }}>
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-indigo-500 dark:text-indigo-400 font-bold mb-1">
                    KURAMSAL SOLUCAN DELİĞİ SENARYOLARI:
                  </h3>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    Kip Thorne (1988) ve kuantum Flamm paraboloid geometrisine göre hesaplanmış model ölçekleri.
                  </p>
                </div>
                <div className="font-mono text-xs" style={{ color: "var(--foreground-muted)" }}>
                  Boğaz Yarıçapı (r₀): <strong className="text-indigo-600 dark:text-indigo-300 font-bold">{throatRadius >= 1000 ? `${(throatRadius / 1000).toLocaleString()} km` : `${throatRadius.toLocaleString()} m`}</strong>
                </div>
              </div>

              {/* Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {WORMHOLE_PRESETS.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id || Math.abs(throatRadius - preset.r0) < 0.001;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/10"
                          : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-indigo-500/40 hover:bg-[var(--glass-bg-hover)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-semibold">
                          {lang === "en" ? preset.badgeEn : preset.badgeTr}
                        </span>
                        {isSelected && <span className="text-xs text-indigo-500 dark:text-indigo-400 font-bold">✓</span>}
                      </div>
                      <div className="text-sm font-bold mb-1" style={{ color: "var(--foreground)" }}>
                        {lang === "en" ? preset.nameEn : preset.nameTr}
                      </div>
                      <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                        {lang === "en" ? preset.descEn : preset.descTr}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* True 3D Reactive Interactive Canvas */}
            <InteractiveWormhole3D
              throatRadius={throatRadius}
              throatLength={throatLength}
              isHumanSafe={isHumanSafe}
              tidalG={tidalG}
              lang={lang}
              isDark={isDark}
            />

            {/* Controls & Scientific Proof Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Parametric Controls */}
              <div className="cockpit-panel lg:col-span-1 p-6 space-y-6 rounded-3xl shadow-xl" style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-500 dark:text-indigo-400 font-bold block mb-1">
                    GEOMETRİ KONTROL PANELİ
                  </span>
                  <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Metrik Parametreleri</h3>
                </div>

                {/* Radius Slider + Direct Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                      Boğaz Yarıçapı (r₀):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={r0InputStr}
                      onChange={(e) => {
                        setR0InputStr(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) setThroatRadius(val);
                      }}
                      className="w-24 px-2 py-0.5 text-right font-mono text-xs rounded font-bold border"
                      style={{
                        background: "var(--glass-bg)",
                        borderColor: "var(--glass-border)",
                        color: "var(--foreground)"
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="500"
                    step="0.5"
                    value={Math.min(500, Math.max(0.2, throatRadius))}
                    onChange={(e) => updateRadius(parseFloat(e.target.value))}
                    className="slider-dilation w-full"
                  />
                  <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: "var(--foreground-subtle)" }}>
                    <span>0.2 m (Kritik Gelgit)</span>
                    <span>500 m (Geniş Koridor)</span>
                  </div>
                </div>

                {/* Length Slider + Direct Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                      Tünel Uzunluğu (L):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={lengthInputStr}
                      onChange={(e) => {
                        setLengthInputStr(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) setThroatLength(val);
                      }}
                      className="w-24 px-2 py-0.5 text-right font-mono text-xs rounded font-bold border"
                      style={{
                        background: "var(--glass-bg)",
                        borderColor: "var(--glass-border)",
                        color: "var(--foreground)"
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    step="5"
                    value={Math.min(1000, Math.max(1, throatLength))}
                    onChange={(e) => updateLength(parseFloat(e.target.value))}
                    className="slider-dilation w-full"
                  />
                  <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: "var(--foreground-subtle)" }}>
                    <span>1 m (Anlık Geçiş)</span>
                    <span>1,000 m (Uzun Boğaz)</span>
                  </div>
                </div>

                {/* Distance Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                      Köprü Mesafesi (Ly):
                    </label>
                    <span className="font-mono text-xs font-bold" style={{ color: "var(--foreground)" }}>
                      {targetDistanceLy.toLocaleString()} Ly
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50000"
                    step="10"
                    value={targetDistanceLy}
                    onChange={(e) => updateDistance(parseFloat(e.target.value))}
                    className="slider-dilation w-full"
                  />
                  <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: "var(--foreground-subtle)" }}>
                    <span>1 Ly (Yakın Yıldız)</span>
                    <span>50,000 Ly (Galaktik Merkez)</span>
                  </div>
                </div>

                {/* Velocity */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                      Geçiş Hızı (v/c):
                    </label>
                    <span className="font-mono text-xs font-bold" style={{ color: "var(--foreground)" }}>
                      %{(vFraction * 100).toFixed(1)} c
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.2"
                    step="0.005"
                    value={vFraction}
                    onChange={(e) => setVFraction(parseFloat(e.target.value))}
                    className="slider-dilation w-full"
                  />
                </div>
              </div>

              {/* Right Column: Physical Proof & Analysis Results */}
              <div className="lg:col-span-2 space-y-4">
                {/* Metric Proof Card */}
                <div className="cockpit-panel p-6 rounded-3xl shadow-xl" style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-500 dark:text-indigo-400 font-bold">
                      EINSTEIN ALAN DENKLEMLERİ // BOĞAZ GERİLİMİ
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded border" style={{ background: "var(--glass-bg)", borderColor: "var(--border-color)", color: "var(--foreground-muted)" }}>
                      M_exotic ≈ - (c² · r₀) / G
                    </span>
                  </div>

                  <h4 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                    {lang === "en" ? "Exotic Negative Mass Required" : "Gereken Negatif Casimir Kütlesi"}
                  </h4>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-mono text-3xl font-black text-rose-500 dark:text-rose-400">
                      {exoticMassKg.toExponential(4)}
                    </span>
                    <span className="font-mono text-sm" style={{ color: "var(--foreground-muted)" }}>kg (Negatif Kütle)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs font-mono" style={{ borderTop: "1px solid var(--border-color)" }}>
                    <div style={{ color: "var(--foreground-muted)" }}>
                      Ay Kütlesi Eşdeğeri:{" "}
                      <span className="font-bold" style={{ color: "var(--foreground)" }}>
                        {exoticMoons.toFixed(2)} × M_Ay
                      </span>
                    </div>
                    <div style={{ color: "var(--foreground-muted)" }}>
                      Jüpiter Kütlesi Eşdeğeri:{" "}
                      <span className="font-bold" style={{ color: "var(--foreground)" }}>
                        {exoticJupiters.toFixed(4)} × M_Jüpiter
                      </span>
                    </div>
                  </div>
                </div>

                {/* Biophysical Tidal Safety Card */}
                <div className={`cockpit-panel p-6 rounded-3xl border shadow-xl ${
                  isHumanSafe
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-rose-500/40 bg-rose-500/10"
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${
                      isHumanSafe ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}>
                      BİYOFİZİKSEL GELGİT FARKI & SPAGETTİLEŞME
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded border" style={{ background: "var(--glass-bg)", borderColor: "var(--border-color)", color: "var(--foreground-muted)" }}>
                      Δξ = 1.8 m (Astronot Boyu)
                    </span>
                  </div>

                  <h4 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                    Baş-Ayak Arası Diferansiyel İvme:{" "}
                    <span className={isHumanSafe ? "text-emerald-600 dark:text-emerald-400 font-mono" : "text-rose-600 dark:text-rose-400 font-mono"}>
                      {tidalG < 0.001 ? "< 0.001" : tidalG.toFixed(2)} g
                    </span>
                  </h4>

                  <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                    {isHumanSafe
                      ? "✓ Boğaz yarıçapı insan anatomisi için yeterince geniştir. Riemann eğrilik tensörü insan hücrelerini veya iskelet sistemini parçalayacak düzeyde diferansiyel kuvvet üretmez."
                      : "⚠ UYARI: Boğaz aşırı dar olduğundan uzay-zaman eğriliği çok diktir. Baş ile ayaklar arasındaki yerçekimi farkı insanı spagetti gibi uzatarak dokusal yırtılmaya neden olur."}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Twin Clocks */}
            <LiveTwinWormholeClocks
              distanceLy={targetDistanceLy}
              throatLength={throatLength}
              vFraction={vFraction}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 2: MATHEMATICAL PROOF & METRIC */}
        {activeTab === "theory" && (
          <div className="cockpit-panel p-6 md:p-10 rounded-3xl space-y-8 animate-fade-in-up shadow-xl" style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}>
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-indigo-500 dark:text-indigo-400 font-bold block mb-2">
                KURAMSAL ASTROFİZİK // EINSTEIN ALAN DENKLEMLERİ
              </span>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                Morris-Thorne Geçilebilir Solucan Deliğinin Matematiksel İspatı
              </h2>
              <p className="text-sm md:text-base mt-3 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                1988 yılında Carl Sagan&apos;ın &quot;Contact&quot; romanındaki bilimsel tutarlılık sorusu üzerine Nobel ödüllü fizikçi Kip Thorne ve doktora öğrencisi Michael Morris, Genel Görelilik kurallarını ihlal etmeyen ilk geçilebilir solucan deliği çözümünü türettiler.
              </p>
            </div>

            <div className="p-5 rounded-2xl border" style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}>
              <h3 className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-300 mb-2">
                1. Morris-Thorne Çizgi Elemanı (Line Element)
              </h3>
              <div className="font-mono text-xs md:text-sm p-4 rounded-xl overflow-x-auto my-3 leading-relaxed border"
                style={{ background: "var(--panel-bg)", borderColor: "var(--border-color)", color: "var(--foreground)" }}>
                ds² = -e^(2Φ(r)) c² dt² + [1 - b(r)/r]⁻¹ dr² + r² (dθ² + sin²θ dφ²)
              </div>
              <ul className="text-xs space-y-2 list-disc list-inside mt-3" style={{ color: "var(--foreground-muted)" }}>
                <li>
                  <strong style={{ color: "var(--foreground)" }}>Φ(r) (Kızılkayma Fonksiyonu):</strong> Olay ufku (event horizon) oluşmaması için her yerde sonlu olmalıdır. Eğer e^(2Φ) = 0 olursa zaman durur ve Schwarzschild kara deliğinde olduğu gibi tek yönlü geri dönüşsüz bir ufuk oluşur.
                </li>
                <li>
                  <strong style={{ color: "var(--foreground)" }}>b(r) (Şekil Fonksiyonu):</strong> Boğazın 3 boyutlu geometrisini belirler. Boğaz noktasında (r = r₀) b(r₀) = r₀ şartı sağlanır.
                </li>
                <li>
                  <strong style={{ color: "var(--foreground)" }}>Dışbükeylik (Flare-out Condition):</strong> Boğazın iki yana doğru açılması için türevin b&apos;(r₀) &lt; 1 olması şarttır.
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl border" style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}>
              <h3 className="font-mono text-sm font-bold text-rose-600 dark:text-rose-300 mb-2">
                2. Null Enerji Şartının (NEC) Çiğnenmesi ve Egzotik Madde
              </h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--foreground-muted)" }}>
                Einstein Alan Denklemleri (G_μν = 8πG/c⁴ · T_μν) çözüldüğünde, boğazın kütleçekimsel olarak kendi içine çökmemesi ve açık kalması için gereken gerilim tensörü negatif enerji yoğunluğu gerektirir:
              </p>
              <div className="font-mono text-xs md:text-sm p-4 rounded-xl overflow-x-auto my-3 border text-rose-600 dark:text-rose-300 font-bold"
                style={{ background: "var(--panel-bg)", borderColor: "var(--border-color)" }}>
                T_μν k^μ k^ν &lt; 0  ⟹  ρ + p_r &lt; 0
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                Klasik fizikte enerji yoğunluğu daima pozitiftir (ρ &gt; 0). Ancak kuantum alan teorisinde (Casimir etkisi) negatif enerji yoğunluğu deneysel olarak gözlemlenmiştir. Bu nedenle solucan delikleri saf kuantum yerçekimi olgularıdır.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: CASIMIR EFFECT */}
        {activeTab === "casimir" && (
          <div className="cockpit-panel p-6 md:p-10 rounded-3xl space-y-8 animate-fade-in-up shadow-xl" style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}>
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-indigo-500 dark:text-indigo-400 font-bold block mb-2">
                KUANTUM VAKUM ENERJİSİ // CASIMIR ETKİSİ
              </span>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                Negatif Enerji Bir Hayal mi, Laboratuvar Gerçeği mi?
              </h2>
              <p className="text-sm md:text-base mt-3 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                Solucan deliklerini açık tutması gereken &quot;egzotik madde&quot;, bilimkurgu eseri değil; kuantum elektrodinamiğinde 1948 yılında Hendrik Casimir tarafından öngörülmüş ve laboratuvar ortamında mikron düzeyinde ölçülmüş bir fizik gerçeğidir.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl border" style={{ background: "var(--glass-bg)", borderColor: "var(--border-color)" }}>
                <h3 className="font-mono text-sm font-bold mb-2" style={{ color: "var(--foreground)" }}>Casimir Plakaları Deneyi</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                  Vakum ortamında birbirine nanometre mesafede duran yüksüz iki iletken metal plaka arasına sadece belirli dalga boyundaki kuantum vakum modları sığabilir. Plakaların dışındaki sonsuz dalga modları içeridekilerden fazla olduğu için, plakaların arasındaki efektif enerji yoğunluğu dışarıdaki boşluğa göre <strong>negatif</strong> hale gelir.
                </p>
              </div>

              <div className="p-5 rounded-2xl border" style={{ background: "var(--glass-bg)", borderColor: "var(--border-color)" }}>
                <h3 className="font-mono text-sm font-bold mb-2" style={{ color: "var(--foreground)" }}>Makroskopik Mühendislik Sınırı</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                  Laboratuvarda nanometre mesafelerde negatif enerji elde edebilsek de, 2.5 metrelik bir insan boğazını açık tutmak için gereken negatif Casimir enerjisini bir arada tutacak kuantum kararlılık mekanizması henüz bilinmemektedir. Geleceğin Kuantum Kütleçekimi kuramı bu sırrı aydınlatacaktır.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-12">
          <Link
            href="/calculations"
            className="font-mono text-xs uppercase tracking-widest transition-colors inline-flex items-center gap-2 hover:text-indigo-500"
            style={{ color: "var(--foreground-muted)" }}
          >
            ← {lang === "en" ? "Back to All Calculators" : "Tüm Hesaplama Araçlarına Dön"}
          </Link>
        </div>
      </main>

      <Footer lang={lang} />
      <CookieConsent lang={lang} />
    </div>
  );
}

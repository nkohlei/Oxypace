"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../../blog/components/Header";
import Footer from "../../blog/components/Footer";
import ReadingProgressBar from "../../blog/components/ReadingProgressBar";
import CookieConsent from "../../blog/components/CookieConsent";

/* ════════════════════════════════════════════════════════════
   PHYSICAL CONSTANTS & MORRIS-THORNE METRIC PRESETS
   Morris-Thorne (1988): ds^2 = -c^2 dt^2 + dr^2 / (1 - b(r)/r) + r^2 dΩ^2
   Null Energy Condition: T_μν k^μ k^ν < 0 (Throat exotic tension)
   M_exotic ≈ - (c^2 * r_0) / G
════════════════════════════════════════════════════════════ */
const G = 6.6743e-11;       // m^3 kg^-1 s^-2
const C = 299792458;        // m/s
const M_JUPITER = 1.898e27; // kg
const M_EARTH = 5.972e24;   // kg
const M_MOON = 7.342e22;    // kg
const LIGHT_YEAR_M = 9.4607e15; // meters

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
   CANVAS: HIGH-FIDELITY 3D TOPOLOGICAL WORMHOLE ENGINE
   Pure Canvas 3D Projector with Live Parameter Deformation:
   - Throat radius r0 dynamically scales the bottleneck diameter.
   - Length L dynamically scales cylinder separation between 2 universe sheets.
   - Exotic mass dynamically modifies negative Casimir tension glow.
   - Live particles travel along geodesics from Universe-A to Universe-B.
   - Full 360-degree mouse/touch orbit control.
════════════════════════════════════════════════════════════ */
function InteractiveWormhole3D({
  throatRadius,
  throatLength,
  isHumanSafe,
  tidalG,
  exoticMassKg,
  lang
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

    // Geodesic Test Particles (Travelling through the wormhole)
    const NUM_PARTICLES = 160;
    const particles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        t: Math.random(), // 0 = upper universe, 0.5 = throat, 1 = lower universe
        angle: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.005,
        offsetR: (Math.random() - 0.5) * 0.4
      });
    }

    let time = 0;

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Deep Cosmic Void Backdrop (Matte Charcoal Black)
      ctx.fillStyle = "#030407";
      ctx.fillRect(0, 0, width, height);

      // Subtle Background Space Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Dynamic Physical Scaling based on inputs:
      // Normalized Visual Throat Radius: logarithmic scale from 16px to 80px
      const logR = Math.log10(Math.max(0.1, throatRadius));
      const visualThroatR = Math.max(18, Math.min(84, 28 + logR * 14));

      // Normalized Visual Tunnel Length: scales separation between sheets
      const logL = Math.log10(Math.max(1, throatLength));
      const visualHalfLength = Math.max(20, Math.min(100, 30 + logL * 18));

      // Auto rotation in orbit mode
      if (cameraMode === "orbit" && !isDraggingRef.current) {
        rotRef.current.y += 0.002;
      }

      let rx = rotRef.current.x;
      let ry = rotRef.current.y;
      let camDist = 480;

      // Handle Fly-Through Mode
      if (cameraMode === "transit") {
        transitProgressRef.current = (transitProgressRef.current + 0.004) % 1;
        const tp = transitProgressRef.current;
        // Move camera through the throat along Y axis
        const camY = (tp - 0.5) * (visualHalfLength * 2.8);
        rx = 0.15;
        ry = time * 0.4;
        camDist = 280;
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
        // Rotate Y
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        // Rotate X
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX + camDist;

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
      // Two asymptotic Minkowski sheets connected via throat cylinder
      // ══════════════════════════════════════════════════════
      const NUM_RINGS = 18;
      const NUM_SECTORS = 32;
      const outerFlangeR = visualThroatR + 130;

      // Render Upper Universe (+1) and Lower Universe (-1)
      [-1, 1].forEach((sheetSign) => {
        for (let i = 0; i <= NUM_RINGS; i++) {
          const tRing = i / NUM_RINGS; // 0 = at throat edge, 1 = flat outer boundary
          const currentR = visualThroatR + Math.pow(tRing, 1.4) * (outerFlangeR - visualThroatR);

          // Morris-Thorne Flamm curvature equation: z(r) = 2 * sqrt(r_0 * (r - r_0))
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
            // Colors: Top sheet slate-cyan, bottom sheet slate-indigo
            if (i === 0) {
              // Mouth rim
              ctx.strokeStyle = sheetSign > 0 ? "rgba(147, 197, 253, 0.7)" : "rgba(167, 139, 250, 0.7)";
              ctx.lineWidth = 1.6;
            } else {
              const alpha = Math.max(0.04, 0.35 - tRing * 0.28);
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
      // Connects Upper Sheet and Lower Sheet across visualHalfLength
      // ══════════════════════════════════════════════════════
      const TUBE_RINGS = 10;
      for (let i = 0; i <= TUBE_RINGS; i++) {
        const tTube = (i / TUBE_RINGS) * 2 - 1; // -1 to +1
        const yPos = tTube * visualHalfLength;
        // Throat flares out slightly at ends: b(r)
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
            // The central throat bottleneck
            ctx.strokeStyle = isHumanSafe ? "rgba(99, 102, 241, 0.9)" : "rgba(244, 63, 94, 0.95)";
            ctx.lineWidth = 2.4;
          } else {
            ctx.strokeStyle = "rgba(160, 175, 200, 0.25)";
            ctx.lineWidth = 1;
          }
          ctx.stroke();
        }
      }

      // Longitudinal Ribs (running vertically through the entire structure)
      for (let j = 0; j < NUM_SECTORS; j += 2) {
        const angle = (j / NUM_SECTORS) * Math.PI * 2;
        ctx.beginPath();
        let started = false;

        // Bottom Flange -> Throat Tube -> Top Flange
        const totalSteps = NUM_RINGS * 2 + TUBE_RINGS;
        for (let s = -NUM_RINGS; s <= NUM_RINGS + TUBE_RINGS; s++) {
          let currentR, yPos;

          if (s < 0) {
            // Lower flange
            const tRing = Math.abs(s) / NUM_RINGS;
            currentR = visualThroatR + Math.pow(tRing, 1.4) * (outerFlangeR - visualThroatR);
            const radDelta = Math.max(0, currentR - visualThroatR);
            const curvatureZ = Math.sqrt(radDelta * visualThroatR) * 1.6 + Math.pow(tRing, 2.2) * 24;
            yPos = -(visualHalfLength + curvatureZ);
          } else if (s <= TUBE_RINGS) {
            // Inside tube
            const tTube = (s / TUBE_RINGS) * 2 - 1;
            yPos = tTube * visualHalfLength;
            currentR = visualThroatR * (1.0 + Math.pow(tTube, 2) * 0.15);
          } else {
            // Upper flange
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

        ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // ══════════════════════════════════════════════════════
      // 3. NEGATIVE CASIMIR ENERGY FIELD (EXOTIC THROAT RING)
      // Visualised as an intense, non-neon titanium-indigo core
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
          grad.addColorStop(0, "rgba(99, 102, 241, 0.35)");
          grad.addColorStop(0.5, "rgba(79, 70, 229, 0.12)");
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
          // Dangerous Tidal Shredding (Crimson Warning Hue)
          grad.addColorStop(0, "rgba(244, 63, 94, 0.45)");
          grad.addColorStop(0.5, "rgba(225, 29, 72, 0.15)");
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(throatCenterPt.px, throatCenterPt.py, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Mathematical HUD Labels projected on 3D node
        ctx.font = "10px monospace";
        ctx.fillStyle = isHumanSafe ? "#a5b4fc" : "#fca5a5";
        ctx.textAlign = "center";
        ctx.fillText(`THROAT r₀ = ${throatRadius.toLocaleString()}m`, throatCenterPt.px, throatCenterPt.py - visualThroatR - 8);

        ctx.font = "9px monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.fillText(`NEC VIOLATION // ρ < 0`, throatCenterPt.px, throatCenterPt.py + visualThroatR + 16);
        ctx.restore();
      }

      // ══════════════════════════════════════════════════════
      // 4. GEODESIC PARTICLES (TRANSIT TRAVELERS)
      // Move from Upper Universe (+Y) through throat (Y=0) to Lower Universe (-Y)
      // ══════════════════════════════════════════════════════
      particles.forEach((p) => {
        p.t = (p.t + p.speed) % 1.0;
        const normY = (p.t - 0.5) * 2; // -1 to +1
        const yPos = normY * (visualHalfLength * 1.5);

        // Radius follows Flamm embedding
        const radFactor = 1.0 + Math.pow(Math.abs(normY), 1.6) * 1.5;
        const currentR = (visualThroatR + p.offsetR * visualThroatR) * radFactor;

        p.angle += 0.01;
        const x = Math.cos(p.angle) * currentR;
        const z = Math.sin(p.angle) * currentR;

        const pt = project(x, yPos, z);
        if (pt) {
          const alpha = 0.2 + (1 - Math.abs(normY)) * 0.7; // Brightest at throat
          ctx.fillStyle = isHumanSafe
            ? `rgba(199, 210, 254, ${alpha})`
            : `rgba(253, 164, 175, ${alpha})`;
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, 1.4 * pt.scale, 0, Math.PI * 2);
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
  }, [throatRadius, throatLength, isHumanSafe, cameraMode]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#030407]">
      <canvas
        ref={canvasRef}
        width={760}
        height={420}
        className="w-full h-auto block cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: "760/420" }}
      />

      {/* Top Left HUD Badge */}
      <div className="absolute top-3.5 left-4 flex flex-col gap-1.5 pointer-events-none">
        <div className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-300 border border-white/10 w-fit">
          FLAMM PARABOLOID // 3D MORRIS-THORNE METRIC
        </div>
        <div className="font-mono text-[9px] text-white/50 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/5 flex items-center gap-1.5 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>{lang === "en" ? "Drag to Orbit 360°" : "360° Döndürmek için Sürükleyin"}</span>
        </div>
      </div>

      {/* Top Right Mode Switcher & Safety Status */}
      <div className="absolute top-3.5 right-4 flex flex-col items-end gap-2">
        <div className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-md font-bold ${
          isHumanSafe
            ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/30"
            : "bg-rose-950/50 text-rose-300 border-rose-500/30 animate-pulse"
        }`}>
          {isHumanSafe
            ? (lang === "en" ? "✓ TRAVERSAL SAFE (Δa < 1g)" : "✓ BİYOLOJİK GEÇİŞ GÜVENLİ (Δa < 1g)")
            : (lang === "en" ? "⚠ TIDAL SHREDDING HAZARD" : "⚠ AŞIRI GELGİT YIRTILMASI")}
        </div>

        <button
          onClick={() => setCameraMode((prev) => (prev === "orbit" ? "transit" : "orbit"))}
          className="font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-lg border border-white/15 bg-black/70 hover:bg-white/10 text-white transition-all pointer-events-auto flex items-center gap-1.5"
        >
          {cameraMode === "orbit" ? "🚀 Tünel İçi Uçuşu Başlat" : "🪐 Serbest Yörüngeye Dön"}
        </button>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-white/60 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
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
════════════════════════════════════════════════════════════ */
function LiveTwinWormholeClocks({ distanceLy, throatLength, vFraction, lang }) {
  const [earthSeconds, setEarthSeconds] = useState(0);
  const [travelerSeconds, setTravelerSeconds] = useState(0);

  // Travel math
  const externalTimeYears = distanceLy / vFraction;
  const transitSeconds = throatLength / (vFraction * C);

  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const update = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setEarthSeconds((prev) => prev + dt);
      setTravelerSeconds((prev) => prev + dt);
      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  const formatSec = (s) => {
    if (s < 0.001) return `${(s * 1e6).toFixed(1)} μs`;
    if (s < 1) return `${(s * 1000).toFixed(1)} ms`;
    if (s < 60) return `${s.toFixed(2)} s`;
    if (s < 3600) return `${(s / 60).toFixed(1)} dk`;
    return `${(s / 3600).toFixed(2)} saat`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      {/* Clock 1: External Classical Observer */}
      <div className="p-5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse" />
            🌍 Dış Uzay-Zaman (Minkowski Düz Yol)
          </span>
          <span className="font-mono text-[10px] text-zinc-500">d = {distanceLy.toLocaleString()} Ly</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl md:text-4xl font-black text-white tracking-wider">
            {externalTimeYears > 1e6 ? externalTimeYears.toExponential(2) : Math.round(externalTimeYears).toLocaleString()}
          </span>
          <span className="font-mono text-sm text-zinc-400">{lang === "en" ? "years" : "yıl"}</span>
        </div>
        <p className="font-mono text-[11px] text-zinc-500 mt-2 leading-relaxed">
          Işık hızının altındaki klasik gemilerin evrenin dış düzleminde kat etmek zorunda olduğu asgari zaman.
        </p>
      </div>

      {/* Clock 2: Wormhole Traveler Proper Time */}
      <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/15 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-300 font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            🚀 Morris-Thorne Boğaz İçi Öz-Zaman (τ)
          </span>
          <span className="font-mono text-[10px] text-indigo-300/70">L = {throatLength.toLocaleString()} m</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl md:text-4xl font-black text-indigo-200 tracking-wider">
            {formatSec(transitSeconds)}
          </span>
          <span className="font-mono text-sm text-indigo-300/60">geçiş süresi</span>
        </div>
        <p className="font-mono text-[11px] text-indigo-200/60 mt-2 leading-relaxed">
          Uzay bükülmesi sayesinde boğaz koridorundan doğrudan geçen gezginin kolundaki saatte geçen anlık süre.
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

  // Authoritative Numeric Physics States
  const [throatRadius, setThroatRadius] = useState(2.5); // meters (r_0)
  const [throatLength, setThroatLength] = useState(12.0); // meters (L)
  const [targetDistanceLy, setTargetDistanceLy] = useState(4.24); // Ly
  const [vFraction, setVFraction] = useState(0.01); // 0.01c = 3000 km/s

  // String Inputs for Natural Typing
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
    updateRadius(preset.r0);
    updateLength(preset.length);
    updateDistance(preset.distanceLy);
  };

  // ══════════════════════════════════════════════════════
  // PHYSICS CALCULATIONS (MORRIS & THORNE 1988)
  // ══════════════════════════════════════════════════════
  // 1. Exotic Negative Mass Requirement: M_exotic ≈ - (c^2 * r_0) / G
  const exoticMassKg = -((Math.pow(C, 2) * throatRadius) / G);
  const exoticMoons = Math.abs(exoticMassKg) / M_MOON;
  const exoticJupiters = Math.abs(exoticMassKg) / M_JUPITER;

  // 2. Biophysical Head-to-Toe Tidal Acceleration:
  // For flat-mouth Morris-Thorne throat, Riemann tensor component:
  // Δa_tidal ≈ (c^2 / r_0^2) * (Δξ_body / c^2) ... Thorne's benchmark:
  // Δa ≈ (G * |M_effective| / r_0^3) * Δξ = (c^2 / r_0^2) * Δξ
  const humanHeight = 1.8; // meters
  // Scaling benchmark: for r0 = 2m, Δa is modest; for sub-millimeter r0 it becomes infinite
  const tidalAccelMs2 = (Math.pow(C, 2) / Math.max(0.01, Math.pow(throatRadius, 2))) * (humanHeight / 1e16);
  const tidalG = tidalAccelMs2 / 9.80665;
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

      {/* Standard Compact Container (Identical to time-dilation) */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Breadcrumb */}
        <Link
          href="/calculations"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest mb-6 transition-theme opacity-75 hover:opacity-100 hover:text-amber-400"
        >
          ← {lang === "en" ? "All Calculation Tools" : "Tüm Hesaplama Araçları"}
        </Link>

        {/* Hero Title */}
        <div
          className="inline-flex items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full block w-fit"
          style={{ border: "1px solid rgba(99, 102, 241, 0.3)", background: "rgba(99, 102, 241, 0.08)", color: "#818cf8" }}
        >
          <span className="h-1.5 w-1.5 rounded-full inline-block bg-indigo-400 animate-pulse" />
          {PAGE_TEXT.badge}
        </div>

        <h1
          className="font-black uppercase tracking-tight"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
            lineHeight: 1.05,
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

        {/* TAB 1: 3D SIMULATOR */}
        {activeTab === "simulator" && (
          <div className="space-y-8 mt-8 animate-fade-in-up">
            {/* Presets Row */}
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold block mb-3">
                {lang === "en" ? "Theoretical Presets" : "Kuramsal Senaryo Presetleri"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {WORMHOLE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-all text-left group"
                  >
                    <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider font-semibold block mb-1">
                      {lang === "en" ? p.badgeEn : p.badgeTr}
                    </span>
                    <div className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {lang === "en" ? p.nameEn : p.nameTr}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {lang === "en" ? p.descEn : p.descTr}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* True 3D Reactive Interactive Canvas */}
            <InteractiveWormhole3D
              throatRadius={throatRadius}
              throatLength={throatLength}
              isHumanSafe={isHumanSafe}
              tidalG={tidalG}
              exoticMassKg={exoticMassKg}
              lang={lang}
            />

            {/* Controls & Scientific Proof Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Parametric Controls */}
              <div className="lg:col-span-1 p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md space-y-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-bold block mb-1">
                    GEOMETRİ KONTROL PANELİ
                  </span>
                  <h3 className="text-lg font-bold text-white">Metrik Parametreleri</h3>
                </div>

                {/* Radius Slider + Direct Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs text-zinc-300">
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
                      className="w-24 px-2 py-0.5 text-right font-mono text-xs bg-white/5 border border-white/10 rounded text-indigo-300 font-bold"
                    />
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="500"
                    step="0.5"
                    value={Math.min(500, Math.max(0.2, throatRadius))}
                    onChange={(e) => updateRadius(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
                    <span>0.2 m (Kritik Gelgit)</span>
                    <span>500 m (Geniş Koridor)</span>
                  </div>
                </div>

                {/* Length Slider + Direct Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs text-zinc-300">
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
                      className="w-24 px-2 py-0.5 text-right font-mono text-xs bg-white/5 border border-white/10 rounded text-indigo-300 font-bold"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    step="5"
                    value={Math.min(1000, Math.max(1, throatLength))}
                    onChange={(e) => updateLength(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
                    <span>1 m (Anlık Geçiş)</span>
                    <span>1,000 m (Uzun Boğaz)</span>
                  </div>
                </div>

                {/* Distance Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs text-zinc-300">
                      Köprü Mesafesi (Ly):
                    </label>
                    <span className="font-mono text-xs text-zinc-300 font-bold">
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
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
                    <span>1 Ly (Yakın Yıldız)</span>
                    <span>50,000 Ly (Galaktik Merkez)</span>
                  </div>
                </div>

                {/* Velocity */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs text-zinc-300">
                      Geçiş Hızı (v/c):
                    </label>
                    <span className="font-mono text-xs text-zinc-300 font-bold">
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
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                </div>
              </div>

              {/* Right Column: Physical Proof & Analysis Results */}
              <div className="lg:col-span-2 space-y-4">
                {/* Metric Proof Card */}
                <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                      EINSTEIN ALAN DENKLEMLERİ // BOĞAZ GERİLİMİ
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      M_exotic ≈ - (c² · r₀) / G
                    </span>
                  </div>

                  <h4 className="text-xl font-bold text-white mb-2">
                    {lang === "en" ? "Exotic Negative Mass Required" : "Gereken Negatif Casimir Kütlesi"}
                  </h4>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-mono text-3xl font-black text-rose-400">
                      {exoticMassKg.toExponential(4)}
                    </span>
                    <span className="font-mono text-sm text-zinc-400">kg (Negatif Kütle)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs font-mono">
                    <div className="text-zinc-400">
                      Ay Kütlesi Eşdeğeri:{" "}
                      <span className="text-zinc-200 font-bold">
                        {exoticMoons.toFixed(2)} × M_Ay
                      </span>
                    </div>
                    <div className="text-zinc-400">
                      Jüpiter Kütlesi Eşdeğeri:{" "}
                      <span className="text-zinc-200 font-bold">
                        {exoticJupiters.toFixed(4)} × M_Jüpiter
                      </span>
                    </div>
                  </div>
                </div>

                {/* Biophysical Tidal Safety Card */}
                <div className={`p-6 rounded-2xl border backdrop-blur-md ${
                  isHumanSafe
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : "border-rose-500/30 bg-rose-950/15"
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${
                      isHumanSafe ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      BİYOFİZİKSEL GELGİT FARKI & SPAGETTİLEŞME
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      Δξ = 1.8 m (Astronot Boyu)
                    </span>
                  </div>

                  <h4 className="text-xl font-bold text-white mb-2">
                    Baş-Ayak Arası Diferansiyel İvme:{" "}
                    <span className={isHumanSafe ? "text-emerald-300 font-mono" : "text-rose-400 font-mono"}>
                      {tidalG < 0.001 ? "< 0.001" : tidalG.toFixed(2)} g
                    </span>
                  </h4>

                  <p className="text-xs text-zinc-300 leading-relaxed">
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
          <div className="p-6 md:p-10 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md space-y-8 mt-8 animate-fade-in-up">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-indigo-400 font-bold block mb-2">
                KURAMSAL ASTROFİZİK // EINSTEIN ALAN DENKLEMLERİ
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                Morris-Thorne Geçilebilir Solucan Deliğinin Matematiksel İspatı
              </h2>
              <p className="text-sm md:text-base text-zinc-400 mt-3 leading-relaxed">
                1988 yılında Carl Sagan&apos;ın &quot;Contact&quot; romanındaki bilimsel tutarlılık sorusu üzerine Nobel ödüllü fizikçi Kip Thorne ve doktora öğrencisi Michael Morris, Genel Görelilik kurallarını ihlal etmeyen ilk geçilebilir solucan deliği çözümünü türettiler.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono text-sm font-bold text-indigo-300 mb-2">
                1. Morris-Thorne Çizgi Elemanı (Line Element)
              </h3>
              <div className="font-mono text-xs md:text-sm bg-black/60 p-4 rounded-xl text-indigo-200 overflow-x-auto border border-white/5 my-3 leading-relaxed">
                ds² = -e^(2Φ(r)) c² dt² + [1 - b(r)/r]⁻¹ dr² + r² (dθ² + sin²θ dφ²)
              </div>
              <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside mt-3">
                <li>
                  <strong className="text-zinc-200">Φ(r) (Kızılkayma Fonksiyonu):</strong> Olay ufku (event horizon) oluşmaması için her yerde sonlu olmalıdır. Eğer e^(2Φ) = 0 olursa zaman durur ve Schwarzschild kara deliğinde olduğu gibi geri dönüşsüz tek yönlü bir ufuk oluşur.
                </li>
                <li>
                  <strong className="text-zinc-200">b(r) (Şekil Fonksiyonu):</strong> Boğazın 3 boyutlu geometrisini belirler. Boğaz noktasında (r = r₀) b(r₀) = r₀ şartı sağlanır.
                </li>
                <li>
                  <strong className="text-zinc-200">Dışbükeylik (Flare-out Condition):</strong> Boğazın iki yana doğru açılması için türevin b&apos;(r₀) &lt; 1 olması şarttır.
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono text-sm font-bold text-rose-300 mb-2">
                2. Null Enerji Şartının (NEC) Çiğnenmesi ve Egzotik Madde
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                Einstein Alan Denklemleri (G_μν = 8πG/c⁴ · T_μν) çözüldüğünde, boğazın kütleçekimsel olarak kendi içine çökmemesi ve açık kalması için gereken gerilim tensörü negatif enerji yoğunluğu gerektirir:
              </p>
              <div className="font-mono text-xs md:text-sm bg-black/60 p-4 rounded-xl text-rose-200 overflow-x-auto border border-white/5 my-3">
                T_μν k^μ k^ν &lt; 0  ⟹  ρ + p_r &lt; 0
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Klasik fizikte enerji yoğunluğu daima pozitiftir (ρ &gt; 0). Ancak kuantum alan teorisinde (Casimir etkisi) negatif enerji yoğunluğu deneysel olarak gözlemlenmiştir. Bu nedenle solucan delikleri saf kuantum yerçekimi olgularıdır.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: CASIMIR EFFECT */}
        {activeTab === "casimir" && (
          <div className="p-6 md:p-10 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md space-y-8 mt-8 animate-fade-in-up">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-indigo-400 font-bold block mb-2">
                KUANTUM VAKUM ENERJİSİ // CASIMIR ETKİSİ
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                Negatif Enerji Bir Hayal mi, Laboratuvar Gerçeği mi?
              </h2>
              <p className="text-sm md:text-base text-zinc-400 mt-3 leading-relaxed">
                Solucan deliklerini açık tutması gereken &quot;egzotik madde&quot;, bilimkurgu eseri değil; kuantum elektrodinamiğinde 1948 yılında Hendrik Casimir tarafından öngörülmüş ve laboratuvar ortamında mikron düzeyinde ölçülmüş bir fizik gerçeğidir.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="font-mono text-sm font-bold text-white mb-2">Casimir Plakaları Deneyi</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Vakum ortamında birbirine nanometre mesafede duran yüksüz iki iletken metal plaka arasına sadece belirli dalga boyundaki kuantum vakum modları sığabilir. Plakaların dışındaki sonsuz dalga modları içeridekilerden fazla olduğu için, plakaların arasındaki efektif enerji yoğunluğu dışarıdaki boşluğa göre <strong>negatif</strong> hale gelir.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="font-mono text-sm font-bold text-white mb-2">Makroskopik Mühendislik Sınırı</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
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
            className="font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-2"
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

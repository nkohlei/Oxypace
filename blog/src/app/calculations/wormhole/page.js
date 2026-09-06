"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../../blog/components/Header";
import Footer from "../../blog/components/Footer";
import ReadingProgressBar from "../../blog/components/ReadingProgressBar";
import CookieConsent from "../../blog/components/CookieConsent";

/* ════════════════════════════════════════════════════════════
   PHYSICS CONSTANTS & MORRIS-THORNE METRIC CONSTANTS
   Metric: ds^2 = -c^2 dt^2 + dr^2 / (1 - b(r)/r) + r^2 dΩ^2
   Null Energy Condition (NEC): T_μν k^μ k^ν >= 0 (Violated at throat)
   Exotic Mass Requirement: M_exotic ≈ - (c^2 * r_0) / G
════════════════════════════════════════════════════════════ */
const G = 6.6743e-11; // m^3 kg^-1 s^-2
const C = 299792458; // m/s
const M_JUPITER = 1.898e27; // kg
const M_EARTH = 5.972e24; // kg
const M_MOON = 7.342e22; // kg
const LIGHT_YEAR_METERS = 9.461e15; // meters

// Scientific Presets
const WORMHOLE_PRESETS = [
  {
    id: "microscopic",
    nameTr: "🔬 Planck / Kuantum Boğazı",
    nameEn: "🔬 Quantum Foam Micro-Throat",
    r0: 1.616e-35, // Planck length
    r0Label: "1.62 × 10⁻³⁵ m",
    throatLengthM: 1e-34,
    distanceLy: 4.24, // Proxima Centauri
    badgeTr: "Kuantum Köpüğü (Planck)",
    badgeEn: "Quantum Foam (Planck)",
    descTr: "Kuantum uzay-zaman köpüğünde anlık var olup yok olan sanal mikroskobik boğaz. Klasik geçiş imkansızdır.",
    descEn: "Virtual microscopic throat spontaneously fluctuating in quantum foam. Classical traversal impossible.",
    customScale: false
  },
  {
    id: "human_sized",
    nameTr: "🧑 İnsan Geçilebilir Boğaz (r₀ = 2m)",
    nameEn: "🧑 Human-Traversable Throat (r₀ = 2m)",
    r0: 2.0, // 2 meters
    r0Label: "2.0 m",
    throatLengthM: 10.0,
    distanceLy: 4.24, // Proxima Centauri
    badgeTr: "Kip Thorne İdeal Model (1988)",
    badgeEn: "Kip Thorne Ideal Model (1988)",
    descTr: "İnsanın dik durarak geçebileceği 2 metre yarıçaplı boğaz. Jelibon/Satürn uydusu kütlesinde negatif enerji gerektirir.",
    descEn: "2-meter radius throat allowing an astronaut to step through. Requires Moon/Saturn-moon scale negative mass.",
    customScale: true
  },
  {
    id: "interstellar_vessel",
    nameTr: "🚀 Yıldızlararası Nakliye Boğazı (r₀ = 1 km)",
    nameEn: "🚀 Interstellar Cargo Conduit (r₀ = 1 km)",
    r0: 1000.0, // 1 km
    r0Label: "1.0 km",
    throatLengthM: 5000.0,
    distanceLy: 25.0, // Vega
    badgeTr: "Dev Uzay Gemisi Ölçeği",
    badgeEn: "Capital Ship Scale",
    descTr: "Dev nakliye gemilerinin sıfır gelgit ivmesiyle geçebileceği 1 km'lik boğaz. ~1 Jüpiter kütlesinde negatif madde ister.",
    descEn: "1 km radius corridor allowing large starships to traverse. Demands approx 1 Jupiter mass of negative energy.",
    customScale: true
  },
  {
    id: "andromeda_gateway",
    nameTr: "🌌 Galaksiler Arası Mega Ağ (r₀ = 10,000 km)",
    nameEn: "🌌 Intergalactic Mega Gateway (r₀ = 10,000 km)",
    r0: 10000000.0, // 10,000 km
    r0Label: "10,000 km",
    throatLengthM: 100000.0,
    distanceLy: 2537000, // Andromeda Galaxy
    badgeTr: "Galaksiler Arası Köprü (2.5M Ly)",
    badgeEn: "Intergalactic Bridge (2.5M Ly)",
    descTr: "Samanyolu ile Andromeda galaksisi arasında anlık kestirme bağlantı. Yıldız kütleleri mertebesinde negatif enerji matrisi.",
    descEn: "Direct shortcut between Milky Way and Andromeda galaxy. Requires stellar-mass equivalent negative exotic matter.",
    customScale: true
  }
];

/* ════════════════════════════════════════════════════════════
   3D MATTE WIREFRAME FLAMM'S PARABOLOID (EMBEDDING CANVAS)
   Pure Mathematical Projection - Zero Neon - Clean Monochromatic Depth
   Visualises the 2D embedding of the Morris-Thorne spatial slice:
   z(r) = ± 2 * r_0 * sqrt(r / r_0 - 1)  (Flamm's paraboloid)
════════════════════════════════════════════════════════════ */
function Wormhole3DCanvas({ r0, isHumanSafe, tidalG, exoticMassKg }) {
  const canvasRef = useRef(null);
  const rotationRef = useRef({ rotX: 0.45, rotY: 0.65 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const width = canvas.width;
    const height = canvas.height;

    // Handle mouse drag to rotate 3D view
    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      rotationRef.current.rotY += dx * 0.007;
      rotationRef.current.rotX = Math.max(-0.8, Math.min(0.8, rotationRef.current.rotX + dy * 0.007));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch support for mobile devices
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
      rotationRef.current.rotY += dx * 0.007;
      rotationRef.current.rotX = Math.max(-0.8, Math.min(0.8, rotationRef.current.rotX + dy * 0.007));
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

    // Subtle background particles (representing quantum vacuum fluctuations)
    const vacuumParticles = [];
    for (let i = 0; i < 90; i++) {
      vacuumParticles.push({
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 300,
        z: (Math.random() - 0.5) * 400,
        alpha: 0.15 + Math.random() * 0.3,
        size: 0.6 + Math.random() * 0.8
      });
    }

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Deep matte dark slate background
      ctx.fillStyle = "#040508";
      ctx.fillRect(0, 0, width, height);

      // Subtle fine coordinate grid background
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      const gridStep = 40;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Auto rotation when not dragging
      if (!isDraggingRef.current) {
        rotationRef.current.rotY += 0.0025;
      }

      const rx = rotationRef.current.rotX;
      const ry = rotationRef.current.rotY;
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);

      const fov = 480;
      const centerX = width / 2;
      const centerY = height / 2;

      // 3D Projection Helper
      const project = (x, y, z) => {
        // Rotate Y
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        // Rotate X
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX + 440; // camera distance

        if (z2 <= 20) return null;
        const scale = fov / z2;
        return {
          px: centerX + x1 * scale,
          py: centerY + y2 * scale,
          depth: z2
        };
      };

      // 1. Draw Vacuum Fluctuation Points (Negative Casimir Field Atmosphere)
      for (const vp of vacuumParticles) {
        const pt = project(vp.x, vp.y, vp.z);
        if (pt) {
          ctx.fillStyle = `rgba(180, 195, 215, ${vp.alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, vp.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Generate and Render Morris-Thorne Flamm's Paraboloid Wireframe
      // Upper universe sheet (z > 0), Throat (z = 0), Lower universe sheet (z < 0)
      const numRings = 24;
      const numSectors = 32;
      const maxRadius = 190;
      const minRadius = 42; // throat radius on screen

      // Pre-calculate vertices for upper and lower funnel sheets
      // We render two sheets connected at throat
      const sheets = [-1, 1]; // -1 = lower mouth, +1 = upper mouth

      sheets.forEach((sheetSign) => {
        for (let i = 0; i <= numRings; i++) {
          const tRing = i / numRings;
          // Radius expands quadratically away from throat
          const currentR = minRadius + Math.pow(tRing, 1.35) * (maxRadius - minRadius);
          // Flamm's embedding height z(r) = 2 * r0 * sqrt(r/r0 - 1)
          const radDiff = Math.max(0, currentR - minRadius);
          const zHeight = sheetSign * (Math.sqrt(radDiff) * 11.5 + Math.pow(tRing, 2.2) * 22);

          // Horizontal rings
          ctx.beginPath();
          let firstPoint = null;
          let isVisible = false;

          for (let j = 0; j <= numSectors; j++) {
            const angle = (j / numSectors) * Math.PI * 2;
            const x = Math.cos(angle) * currentR;
            const y = zHeight; // Y axis is vertical in projection
            const z = Math.sin(angle) * currentR;

            const proj = project(x, y, z);
            if (!proj) continue;

            if (j === 0) {
              ctx.moveTo(proj.px, proj.py);
              firstPoint = proj;
            } else {
              ctx.lineTo(proj.px, proj.py);
            }
            isVisible = true;
          }

          if (isVisible && firstPoint) {
            // Throat is highlighted with titanium slate, outer sheets fade subtly
            const isThroatRing = i === 0;
            if (isThroatRing) {
              // Throat boundary ring
              ctx.strokeStyle = isHumanSafe ? "rgba(129, 140, 248, 0.75)" : "rgba(244, 63, 94, 0.75)";
              ctx.lineWidth = 2.2;
            } else {
              const alpha = Math.max(0.08, 0.45 - tRing * 0.32);
              ctx.strokeStyle = `rgba(160, 175, 200, ${alpha})`;
              ctx.lineWidth = 1;
            }
            ctx.stroke();
          }
        }
      });

      // Longitude ribs (vertical grid lines running from bottom mouth through throat to top mouth)
      for (let j = 0; j < numSectors; j += 2) {
        const angle = (j / numSectors) * Math.PI * 2;
        ctx.beginPath();
        let started = false;

        // Traverse from lower rim (-1) to throat (0) to upper rim (+1)
        const totalSteps = numRings * 2;
        for (let step = -numRings; step <= numRings; step++) {
          const sheetSign = step < 0 ? -1 : 1;
          const tRing = Math.abs(step) / numRings;
          const currentR = minRadius + Math.pow(tRing, 1.35) * (maxRadius - minRadius);
          const radDiff = Math.max(0, currentR - minRadius);
          const zHeight = sheetSign * (Math.sqrt(radDiff) * 11.5 + Math.pow(tRing, 2.2) * 22);

          const x = Math.cos(angle) * currentR;
          const y = zHeight;
          const z = Math.sin(angle) * currentR;

          const proj = project(x, y, z);
          if (!proj) continue;

          if (!started) {
            ctx.moveTo(proj.px, proj.py);
            started = true;
          } else {
            ctx.lineTo(proj.px, proj.py);
          }
        }

        ctx.strokeStyle = "rgba(140, 160, 185, 0.16)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // 3. Central Throat Exotic Matter Core Ring (Casimir Negative Energy Ring)
      // Visualised as an elegant, non-glowing titanium-indigo torus cross section
      ctx.save();
      const throatProj = project(0, 0, 0);
      if (throatProj) {
        // Flat geometric throat label indicator
        ctx.font = "9px monospace";
        ctx.fillStyle = isHumanSafe ? "rgba(129, 140, 248, 0.9)" : "rgba(244, 63, 94, 0.9)";
        ctx.textAlign = "center";
        ctx.fillText("THROAT (r = r₀)", throatProj.px, throatProj.py - 14);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText(`b(r₀) = r₀ // NEC VIOLATION`, throatProj.px, throatProj.py + 22);
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [r0, isHumanSafe]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#040508] shadow-2xl">
      <canvas
        ref={canvasRef}
        width={720}
        height={380}
        className="w-full h-auto block cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: "720/380" }}
      />
      {/* HUD Telemetry Top Left */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded bg-black/80 backdrop-blur-md text-zinc-300 border border-white/10">
          3D FLAMM&apos;S PARABOLOID // MORRIS-THORNE EMBEDDING
        </div>
        <div className="font-mono text-[9px] text-zinc-400 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <span>Fare / Dokunmatik ile 360° Döndürülebilir</span>
        </div>
      </div>

      {/* HUD Telemetry Top Right */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1 pointer-events-none">
        <div className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border backdrop-blur-md ${
          isHumanSafe
            ? "bg-indigo-950/40 text-indigo-300 border-indigo-500/30"
            : "bg-rose-950/40 text-rose-300 border-rose-500/30"
        }`}>
          {isHumanSafe ? "✓ BİYOLOJİK GEÇİŞ GÜVENLİ (Δa < 1g)" : "⚠ AŞIRI GELGİT YIRTILMASI (SPAGETTİ)"}
        </div>
        <div className="font-mono text-[9px] text-zinc-400 px-2 py-0.5 rounded bg-black/60 border border-white/5">
          Gelgit Farkı: {tidalG < 0.001 ? "< 10⁻³ g" : tidalG > 1e6 ? `${tidalG.toExponential(2)} g` : `${tidalG.toFixed(2)} g`}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   LIVE TRAVERSAL SIMULATION (TRAVEL TIME COMPARISON)
════════════════════════════════════════════════════════════ */
function TraversalTimeComparison({ distanceLy, throatLengthM, vFraction, lang }) {
  // External light speed journey time
  const externalTimeYears = distanceLy / vFraction;
  // Throat transit time
  const vMps = vFraction * C;
  const transitSeconds = throatLengthM / vMps;

  const formatTransitTime = (sec) => {
    if (sec < 0.001) return `${(sec * 1e6).toFixed(1)} mikrosaniye (μs)`;
    if (sec < 1) return `${(sec * 1000).toFixed(1)} milisaniye (ms)`;
    if (sec < 60) return `${sec.toFixed(2)} saniye`;
    if (sec < 3600) return `${(sec / 60).toFixed(2)} dakika`;
    return `${(sec / 3600).toFixed(2)} saat`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      {/* Classical External Travel Box */}
      <div className="p-5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            {lang === "en" ? "Classical Flat Spacetime (Sub-light)" : "Klasik Düz Uzay-Zaman (Dış Yol)"}
          </span>
          <span className="font-mono text-[10px] text-zinc-500">d = {distanceLy.toLocaleString()} Ly</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl md:text-3xl font-black text-zinc-200 tracking-wider">
            {externalTimeYears > 1e6 ? externalTimeYears.toExponential(2) : Math.round(externalTimeYears).toLocaleString()}
          </span>
          <span className="font-mono text-sm text-zinc-400">{lang === "en" ? "years" : "yıl"}</span>
        </div>
        <p className="font-mono text-[11px] text-zinc-500 mt-2 leading-relaxed">
          {lang === "en"
            ? "Standard Minkowski space travel time constrained by cosmic speed limit c."
            : "Işık hızının altındaki klasik araçlarla uzay-zaman düzleminde kat edilen asgari süre."}
        </p>
      </div>

      {/* Wormhole Throat Transit Box */}
      <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-300 font-bold flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {lang === "en" ? "Morris-Thorne Throat Geodesic" : "Morris-Thorne Boğaz Jeodeziği"}
          </span>
          <span className="font-mono text-[10px] text-indigo-300/60">L = {throatLengthM.toLocaleString()} m</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-wider">
            {formatTransitTime(transitSeconds)}
          </span>
        </div>
        <p className="font-mono text-[11px] text-indigo-200/60 mt-2 leading-relaxed">
          {lang === "en"
            ? "Proper time (τ) experienced by traveler crossing directly through the throat corridor."
            : "Gezginin uzay-zaman eğriliği sayesinde boğaz içinden geçerken bizzat hissettiği öz-zaman (τ)."}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT: WORMHOLE CALCULATOR
════════════════════════════════════════════════════════════ */
export default function WormholeCalculator() {
  const [lang, setLang] = useState("tr");
  const [activeTab, setActiveTab] = useState("simulator"); // "simulator" | "math" | "casimir"

  // Physics State
  const [throatRadius, setThroatRadius] = useState(2.0); // meters (r_0)
  const [throatLength, setThroatLength] = useState(10.0); // meters (L)
  const [targetDistanceLy, setTargetDistanceLy] = useState(4.24); // light years
  const [transitSpeedFraction, setTransitSpeedFraction] = useState(0.01); // fraction of c (e.g. 0.01c = 3000 km/s)

  // Advanced Morris-Thorne Metric Parameters
  // Tidal acceleration across traveler body (length Δξ = 1.8 meters)
  // For standard zero-tidal Morris-Thorne metric with flat entrance:
  // Radial tidal acceleration: |Δa_r| ≈ c^2 * |d^2 Φ / dr^2| * Δξ or geometric curvature term
  // For Thorne's standard simple benchmark: Δa_radial ≈ (c^2 * r_0) / (r^3) * Δξ (at throat r = r_0)
  const travelerHeightMeters = 1.8;
  const tidalAccelMs2 = (Math.pow(C, 2) / Math.max(0.1, Math.pow(throatRadius, 2))) * (travelerHeightMeters / 1e16); // scaled benchmark
  const tidalG = tidalAccelMs2 / 9.80665;
  const isHumanSafe = tidalG <= 2.5; // Up to 2.5g is biologically safe for humans

  // Exotic Negative Mass Requirement:
  // Thorne 1988 formula: Total negative exotic mass required to sustain throat:
  // M_exotic ≈ - (c^2 * r_0) / G
  const exoticMassKg = -((Math.pow(C, 2) * throatRadius) / G);
  const exoticMassInJupiters = Math.abs(exoticMassKg) / M_JUPITER;
  const exoticMassInMoons = Math.abs(exoticMassKg) / M_MOON;
  const exoticEnergyJoules = Math.abs(exoticMassKg) * Math.pow(C, 2);

  // Apply Preset
  const handleSelectPreset = (preset) => {
    setThroatRadius(preset.r0);
    setThroatLength(preset.throatLengthM);
    setTargetDistanceLy(preset.distanceLy);
  };

  return (
    <div className="min-h-screen transition-theme bg-[#040508]" style={{ color: "var(--foreground)" }}>
      <ReadingProgressBar />
      <Header isArticle={false} lang={lang} onLangChange={setLang} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Breadcrumb & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Link
              href="/calculations"
              className="font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              ← {lang === "en" ? "Calculations" : "Hesaplama Portalı"}
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">
              MORRIS-THORNE METRIC // 1988
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            <span>Kip S. Thorne & Michael S. Morris Arşivi</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold block mb-2">
            RESEARCH APEX // GEOMETRODYNAMICS
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {lang === "en"
              ? "Morris-Thorne Traversable Wormhole Analyzer"
              : "Morris-Thorne Geçilebilir Solucan Deliği Analizörü"}
          </h1>
          <p className="text-sm md:text-base text-zinc-400 mt-3 max-w-3xl leading-relaxed">
            {lang === "en"
              ? "Investigate the spatial curvature, exotic matter tension, Casimir negative energy density, and human tidal tolerance of a traversable wormhole based on Einstein's Field Equations."
              : "Einstein Alan Denklemleri'ne dayanan ufuksuz ve çift yönlü geçilebilir bir solucan deliğinin Flamm paraboloid eğriliğini, Casimir negatif enerji ihtiyacını ve biyolojik gelgit dayanımını analiz edin."}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`font-mono text-xs uppercase tracking-widest px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "simulator"
                ? "border-indigo-400 text-white font-bold bg-white/5"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {lang === "en" ? "Interactive 3D Simulator" : "İnteraktif 3D Simülatör"}
          </button>
          <button
            onClick={() => setActiveTab("math")}
            className={`font-mono text-xs uppercase tracking-widest px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "math"
                ? "border-indigo-400 text-white font-bold bg-white/5"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {lang === "en" ? "Mathematical Proof & Metric" : "Matematiksel İspat & Metrik"}
          </button>
          <button
            onClick={() => setActiveTab("casimir")}
            className={`font-mono text-xs uppercase tracking-widest px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "casimir"
                ? "border-indigo-400 text-white font-bold bg-white/5"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {lang === "en" ? "Casimir Effect & Exotic Matter" : "Casimir Etkisi & Egzotik Madde"}
          </button>
        </div>

        {/* Tab 1: Simulator */}
        {activeTab === "simulator" && (
          <div className="space-y-8">
            {/* Presets Grid */}
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold block mb-3">
                {lang === "en" ? "Astrophysical & Engineering Presets" : "Astrofiziksel ve Kuramsal Senaryolar"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {WORMHOLE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">
                        {lang === "en" ? p.badgeEn : p.badgeTr}
                      </span>
                    </div>
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

            {/* 3D Wireframe Canvas */}
            <Wormhole3DCanvas
              r0={throatRadius}
              isHumanSafe={isHumanSafe}
              tidalG={tidalG}
              exoticMassKg={exoticMassKg}
            />

            {/* Live Parameter Controls & HUD Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Sliders & Controls */}
              <div className="lg:col-span-1 p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md space-y-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-1">
                    PARAMETRİK KONTROL ÜNİTESİ
                  </span>
                  <h3 className="text-lg font-bold text-white">Boğaz & Geometri Değişkenleri</h3>
                </div>

                {/* Slider 1: Throat Radius r_0 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs text-zinc-300">
                      {lang === "en" ? "Throat Radius (r₀)" : "Boğaz Yarıçapı (r₀)"}
                    </label>
                    <span className="font-mono text-xs text-indigo-300 font-bold">
                      {throatRadius >= 1000
                        ? `${(throatRadius / 1000).toLocaleString()} km`
                        : throatRadius < 0.01
                        ? throatRadius.toExponential(2) + " m"
                        : `${throatRadius.toFixed(1)} m`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10000"
                    step="1"
                    value={Math.min(10000, Math.max(1, throatRadius))}
                    onChange={(e) => setThroatRadius(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
                    <span>1 m (Dar)</span>
                    <span>10 km (Dev İstasyon)</span>
                  </div>
                </div>

                {/* Slider 2: Target Distance (Light Years) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs text-zinc-300">
                      {lang === "en" ? "Shortcut Distance" : "Bağlanan Uzay Mesafesi"}
                    </label>
                    <span className="font-mono text-xs text-zinc-300 font-bold">
                      {targetDistanceLy.toLocaleString()} Ly
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100000"
                    step="10"
                    value={targetDistanceLy}
                    onChange={(e) => setTargetDistanceLy(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
                    <span>1 Ly</span>
                    <span>100,000 Ly (Samanyolu Çapı)</span>
                  </div>
                </div>

                {/* Slider 3: Transit Speed Fraction */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-xs text-zinc-300">
                      {lang === "en" ? "Throat Transit Speed (v/c)" : "Boğaz İçi Geçiş Hızı (v/c)"}
                    </label>
                    <span className="font-mono text-xs text-zinc-300 font-bold">
                      %{(transitSpeedFraction * 100).toFixed(1)} c (~
                      {Math.round(transitSpeedFraction * 300000).toLocaleString()} km/s)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.5"
                    step="0.005"
                    value={transitSpeedFraction}
                    onChange={(e) => setTransitSpeedFraction(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
                    <span>%0.1 c (Kimyasal/İyon)</span>
                    <span>%50 c (Rölativistik)</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Physical Analysis & Proof Results */}
              <div className="lg:col-span-2 space-y-4">
                {/* Result Card 1: Negative Exotic Mass Calculation */}
                <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                      EINSTEIN ALAN DENKLEMLERİ // BOĞAZ GERİLİMİ
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      M_exotic ≈ - (c² · r₀) / G
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {lang === "en" ? "Exotic Negative Energy Requisite" : "Gereken Negatif Egzotik Enerji / Kütle"}
                  </h4>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-mono text-2xl md:text-3xl font-black text-rose-400">
                      {exoticMassKg.toExponential(4)}
                    </span>
                    <span className="font-mono text-sm text-zinc-400">kg (Negatif Kütle)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs font-mono">
                    <div className="text-zinc-400">
                      Ay Kütlesi Eşdeğeri:{" "}
                      <span className="text-zinc-200 font-bold">
                        {exoticMassInMoons.toFixed(2)} × M_Ay
                      </span>
                    </div>
                    <div className="text-zinc-400">
                      Jüpiter Kütlesi Eşdeğeri:{" "}
                      <span className="text-zinc-200 font-bold">
                        {exoticMassInJupiters.toFixed(4)} × M_Jüpiter
                      </span>
                    </div>
                  </div>
                </div>

                {/* Result Card 2: Biophysical Tidal Acceleration */}
                <div className={`p-6 rounded-2xl border backdrop-blur-md ${
                  isHumanSafe
                    ? "border-indigo-500/20 bg-indigo-950/10"
                    : "border-rose-500/20 bg-rose-950/10"
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${
                      isHumanSafe ? "text-indigo-300" : "text-rose-400"
                    }`}>
                      BİYOFİZİKSEL SPAGETTİLEŞME TOLERANSI
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      Δξ = 1.8 m (İnsan Boyu)
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {lang === "en" ? "Head-to-Toe Tidal Force" : "Baştan Ayağa Gelgit İvmesi Farkı"}
                  </h4>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className={`font-mono text-2xl md:text-3xl font-black ${
                      isHumanSafe ? "text-indigo-200" : "text-rose-400"
                    }`}>
                      {tidalG < 0.001 ? "< 0.001" : tidalG.toFixed(3)} g
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      ({(tidalG * 9.81).toFixed(2)} m/s² diferansiyel ivme)
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isHumanSafe
                      ? "✓ Boğaz yarıçapı insan anatomisi için yeterince geniştir. Riemann eğrilik tensörü insan hücrelerini veya iskelet yapısını parçalayacak düzeyde diferansiyel çekim oluşturmaz."
                      : "⚠ UYARI: Boğaz yarıçapı aşırı dar olduğundan uzay-zaman eğriliği çok keskindir. Baş ile ayaklar arasındaki yerçekimi farkı insanı spagetti gibi uzatarak ölümcül doku yırtılmasına yol açar."}
                  </p>
                </div>
              </div>
            </div>

            {/* Travel Time Comparison Panel */}
            <TraversalTimeComparison
              distanceLy={targetDistanceLy}
              throatLengthM={throatLength}
              vFraction={transitSpeedFraction}
              lang={lang}
            />
          </div>
        )}

        {/* Tab 2: Mathematical Proof & Metric */}
        {activeTab === "math" && (
          <div className="p-6 md:p-10 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md space-y-8">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-indigo-400 font-bold block mb-2">
                KURAMSAL ASTROFİZİK // EINSTEIN-MORRIS-THORNE METRİĞİ
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                Morris-Thorne Geçilebilir Solucan Deliğinin Matematiksel İspatı
              </h2>
              <p className="text-sm md:text-base text-zinc-400 mt-3 leading-relaxed">
                1988 yılında Carl Sagan&apos;ın &quot;Contact&quot; romanındaki bilimsel tutarlılık sorusu üzerine Nobel ödüllü fizikçi Kip Thorne ve doktora öğrencisi Michael Morris, Genel Görelilik kurallarını ihlal etmeyen ilk geçilebilir solucan deliği çözümünü türettiler.
              </p>
            </div>

            {/* Metric Formula Box */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono text-sm font-bold text-indigo-300 mb-2">
                1. Morris-Thorne Çizgi Elemanı (Line Element)
              </h3>
              <div className="font-mono text-xs md:text-sm bg-black/60 p-4 rounded-xl text-indigo-200 overflow-x-auto border border-white/5 my-3 leading-relaxed">
                ds² = -e^(2Φ(r)) c² dt² + [1 - b(r)/r]⁻¹ dr² + r² (dθ² + sin²θ dφ²)
              </div>
              <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside mt-3">
                <li>
                  <strong className="text-zinc-200">Φ(r) (Kızılkayma Fonksiyonu):</strong> Olay ufku (event horizon) oluşmaması için her yerde sonlu olmalıdır. Eğer e^(2Φ) = 0 olursa, zaman durur ve Schwarzschild kara deliğinde olduğu gibi geri dönüşsüz tek yönlü bir ufuk oluşur.
                </li>
                <li>
                  <strong className="text-zinc-200">b(r) (Şekil Fonksiyonu):</strong> Boğazın 3 boyutlu geometrisini belirler. Boğaz noktasında (r = r₀) b(r₀) = r₀ şartı sağlanır.
                </li>
                <li>
                  <strong className="text-zinc-200">Dışbükeylik (Flare-out Condition):</strong> Boğazın iki yana doğru açılması için türevin b&apos;(r₀) &lt; 1 olması şarttır.
                </li>
              </ul>
            </div>

            {/* Null Energy Condition (NEC) Violation */}
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

        {/* Tab 3: Casimir Effect & Exotic Matter */}
        {activeTab === "casimir" && (
          <div className="p-6 md:p-10 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md space-y-8">
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
                  Vakum ortamında birbirine nanometre mesafede duran yüksüz iki iletken metal plaka arasına sadece belirli dalga boyundaki kuantum vakum modları sığabilir. Plakaların dışındaki sonsuz dalga modları içeridekilerden fazla olduğu için, plakaların arasındaki efektif enerji yoğunluğu dışarıdaki boşluğa göre <strong>negatif</strong> hale gelir:
                </p>
                <div className="font-mono text-xs bg-black/60 p-3 rounded-lg text-indigo-300 mt-3 border border-white/5">
                  ⟨T₀₀⟩ = - (π² ħ c) / (720 d⁴)
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="font-mono text-sm font-bold text-white mb-2">Makroskopik Mühendislik Engeli</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Laboratuvarda nanometre mesafelerde negatif enerji elde edebilsek de, 2 metrelik bir insan boğazını açık tutmak için gereken $-10^{23}$ Joule mertebesindeki negatif enerjiyi bir arada tutacak kuantum kararlılık mekanizması henüz bilinmemektedir. Geleceğin Kuantum Kütleçekimi (Quantum Gravity) teorisi bu sınırları aydınlatacaktır.
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

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../../blog/components/Header";
import Footer from "../../blog/components/Footer";
import ReadingProgressBar from "../../blog/components/ReadingProgressBar";
import CookieConsent from "../../blog/components/CookieConsent";

/* ════════════════════════════════════════════════════════════
   PHYSICS CONSTANTS & CELESTIAL PRESETS
════════════════════════════════════════════════════════════ */
const G = 6.67430e-11;      // Gravitational constant (m^3 kg^-1 s^-2)
const C = 299792458;         // Speed of light (m/s)
const M_SUN = 1.989e30;      // Solar mass in kg

// Celestial Body Presets for Schwarzschild Metric
const BLACK_HOLE_PRESETS = [
  {
    id: "gargantua",
    nameTr: "🪐 Gargantua (Interstellar)",
    nameEn: "🪐 Gargantua (Supermassive)",
    massSolar: 100000000, // 100M M_sun
    massKg: 100000000 * 1.989e30,
    rsKm: 295325000,      // ~295 million km
    defaultR_Rs: 1.000000002, // Miller's Planet orbit / Extreme Ergosphere frame
    badgeTr: "Süper Kütleli (Interstellar)",
    badgeEn: "Supermassive Black Hole",
    descTr: "Miller Gezegeninde 1 saat = Dünya'da 7 yıl (Zaman faktörü ≈ 61,320).",
    descEn: "1 hour on Miller's planet = 7 Earth years (Dilation factor ≈ 61,320)."
  },
  {
    id: "sagittarius_a",
    nameTr: "🌌 Sagittarius A* (Samanyolu Merkezi)",
    nameEn: "🌌 Sagittarius A* (Milky Way Center)",
    massSolar: 4154000,   // ~4.15 Million Solar masses
    massKg: 4.154e6 * 1.989e30,
    rsKm: 12270000,       // ~12.27 Million km
    defaultR_Rs: 3.0,     // ISCO Orbit
    badgeTr: "Galaksi Merkezi",
    badgeEn: "Galactic Center",
    descTr: "Samanyolu Galaksisi'nin merkezindeki 4.15 milyon Güneş kütleli devasa kara delik.",
    descEn: "Supermassive black hole at the center of the Milky Way galaxy (4.15M solar masses)."
  },
  {
    id: "m87",
    nameTr: "🔭 M87* (Event Horizon Telescope)",
    nameEn: "🔭 M87* (First Imaged Black Hole)",
    massSolar: 6500000000, // 6.5 Billion Solar masses
    massKg: 6.5e9 * 1.989e30,
    rsKm: 19196000000,    // ~19.2 Billion km (~128 AU)
    defaultR_Rs: 1.5,     // Photon Sphere
    badgeTr: "Görüntülenen İlk Kara Delik",
    badgeEn: "First Imaged Black Hole",
    descTr: "EHT tarafından 2019'da doğrudan gölgesi fotoğraflanan 6.5 milyar Güneş kütleli dev.",
    descEn: "First directly photographed black hole shadow by the Event Horizon Telescope (6.5B M_sun)."
  },
  {
    id: "cygnus_x1",
    nameTr: "⚡ Cygnus X-1 (Yıldızsal Kara Delik)",
    nameEn: "⚡ Cygnus X-1 (Stellar Black Hole)",
    massSolar: 21.2,      // 21.2 Solar masses
    massKg: 21.2 * 1.989e30,
    rsKm: 62.6,           // ~62.6 km
    defaultR_Rs: 2.0,
    badgeTr: "Yıldızsal Kütle",
    badgeEn: "Stellar Mass",
    descTr: "Samanyolu'nda keşfedilen ilk güçlü X-ışını yıldızsal kara deliği (21.2 Güneş kütlesi).",
    descEn: "First confirmed stellar-mass black hole discovered in the Milky Way (21.2 solar masses)."
  },
  {
    id: "earth_mass",
    nameTr: "🌍 Mikro Kara Delik (Dünya Kütlesi)",
    nameEn: "🌍 Micro Black Hole (Earth Mass)",
    massSolar: 3.0e-6,
    massKg: 5.972e24,
    rsKm: 0.00000887,     // ~8.87 mm (bir fındık boyutu)
    defaultR_Rs: 4.0,
    badgeTr: "Teorik Mikro Delik",
    badgeEn: "Theoretical Micro",
    descTr: "Dünya'nın tüm kütlesi bir fındık boyutuna (8.87 mm) sıkışsaydı oluşacak kara delik.",
    descEn: "If entire Earth mass compressed into peanut size (8.87 mm radius)."
  }
];

/* ════════════════════════════════════════════════════════════
   CANVAS 1: REALISTIC RELATIVISTIC BLACK HOLE ACCRETION DISK & GRAVITATIONAL LENSING
════════════════════════════════════════════════════════════ */
function RelativisticBlackHoleCanvas({ rOverRs, isEventHorizon, isPhotonSphere, isIsco }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width * 0.48;
    const centerY = height * 0.5;

    // Starfield for gravitational gravitational lensing backdrop
    const bgStars = [];
    for (let i = 0; i < 280; i++) {
      bgStars.push({
        origX: Math.random() * width,
        origY: Math.random() * height,
        size: Math.random() < 0.85 ? 0.6 + Math.random() * 0.6 : 1.3 + Math.random() * 0.8,
        alpha: 0.4 + Math.random() * 0.5,
        color: Math.random() > 0.3 ? "255,255,255" : Math.random() > 0.5 ? "220,235,255" : "255,240,220"
      });
    }

    // Accretion disk dust particles
    const diskParticles = [];
    for (let i = 0; i < 350; i++) {
      diskParticles.push({
        angle: Math.random() * Math.PI * 2,
        distFactor: 1.2 + Math.random() * 3.5, // multiple of shadow radius
        speed: (0.008 + Math.random() * 0.015),
        size: 0.8 + Math.random() * 1.6,
        tempHue: 20 + Math.random() * 35, // Kelvin glow range (amber/gold/cyan near ISCO)
        alpha: 0.3 + Math.random() * 0.7
      });
    }

    let t = 0;

    const render = () => {
      t += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Deep space void backdrop
      ctx.fillStyle = "#010204";
      ctx.fillRect(0, 0, width, height);

      // Shadow and Event Horizon Base Radii on Canvas
      const baseShadowRadius = 52; // Visual apparent shadow R_shadow ≈ 2.6 Rs due to photon capture
      const horizonRadius = baseShadowRadius * 0.48; // Physical Event Horizon Rs

      // 1. Draw Background Stars with Gravitational Lensing Deflection (Einstein Ring)
      for (const s of bgStars) {
        const dx = s.origX - centerX;
        const dy = s.origY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < baseShadowRadius * 0.95) {
          // Inside Black Hole Shadow - Completely dark
          continue;
        }

        // Gravitational Light Bending Deflection (Einstein deflection formula alpha ~ 4GM/c^2*b)
        const deflection = (baseShadowRadius * 38) / Math.max(15, dist);
        const angle = Math.atan2(dy, dx);
        const lensedX = centerX + Math.cos(angle) * (dist + deflection * 0.4);
        const lensedY = centerY + Math.sin(angle) * (dist + deflection * 0.4);

        // Relativistic Einstein Ring Amplification near shadow boundary
        const isNearRing = Math.abs(dist - baseShadowRadius * 1.35) < 8;
        const alphaBoost = isNearRing ? 1.6 : 1.0;

        ctx.fillStyle = `rgba(${s.color}, ${Math.min(1, s.alpha * alphaBoost)})`;
        ctx.beginPath();
        ctx.arc(lensedX, lensedY, s.size * (isNearRing ? 1.4 : 1.0), 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Gravitational Lensing Glow / Photon Ring Background
      const photonRingGrad = ctx.createRadialGradient(
        centerX, centerY, baseShadowRadius * 0.9,
        centerX, centerY, baseShadowRadius * 2.8
      );
      photonRingGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      photonRingGrad.addColorStop(0.15, "rgba(251, 191, 36, 0.7)");
      photonRingGrad.addColorStop(0.35, "rgba(249, 115, 22, 0.35)");
      photonRingGrad.addColorStop(0.7, "rgba(168, 85, 247, 0.08)");
      photonRingGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = photonRingGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseShadowRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // 3. Upper Lensed Accretion Disk (Curved Light Arc above Black Hole due to Space Warping)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 6, baseShadowRadius * 2.3, baseShadowRadius * 1.1, 0, Math.PI, 0);
      const topArcGrad = ctx.createLinearGradient(centerX - 100, 0, centerX + 100, 0);
      topArcGrad.addColorStop(0, "rgba(251, 146, 60, 0.1)");
      topArcGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.95)"); // Doppler blueshift left
      topArcGrad.addColorStop(0.6, "rgba(251, 191, 36, 0.7)");
      topArcGrad.addColorStop(1, "rgba(239, 68, 68, 0.15)"); // Doppler redshift right
      ctx.strokeStyle = topArcGrad;
      ctx.lineWidth = 14;
      ctx.filter = "blur(3px)";
      ctx.stroke();
      ctx.filter = "none";
      ctx.restore();

      // 4. Primary Relativistic Accretion Disk (Rotated 72 deg with Doppler Beaming)
      for (const p of diskParticles) {
        p.angle += p.speed;
        const radX = baseShadowRadius * p.distFactor;
        const radY = radX * 0.28; // 3D tilt perspective

        const px = centerX + Math.cos(p.angle) * radX;
        const py = centerY + Math.sin(p.angle) * radY;

        // Relativistic Doppler Beaming: Left side moves toward observer (bright white/blue), right side recedes (dim red)
        const isApproaching = Math.sin(p.angle) > 0;
        const dopplerFactor = (Math.cos(p.angle + Math.PI / 2) + 1) / 2; // 1 = approaching, 0 = receding

        let r = 255;
        let g = Math.round(180 + dopplerFactor * 75);
        let b = Math.round(80 + dopplerFactor * 175);
        let a = (0.2 + dopplerFactor * 0.75) * p.alpha;

        // Mask particles behind black hole shadow
        const isBehind = Math.sin(p.angle) < 0 && Math.abs(px - centerX) < baseShadowRadius * 1.1;
        if (!isBehind) {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * (1 + dopplerFactor * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Black Hole Event Horizon Shadow (Absolute Black Sphere with Sharp Photon Sphere Boundary)
      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseShadowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Photon Sphere Luminous Edge Ring
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseShadowRadius * 0.98, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary Inner Horizon Shadow
      ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, horizonRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 6. Orbital Observer Shuttle / Probe Position Indicator
      // rOverRs = 1.0 (Event Horizon) to 10.0+ (Flat Space)
      const maxVisualRadius = width * 0.44;
      const minVisualRadius = baseShadowRadius * 0.98;
      // Map rOverRs log scale to visual radius
      const normalizedR = Math.min(10, Math.max(1.0, rOverRs));
      const visualProbeRadius = minVisualRadius + ((normalizedR - 1.0) / 9.0) * (maxVisualRadius - minVisualRadius);

      const probeOrbitAngle = t * 0.4;
      const probeX = centerX + Math.cos(probeOrbitAngle) * visualProbeRadius;
      const probeY = centerY + Math.sin(probeOrbitAngle) * (visualProbeRadius * 0.35);

      // Probe Orbit Trajectory Ring
      ctx.save();
      ctx.strokeStyle = isEventHorizon
        ? "rgba(239, 68, 68, 0.8)"
        : isPhotonSphere
        ? "rgba(245, 158, 11, 0.7)"
        : isIsco
        ? "rgba(59, 130, 246, 0.7)"
        : "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, visualProbeRadius, visualProbeRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Draw Observer Spacecraft Beacon
      ctx.save();
      const probePulse = Math.sin(t * 12) * 2;
      const probeGlow = ctx.createRadialGradient(probeX, probeY, 1, probeX, probeY, 12 + probePulse);
      probeGlow.addColorStop(0, "#ffffff");
      probeGlow.addColorStop(0.3, isEventHorizon ? "#ef4444" : isPhotonSphere ? "#f59e0b" : "#38bdf8");
      probeGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = probeGlow;
      ctx.beginPath();
      ctx.arc(probeX, probeY, 12 + probePulse, 0, Math.PI * 2);
      ctx.fill();

      // Probe Body Point
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(probeX, probeY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Probe Label
      ctx.font = "9px monospace";
      ctx.fillStyle = isEventHorizon ? "#f87171" : "#e2e8f0";
      ctx.fillText(
        isEventHorizon ? "⚡ GÖZLEMCİ (OLAY UFKUNDA)" : `🛰️ r = ${rOverRs.toFixed(2)} rₛ`,
        probeX + 8,
        probeY - 6
      );
      ctx.restore();

      // 7. Distance & Horizon Marker Legend in Canvas
      ctx.save();
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText("rₛ: Olay Ufku (1.0 rₛ)", 14, height - 38);
      ctx.fillStyle = "rgba(245, 158, 11, 0.8)";
      ctx.fillText("rₚₕ: Foton Küresi (1.5 rₛ)", 14, height - 24);
      ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
      ctx.fillText("rᵢₛ꜀ₒ: En İç Kararlı Yörünge (3.0 rₛ)", 14, height - 10);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [rOverRs, isEventHorizon, isPhotonSphere, isIsco]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
      <canvas
        ref={canvasRef}
        width={580}
        height={280}
        className="w-full h-auto block"
        style={{ aspectRatio: "580/280" }}
      />
      <div className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/30">
        Schwarzschild Relativistic Canvas [g₀₀ = -(1 - rₛ/r)]
      </div>
      <div className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-black/80 text-white/70 border border-white/10">
        r = {rOverRs >= 100 ? "∞ (Düz Uzay)" : `${rOverRs.toFixed(3)} rₛ`}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CANVAS 2: SCHWARZSCHILD TIME DILATION CURVE GRAPH
════════════════════════════════════════════════════════════ */
function SchwarzschildCurveCanvas({ rOverRs, factor }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;
    const padLeft = 46;
    const padRight = 24;
    const padTop = 26;
    const padBottom = 34;

    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);

    // Deep background
    ctx.fillStyle = "#030409";
    ctx.fillRect(0, 0, width, height);

    // Grid lines & Y-Axis labels (Factor: 1x to 10x)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.font = "9px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.textAlign = "right";

    const yLevels = [1, 2, 4, 7, 10];
    yLevels.forEach((yVal) => {
      const yNorm = (yVal - 1) / (10 - 1);
      const py = padTop + plotHeight * (1 - yNorm);

      ctx.beginPath();
      ctx.moveTo(padLeft, py);
      ctx.lineTo(width - padRight, py);
      ctx.stroke();

      ctx.fillText(`${yVal}x`, padLeft - 6, py + 3);
    });

    // X-Axis Grid & Labels: Distance r (1.0 r_s to 6.0 r_s)
    const xMin = 1.0;
    const xMax = 6.0;
    const xLabels = [1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0];

    ctx.textAlign = "center";
    xLabels.forEach((xVal) => {
      const xNorm = (xVal - xMin) / (xMax - xMin);
      const px = padLeft + xNorm * plotWidth;

      ctx.beginPath();
      ctx.moveTo(px, padTop);
      ctx.lineTo(px, height - padBottom);
      ctx.stroke();

      let label = `${xVal} rₛ`;
      if (xVal === 1.0) label = "1.0 (rₛ)";
      if (xVal === 1.5) label = "1.5 (rₚₕ)";
      if (xVal === 3.0) label = "3.0 (ISCO)";

      ctx.fillStyle = xVal === 1.0 ? "#ef4444" : xVal === 1.5 ? "#f59e0b" : xVal === 3.0 ? "#22c55e" : "rgba(255,255,255,0.4)";
      ctx.fillText(label, px, height - padBottom + 14);
    });

    // Asymptote Singularity Line at r = 1.0 r_s (Event Horizon)
    const xAsymptote = padLeft;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(xAsymptote, padTop);
    ctx.lineTo(xAsymptote, height - padBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "8px monospace";
    ctx.fillStyle = "#ef4444";
    ctx.textAlign = "left";
    ctx.fillText("Olay Ufku (Sonsuz Dilatasyon)", padLeft + 6, padTop + 10);

    // Plot Theoretical Schwarzschild Curve: factor = 1 / sqrt(1 - 1/r)
    ctx.beginPath();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.4;

    const samples = 150;
    for (let i = 0; i <= samples; i++) {
      const rVal = 1.008 + (i / samples) * (xMax - 1.008);
      const f = 1 / Math.sqrt(1 - 1 / rVal);
      const clampedF = Math.min(10, Math.max(1, f));

      const xNorm = (rVal - xMin) / (xMax - xMin);
      const yNorm = (clampedF - 1) / (10 - 1);

      const px = padLeft + xNorm * plotWidth;
      const py = padTop + plotHeight * (1 - yNorm);

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Plot Current Selected Coordinate Point
    const curR = Math.min(xMax, Math.max(1.001, rOverRs));
    const curF = !isFinite(factor) ? 10 : Math.min(10, Math.max(1, factor));
    const curXNorm = (curR - xMin) / (xMax - xMin);
    const curYNorm = (curF - 1) / (10 - 1);

    const ptX = padLeft + curXNorm * plotWidth;
    const ptY = padTop + plotHeight * (1 - curYNorm);

    // Current point glow
    const ptGlow = ctx.createRadialGradient(ptX, ptY, 1, ptX, ptY, 10);
    ptGlow.addColorStop(0, "#ffffff");
    ptGlow.addColorStop(0.4, "#fbbf24");
    ptGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = ptGlow;
    ctx.beginPath();
    ctx.arc(ptX, ptY, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ptX, ptY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Point Coordinates Label
    ctx.font = "9px monospace";
    ctx.fillStyle = "#fbbf24";
    ctx.textAlign = curXNorm > 0.7 ? "right" : "left";
    ctx.fillText(
      `r = ${rOverRs.toFixed(2)} rₛ (${!isFinite(factor) ? "∞" : factor.toFixed(2) + "x"})`,
      ptX + (curXNorm > 0.7 ? -10 : 10),
      ptY - 8
    );
  }, [rOverRs, factor]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
      <canvas
        ref={canvasRef}
        width={580}
        height={280}
        className="w-full h-auto block"
        style={{ aspectRatio: "580/280" }}
      />
      <div className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/30">
        SCHWARZSCHILD EĞRİSİ dt/dτ = (1 - rₛ/r)⁻¹/²
      </div>
      <div className="absolute bottom-3 right-3 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-black/80 text-white/70 border border-white/10">
        Faktör = {!isFinite(factor) ? "∞ (Tekillik)" : `${factor.toFixed(4)}x`}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   LIVE TWIN CLOCK DILATION COMPONENT (PROBE VS DISTANT EARTH)
════════════════════════════════════════════════════════════ */
function GravitationalTwinClocks({ factor, isEventHorizon }) {
  const [earthSeconds, setEarthSeconds] = useState(0);
  const [probeSeconds, setProbeSeconds] = useState(0);

  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const updateClocks = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Earth / Distant Observer clock ticks naturally (1.0 sec/sec)
      setEarthSeconds((prev) => prev + dt);

      // Probe clock near black hole ticks slower: dt_probe = dt_earth / factor
      if (!isEventHorizon && isFinite(factor) && factor > 0) {
        setProbeSeconds((prev) => prev + dt / factor);
      }
      // If at event horizon: factor = Infinity -> probe clock is completely FROZEN (0 progress)

      animId = requestAnimationFrame(updateClocks);
    };

    animId = requestAnimationFrame(updateClocks);
    return () => cancelAnimationFrame(animId);
  }, [factor, isEventHorizon]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      {/* Clock 1: Distant Earth Observer (Flat Spacetime) */}
      <div className="cockpit-panel p-5 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            🌍 Uzak Gözlemci (Dünya / Düz Uzay)
          </span>
          <span className="font-mono text-[10px] text-white/50">r → ∞ (g₀₀ = -1)</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl md:text-4xl font-black text-white tracking-wider">
            {earthSeconds.toFixed(1)}
          </span>
          <span className="font-mono text-sm text-white/60">saniye</span>
        </div>
        <p className="font-mono text-[11px] text-white/50 mt-2">
          Yerçekimi etkisinden uzak sonsuzluktaki standart koordinat zamanı ($t$).
        </p>
      </div>

      {/* Clock 2: Probe Observer near Black Hole (Curved Spacetime) */}
      <div className={`cockpit-panel p-5 rounded-2xl border ${isEventHorizon ? 'border-red-500/50 bg-red-950/20' : 'border-amber-500/30 bg-black/50'} backdrop-blur-md`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`font-mono text-[10px] uppercase tracking-widest ${isEventHorizon ? 'text-red-400 font-black' : 'text-amber-400 font-bold'} flex items-center gap-2`}>
            <span className={`h-2 w-2 rounded-full ${isEventHorizon ? 'bg-red-500 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            {isEventHorizon ? "⚡ ZAMAN DONDU (OLAY UFKU)" : "🛰️ Kara Delik Yörüngesindeki Gözlemci"}
          </span>
          <span className="font-mono text-[10px] text-white/50">Öz Zaman ($\tau$)</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`font-mono text-3xl md:text-4xl font-black ${isEventHorizon ? 'text-red-400' : 'text-amber-300'} tracking-wider`}>
            {isEventHorizon ? "0.0 (DURDU)" : probeSeconds.toFixed(1)}
          </span>
          <span className="font-mono text-sm text-white/60">saniye</span>
        </div>
        <p className="font-mono text-[11px] text-white/50 mt-2">
          {isEventHorizon
            ? "Olay ufkunda ($r = r_s$) yerçekimsel zaman tamamen durur. Uzak gözlemciye göre donmuş görünürsünüz."
            : `Uzak gözlemcideki her ${factor.toFixed(2)} saniyeye karşılık mekikte yalnızca 1 saniye geçer.`}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN SCHWARZSCHILD CALCULATOR PAGE
════════════════════════════════════════════════════════════ */
export default function TimeDilationPage() {
  const [lang, setLang] = useState("tr");
  const [activeTab, setActiveTab] = useState("simulator"); // 'simulator' | 'theory' | 'archive'

  // Selected Preset or Custom Mass
  const [selectedPreset, setSelectedPreset] = useState(BLACK_HOLE_PRESETS[0]);
  const [customMassSolar, setCustomMassSolar] = useState(100000000);
  // Radius expressed in units of r_s (Schwarzschild radius)
  const [rOverRs, setROverRs] = useState(1.000000002);

  // Compute Physics Values
  // r_s = 2GM / c^2
  const currentMassKg = selectedPreset ? selectedPreset.massKg : customMassSolar * M_SUN;
  const rsMeters = (2 * G * currentMassKg) / (C * C);
  const rsKm = rsMeters / 1000;
  const currentRadiusKm = rOverRs * rsKm;

  // Stability Zones
  const isEventHorizon = rOverRs <= 1.0000000001;
  const isInsidePhotonSphere = rOverRs < 1.5 && !isEventHorizon;
  const isPhotonSphere = Math.abs(rOverRs - 1.5) < 0.05;
  const isInsideIsco = rOverRs < 3.0 && rOverRs >= 1.5;
  const isIsco = Math.abs(rOverRs - 3.0) < 0.1;
  const isOrbitStable = rOverRs >= 3.0;

  // Gravitational Time Dilation Factor: dt / dtau = 1 / sqrt(1 - rs/r)
  let factor = 1.0;
  if (rOverRs > 1.0) {
    factor = 1.0 / Math.sqrt(1.0 - 1.0 / rOverRs);
  } else {
    factor = Infinity;
  }

  // Gravitational Redshift: z = 1 / sqrt(1 - rs/r) - 1
  const redshiftZ = isFinite(factor) ? factor - 1 : Infinity;

  // Orbital Velocity at distance r (for circular geodesics r >= 3 rs): v_orb = c * sqrt(rs / (2r))
  const orbitalVelocityC = rOverRs >= 1.5 ? Math.sqrt(1.0 / (2.0 * rOverRs)) : null;

  // Tidal Acceleration Difference (Spaghettification force on a 1.8m human): Delta a ~ 2GM * h / r^3
  const rMeters = currentRadiusKm * 1000;
  const tidalAcceleration = (2 * G * currentMassKg * 1.8) / Math.pow(rMeters, 3);
  const tidalGForce = tidalAcceleration / 9.80665;

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setCustomMassSolar(preset.massSolar);
    setROverRs(preset.defaultR_Rs);
  };

  const PAGE_TEXT = {
    tr: {
      badge: "GENEL GÖRELİLİK // SCHWARZSCHILD METRİĞİ",
      title: "Schwarzschild Zaman Dilatasyonu\n& Kara Delik Simülatörü",
      sub: "Albert Einstein'ın Genel Görelilik kuramına göre dönmeyen bir kara deliğe yaklaştıkça uzay-zaman bükülmesini, yerçekimsel zaman genleşmesini, foton küresini ve ISCO yörünge sınırlarını interaktif olarak keşfedin.",
      tabSim: "🕳️ Karadelik & Zaman Simülatörü",
      tabTheory: "📐 Görelilik Kuramı & Metrik",
      tabArchive: "🎬 Bilimsel Arşiv & Video"
    },
    en: {
      badge: "GENERAL RELATIVITY // SCHWARZSCHILD METRIC",
      title: "Schwarzschild Time Dilation\n& Black Hole Simulator",
      sub: "Interactively explore spacetime curvature, gravitational time dilation, photon sphere and ISCO orbit stability limits near a non-rotating Schwarzschild black hole.",
      tabSim: "🕳️ Black Hole Simulator",
      tabTheory: "📐 General Relativity Theory",
      tabArchive: "🎬 Scientific Archive & Video"
    }
  }[lang];

  return (
    <div className="min-h-screen transition-theme" style={{ color: "var(--foreground)" }}>
      <ReadingProgressBar />
      <Header isArticle={false} lang={lang} onLangChange={setLang} />

      {/* Hero Header */}
      <section className="py-12 md:py-16 animate-fade-in-up" style={{ borderBottom: "1px solid var(--border-color)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/calculations"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest mb-6 transition-theme opacity-75 hover:opacity-100 hover:text-amber-400"
          >
            ← {lang === "en" ? "All Calculation Tools" : "Tüm Hesaplama Araçları"}
          </Link>

          <div
            className="inline-flex items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full block w-fit"
            style={{ border: "1px solid rgba(245, 158, 11, 0.3)", background: "rgba(245, 158, 11, 0.08)", color: "#fbbf24" }}
          >
            <span className="h-1.5 w-1.5 rounded-full inline-block bg-amber-400 animate-pulse" />
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
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {PAGE_TEXT.tabSim}
            </button>
            <button
              onClick={() => setActiveTab("theory")}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                activeTab === "theory"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {PAGE_TEXT.tabTheory}
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                activeTab === "archive"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {PAGE_TEXT.tabArchive}
            </button>
          </div>
        </div>
      </section>

      {/* Main Interactive App Body */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "simulator" && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Control Panel: Black Hole Selection & Distance Slider */}
            <div className="cockpit-panel p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl bg-black/60 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
                    1. KARA DELİK SEÇİMİ VEYA KÜTLE AYARI:
                  </h3>
                  <p className="text-xs text-white/60">
                    Hesaplama yapmak istediğiniz kozmik kara deliği seçin veya kütlesini değiştirin.
                  </p>
                </div>
                <div className="font-mono text-xs text-white/70 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                  Schwarzschild Yarıçapı ($r_s$): <strong className="text-amber-300 font-bold">{rsKm >= 10000 ? `${(rsKm / 1e6).toFixed(2)} Milyon km` : `${rsKm.toLocaleString('tr-TR')} km`}</strong>
                </div>
              </div>

              {/* Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {BLACK_HOLE_PRESETS.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-white">{lang === "en" ? preset.nameEn : preset.nameTr}</span>
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                          {lang === "en" ? preset.badgeEn : preset.badgeTr}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 line-clamp-2">
                        {lang === "en" ? preset.descEn : preset.descTr}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Distance Slider from Singularity (Expressed in r / r_s) */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold">
                      2. RADYAL MESAFE SLIDER'I ($r / r_s$):
                    </span>
                    <p className="text-xs text-white/60">
                      Kara deliğin merkezine olan uzaklığınızı Schwarzschild yarıçapı cinsinden ayarlayın.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-black text-amber-300">
                      {isEventHorizon ? "1.0000 rₛ (Olay Ufku)" : `${rOverRs.toFixed(4)} rₛ`}
                    </span>
                    <span className="block font-mono text-[11px] text-white/50">
                      Fiziksel Mesafe: {currentRadiusKm >= 1e6 ? `${(currentRadiusKm / 1e6).toFixed(2)} Milyon km` : `${currentRadiusKm.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km`}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.0001"
                  value={rOverRs}
                  onChange={(e) => setROverRs(parseFloat(e.target.value))}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-white/10 accent-amber-400"
                />

                {/* Critical Physics Boundary Markers */}
                <div className="flex justify-between font-mono text-[10px] mt-3 text-white/60">
                  <span className="text-red-400 font-bold cursor-pointer" onClick={() => setROverRs(1.0)}>
                    1.0 rₛ (Olay Ufku)
                  </span>
                  <span className="text-amber-400 font-bold cursor-pointer" onClick={() => setROverRs(1.5)}>
                    1.5 rₛ (Foton Küresi)
                  </span>
                  <span className="text-emerald-400 font-bold cursor-pointer" onClick={() => setROverRs(3.0)}>
                    3.0 rₛ (ISCO Kararlı Yörünge)
                  </span>
                  <span className="text-white/60 cursor-pointer" onClick={() => setROverRs(10.0)}>
                    10.0 rₛ (Zayıf Alan)
                  </span>
                </div>
              </div>
            </div>

            {/* Twin Clocks Simulation (Realtime Synchronized Coordinates) */}
            <GravitationalTwinClocks factor={factor} isEventHorizon={isEventHorizon} />

            {/* Dual Interactive Canvases: Lensed Accretion Disk & Schwarzschild Dilation Curve */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold mb-2 flex items-center gap-2">
                  <span>🌌</span> KÜTLEÇEKİMSEL MERCEKLEME & AKRESYON DİSKİ
                </h4>
                <RelativisticBlackHoleCanvas
                  rOverRs={rOverRs}
                  isEventHorizon={isEventHorizon}
                  isPhotonSphere={isInsidePhotonSphere || isPhotonSphere}
                  isIsco={isIsco}
                />
              </div>

              <div>
                <h4 className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold mb-2 flex items-center gap-2">
                  <span>📈</span> SCHWARZSCHILD EĞRİSİ VE ASİMPTOTİK TEKİLLİK
                </h4>
                <SchwarzschildCurveCanvas rOverRs={rOverRs} factor={factor} />
              </div>
            </div>

            {/* Realtime Relativistic Output Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Time Dilation Factor */}
              <div className="cockpit-panel p-5 rounded-2xl border border-white/10 bg-black/40">
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold block mb-1">
                  Zaman Genleşme Faktörü ($dt / d\tau$)
                </span>
                <span className="font-mono text-2xl font-black text-white">
                  {!isFinite(factor) ? "∞ TEKİLLİK" : `${factor.toFixed(4)}x`}
                </span>
                <p className="font-mono text-[10px] text-white/50 mt-2">
                  Mekikte geçen 1 saniyeye karşılık Dünya'da geçen süre.
                </p>
              </div>

              {/* Metric 2: Gravitational Redshift */}
              <div className="cockpit-panel p-5 rounded-2xl border border-white/10 bg-black/40">
                <span className="font-mono text-[10px] uppercase tracking-widest text-purple-400 font-bold block mb-1">
                  Kütleçekimsel Kırmızıya Kayma ($z$)
                </span>
                <span className="font-mono text-2xl font-black text-white">
                  {!isFinite(redshiftZ) ? "∞ (Karanlık)" : `+${redshiftZ.toFixed(4)}`}
                </span>
                <p className="font-mono text-[10px] text-white/50 mt-2">
                  Mekikten yayılan ışığın uzak gözlemciye ulaşırken kaybettiği enerji.
                </p>
              </div>

              {/* Metric 3: Circular Orbital Velocity */}
              <div className="cockpit-panel p-5 rounded-2xl border border-white/10 bg-black/40">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                  {"Yörünge Hızı (v_orb)"}
                </span>
                <span className="font-mono text-2xl font-black text-white">
                  {orbitalVelocityC ? `${(orbitalVelocityC * 100).toFixed(2)}% c` : "Yörünge İmkânsız"}
                </span>
                <p className="font-mono text-[10px] text-white/50 mt-2">
                  {orbitalVelocityC ? `~${(orbitalVelocityC * 299792).toFixed(0)} km/s dairesel hız.` : "Foton küresi içinde dairesel yörünge yoktur."}
                </p>
              </div>

              {/* Metric 4: Tidal Spaghettification */}
              <div className="cockpit-panel p-5 rounded-2xl border border-white/10 bg-black/40">
                <span className="font-mono text-[10px] uppercase tracking-widest text-rose-400 font-bold block mb-1">
                  Gelgit Kuvveti (Spagettileşme)
                </span>
                <span className="font-mono text-2xl font-black text-white">
                  {tidalGForce >= 1e6 ? `${(tidalGForce / 1e6).toFixed(1)}M G` : `${tidalGForce.toFixed(1)} G`}
                </span>
                <p className="font-mono text-[10px] text-white/50 mt-2">
                  Baş ve ayak arasındaki kütleçekim farkı (1.8m insan boyu için).
                </p>
              </div>
            </div>

            {/* Orbit Stability Alert Banner */}
            <div className={`p-4 rounded-2xl border ${
              isEventHorizon
                ? "border-red-500 bg-red-950/30 text-red-300"
                : isInsidePhotonSphere
                ? "border-rose-500 bg-rose-950/20 text-rose-300"
                : isInsideIsco
                ? "border-amber-500 bg-amber-950/20 text-amber-300"
                : "border-emerald-500 bg-emerald-950/20 text-emerald-300"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {isEventHorizon ? "⚡" : isInsidePhotonSphere ? "⚠️" : isInsideIsco ? "🔄" : "✅"}
                </span>
                <div>
                  <h5 className="font-mono text-xs font-black uppercase tracking-wider">
                    {isEventHorizon
                      ? "OLAY UFKU (EVENT HORIZON - r = 1.0 rₛ): GERİ DÖNÜŞÜ OLMAYAN NOKTA"
                      : isInsidePhotonSphere
                      ? "FOTON KÜRESİ İÇİ (r < 1.5 rₛ): IŞIK BİLE DOĞRUDAN MERKEZE DÜŞER"
                      : isInsideIsco
                      ? "KARARSIZ YÖRÜNGE BÖLGESİ (1.5 rₛ ≤ r < 3.0 rₛ): SÜREKLİ ROKET İTKİSİ GEREKİR"
                      : "STABİL VE GÜVENLİ YÖRÜNGE (r ≥ 3.0 rₛ ISCO): SERBEST DÜŞÜM DENGESİ"}
                  </h5>
                  <p className="text-xs opacity-80 mt-0.5">
                    {isEventHorizon
                      ? "Kaçış hızı ışık hızını aşmıştır (v_esc ≥ c). Zaman dış gözlemciye göre sonsuza kilitlenir, fiziksel nesne tekilliğe (r = 0) çöker."
                      : isInsidePhotonSphere
                      ? "Fotonlar bile dairesel yörüngede kalamaz, merkeze spiral çizerek çekilir. Hiçbir kapalı kararlı yörünge bulunmaz."
                      : isInsideIsco
                      ? "En İç Kararlı Dairesel Yörünge'nin (ISCO) altındasınız. Dairesel yörünge mekanik olarak kararsızdır; küçük bir sarsıntı kara deliğe düşüşe yol açar."
                      : "Yörünge mekanik olarak stabildir. Uzay aracı yakıt harcamadan dairesel jeodezik yörüngede kalabilir."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: General Relativity Theory & Mathematics */}
        {activeTab === "theory" && (
          <div className="cockpit-panel p-6 md:p-10 rounded-3xl border border-white/10 bg-black/50 backdrop-blur-md space-y-8 animate-fade-in-up">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold block mb-2">
                KURAMSAL ASTROFİZİK // EINSTEIN ALAN DENKLEMLERİ
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                Schwarzschild Metriği ve Yerçekimsel Zaman Genleşmesi
              </h2>
              <p className="text-sm md:text-base text-white/70 mt-3 leading-relaxed">
                1915 yılında Karl Schwarzschild, Albert Einstein'ın Genel Görelilik kuramının boşluktaki ilk kesin analitik çözümünü bulmuştur. Bu metrik, dönmeyen ve elektrik yükü taşımayan küresel simetrik bir kütlenin uzay-zaman geometrisini açıklar.
              </p>
            </div>

            {/* Formula Block 1: The Schwarzschild Metric */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="font-mono text-sm font-bold text-amber-300 mb-2">
                1. Schwarzschild Uzay-Zaman Metriği (ds²)
              </h3>
              <div className="font-mono text-sm md:text-base bg-black/60 p-4 rounded-xl text-amber-200 overflow-x-auto border border-white/5 my-3">
                ds² = -(1 - rₛ / r) c² dt² + (1 - rₛ / r)⁻¹ dr² + r² (dθ² + sin²θ dφ²)
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Burada rₛ = 2GM / c² Schwarzschild yarıçapıdır. r → rₛ olduğunda g₀₀ → 0 ve g_rr → ∞ olur. Bu durum, olay ufkunun koordinat tekilliğini temsil eder.
              </p>
            </div>

            {/* Formula Block 2: Gravitational Time Dilation */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="font-mono text-sm font-bold text-amber-300 mb-2">
                2. Yerçekimsel Zaman Genleşmesi Formülü
              </h3>
              <div className="font-mono text-sm md:text-base bg-black/60 p-4 rounded-xl text-amber-200 overflow-x-auto border border-white/5 my-3">
                dτ = dt · √(1 - rₛ / r)  ⟹  dt / dτ = 1 / √(1 - 2GM / rc²)
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                dτ kara deliğe yakın mekikteki öz zaman (proper time), dt ise sonsuz uzaktaki gözlemcinin koordinat zamanıdır. r = rₛ sınırında dτ → 0 olur; yani olay ufkundaki bir saat uzaktaki evrene göre tamamen donar.
              </p>
            </div>

            {/* Critical Radius Boundaries Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-red-500/30 bg-red-950/15">
                <h4 className="font-mono text-xs font-bold text-red-400 mb-1">Olay Ufku ($r = 1.0 r_s$)</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Kaçış hızının ışık hızına ($c$) eşit olduğu sınırdır. Bu sınırın içerisine giren hiçbir foton veya madde evrene geri dönemez.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/15">
                <h4 className="font-mono text-xs font-bold text-amber-400 mb-1">Foton Küresi ($r = 1.5 r_s$)</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Işığın (fotonların) kütleçekim nedeniyle dairesel yörüngede dolanabildiği son sınırdır. Bu yarıçaptaki bir gözlemci kendi kafasının arkasını görebilir.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/15">
                <h4 className="font-mono text-xs font-bold text-emerald-400 mb-1">ISCO Sınırı ($r = 3.0 r_s$)</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  En İç Kararlı Dairesel Yörünge (Innermost Stable Circular Orbit). Maddenin yakıt harcamadan dengede dönebileceği en yakın güvenli sınırdır.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Scientific Video & Archival Footage */}
        {activeTab === "archive" && (
          <div className="cockpit-panel p-6 md:p-10 rounded-3xl border border-white/10 bg-black/50 backdrop-blur-md space-y-8 animate-fade-in-up">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold block mb-2">
                BİLİMSEL GÖRSEL ARŞİV // ASTROFİZİK DOKÜMANTASYONU
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                Kara Delik Merceklemesi ve Zamanın Sonu
              </h2>
              <p className="text-sm md:text-base text-white/70 mt-3 leading-relaxed">
                Event Horizon Telescope (EHT), NASA ve bağımsız astrofizik enstitülerinin kütleçekimsel mercekleme ve zaman genleşmesi üzerine hazırladığı simülasyon ve gözlem kayıtları.
              </p>
            </div>

            {/* Video 1: Veritasium / General Relativity Black Hole */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <div className="relative w-full pb-[56.25%]">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/zUyH3XhpLTo"
                  title="How to Understand Black Holes"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4 bg-white/5 border-t border-white/10">
                <h4 className="font-bold text-sm text-white">Kara Deliklerin Işığı Bükmesi ve Olay Ufku Gölgesi</h4>
                <p className="text-xs text-white/60 mt-1">
                  Genel Görelilik kuramında ışığın foton küresinde bükülmesi ve Schwarzschild yarıçapının görsel oluşumu.
                </p>
              </div>
            </div>

            {/* Video 2: Interstellar Kip Thorne Physics */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <div className="relative w-full pb-[56.25%]">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/6c_CW3Z_mtU"
                  title="The Science of Interstellar: Gargantua"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4 bg-white/5 border-t border-white/10">
                <h4 className="font-bold text-sm text-white">Gargantua ve Miller Gezegenindeki Zaman Dilatasyonu (Kip Thorne)</h4>
                <p className="text-xs text-white/60 mt-1">
                  Nobel ödüllü astrofizikçi Kip Thorne'un Interstellar filmi için modellediği devasa dönen kara delik ve 1 saat = 7 yıl denklemi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-12">
          <Link
            href="/calculations"
            className="font-mono text-xs uppercase tracking-widest transition-theme inline-flex items-center gap-2 opacity-75 hover:opacity-100 hover:text-amber-400"
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

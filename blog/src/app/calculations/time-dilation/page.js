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

// Celestial Body Presets with Kerr Spin Parameter (a_star = Jc / GM^2)
const BLACK_HOLE_PRESETS = [
  {
    id: "gargantua",
    nameTr: "🪐 Gargantua (Interstellar)",
    nameEn: "🪐 Gargantua (Supermassive)",
    massSolar: 100000000, // 100M M_sun
    massKg: 100000000 * 1.989e30,
    rsKm: 295325000,      // ~295 million km
    defaultR_Rs: 1.000000002, // Miller's Planet orbit / Extreme Ergosphere frame
    defaultSpin: 0.998,   // Kip Thorne's exact spin parameter for Gargantua
    badgeTr: "Ekstrem Kerr (Spin 0.998)",
    badgeEn: "Extreme Kerr (Spin 0.998)",
    descTr: "Miller Gezegeninde 1 saat = Dünya'da 7 yıl. Işık hızının %99.8'i hızında dönen devasa ergosfer.",
    descEn: "1 hour on Miller's planet = 7 Earth years. Rotating at 99.8% maximal spin with massive ergosphere."
  },
  {
    id: "sagittarius_a",
    nameTr: "🌌 Sagittarius A* (Samanyolu Merkezi)",
    nameEn: "🌌 Sagittarius A* (Milky Way Center)",
    massSolar: 4154000,   // ~4.15 Million Solar masses
    massKg: 4.154e6 * 1.989e30,
    rsKm: 12270000,       // ~12.27 Million km
    defaultR_Rs: 3.0,     // ISCO Orbit
    defaultSpin: 0.90,    // Chandra X-Ray / EHT measurement estimate (~0.90)
    badgeTr: "Hızlı Dönen Kerr (0.90)",
    badgeEn: "High-Spin Kerr (0.90)",
    descTr: "Samanyolu Galaksisi'nin merkezindeki 4.15 milyon Güneş kütleli dönen devasa kara delik.",
    descEn: "Supermassive black hole at the center of the Milky Way galaxy spinning at a* ≈ 0.90."
  },
  {
    id: "m87",
    nameTr: "🔭 M87* (Event Horizon Telescope)",
    nameEn: "🔭 M87* (First Imaged Black Hole)",
    massSolar: 6500000000, // 6.5 Billion Solar masses
    massKg: 6.5e9 * 1.989e30,
    rsKm: 19196000000,    // ~19.2 Billion km (~128 AU)
    defaultR_Rs: 1.5,     // Photon Sphere
    defaultSpin: 0.94,    // Relativistic jet launch spin estimate (~0.94)
    badgeTr: "Görüntülenen İlk Kerr Dev",
    badgeEn: "First Imaged Kerr Giant",
    descTr: "EHT tarafından doğrudan gölgesi ve rölativistik jeti fotoğraflanan 6.5 milyar Güneş kütleli dev.",
    descEn: "First directly photographed black hole shadow with massive relativistic jets powered by spin energy."
  },
  {
    id: "cygnus_x1",
    nameTr: "⚡ Cygnus X-1 (Yıldızsal Kara Delik)",
    nameEn: "⚡ Cygnus X-1 (Stellar Black Hole)",
    massSolar: 21.2,      // 21.2 Solar masses
    massKg: 21.2 * 1.989e30,
    rsKm: 62.6,           // ~62.6 km
    defaultR_Rs: 2.0,
    defaultSpin: 0.99,    // Nearly maximal spinning stellar black hole
    badgeTr: "Ekstrem Spin (0.99)",
    badgeEn: "Extreme Stellar Spin",
    descTr: "Samanyolu'nda keşfedilen ilk güçlü X-ışını yıldızsal kara deliği (ışık hızına yakın dönüyor).",
    descEn: "First confirmed stellar-mass black hole discovered in the Milky Way with extreme spin."
  },
  {
    id: "static_schwarzschild",
    nameTr: "⚪ Statik Klasik Kara Delik (Spin = 0)",
    nameEn: "⚪ Static Schwarzschild (Spin = 0)",
    massSolar: 10,
    massKg: 10 * 1.989e30,
    rsKm: 29.53,
    defaultR_Rs: 3.0,
    defaultSpin: 0.0,     // Pure Schwarzschild
    badgeTr: "Dönmeyen (Schwarzschild)",
    badgeEn: "Non-Rotating (a*=0)",
    descTr: "Dönüşü olmayan (a* = 0), tam küresel simetrik 1915 klasik Schwarzschild çözümü.",
    descEn: "Classical 1915 spherically symmetric solution with zero angular momentum (a*=0)."
  },
  {
    id: "earth_mass",
    nameTr: "🌍 Mikro Kara Delik (Dünya Kütlesi)",
    nameEn: "🌍 Micro Black Hole (Earth Mass)",
    massSolar: 3.0e-6,
    massKg: 5.972e24,
    rsKm: 0.00000887,     // ~8.87 mm (bir fındık boyutu)
    defaultR_Rs: 4.0,
    defaultSpin: 0.0,
    badgeTr: "Teorik Mikro Delik",
    badgeEn: "Theoretical Micro",
    descTr: "Dünya'nın tüm kütlesi bir fındık boyutuna (8.87 mm) sıkışsaydı oluşacak kara delik.",
    descEn: "If entire Earth mass compressed into peanut size (8.87 mm radius)."
  }
];

/* ════════════════════════════════════════════════════════════
   CANVAS 1: REALISTIC ASTROPHYSICAL BLACK HOLE (KERR / SCHWARZSCHILD)
   Realistic Gravitational Lensing, Thermal Accretion Disk, Doppler Beaming & Shadow
════════════════════════════════════════════════════════════ */
function RelativisticBlackHoleCanvas({ rOverRs, spin, isEventHorizon, isErgosphere, isPhotonSphere, isIsco }) {
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

    // Realistic Deep-Space Astrophysical Starfield (Uniform, faint, pinpoint stars)
    const bgStars = [];
    for (let i = 0; i < 340; i++) {
      bgStars.push({
        origX: Math.random() * width,
        origY: Math.random() * height,
        size: Math.random() < 0.88 ? 0.35 + Math.random() * 0.55 : 0.9 + Math.random() * 0.6,
        alpha: 0.25 + Math.random() * 0.5,
        r: 240 + Math.floor(Math.random() * 15),
        g: 240 + Math.floor(Math.random() * 15),
        b: 250 + Math.floor(Math.random() * 5)
      });
    }

    // Realistic Accretion Disk Plasma Filaments (Thermal Planck Spectrum: White-Hot, Amber, Deep Crimson)
    const diskParticles = [];
    for (let i = 0; i < 480; i++) {
      diskParticles.push({
        angle: Math.random() * Math.PI * 2,
        distFactor: 1.15 + Math.random() * 3.4, // multiple of shadow radius
        baseSpeed: 0.008 + Math.random() * 0.014,
        size: 0.5 + Math.random() * 1.3,
        alpha: 0.25 + Math.random() * 0.6,
        tempKelvin: Math.random() // 1.0 = inner white hot, 0.0 = outer red cool
      });
    }

    let t = 0;

    const render = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Deep space void backdrop: True pitch black cosmic void
      ctx.fillStyle = "#010103";
      ctx.fillRect(0, 0, width, height);

      // Apparent Visual Shadow Radius (Photon capture cross section)
      // For Schwarzschild: R_shadow = 3*sqrt(3)*M ≈ 2.6 Rs / 2 ≈ 1.3 Rs visual scale
      const spinShrink = Math.sqrt(Math.max(0, 1 - spin * spin));
      const baseShadowRadius = 48 * (0.85 + 0.15 * spinShrink);
      const horizonRadius = baseShadowRadius * (0.42 * (1 + spinShrink));
      const ergosphereRadiusX = baseShadowRadius * 0.94;

      // 1. Draw Background Stars with Precise Gravitational Lensing Deflection & Frame Dragging
      for (const s of bgStars) {
        const dx = s.origX - centerX;
        const dy = s.origY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < baseShadowRadius * 0.94) {
          // Inside Black Hole Apparent Shadow - Perfectly pitch black
          continue;
        }

        // Einstein Gravitational Deflection alpha ~ 4GM / (c^2 b)
        const deflection = (baseShadowRadius * 32) / Math.max(12, dist);
        const swirlAngle = (spin * 140) / Math.pow(Math.max(20, dist), 1.5);
        const currentAngle = Math.atan2(dy, dx) + swirlAngle * 0.12;

        const lensedX = centerX + Math.cos(currentAngle) * (dist + deflection * 0.32);
        const lensedY = centerY + Math.sin(currentAngle) * (dist + deflection * 0.32);

        // Einstein Ring Amplification near shadow boundary
        const isNearRing = Math.abs(dist - baseShadowRadius * 1.28) < 6;
        const alphaBoost = isNearRing ? 1.5 : 1.0;

        ctx.fillStyle = `rgba(${s.r}, ${s.g}, ${s.b}, ${Math.min(1, s.alpha * alphaBoost)})`;
        ctx.beginPath();
        ctx.arc(lensedX, lensedY, s.size * (isNearRing ? 1.25 : 1.0), 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Realistic Gravitational Lensing Glow / Thin Photon Ring
      const photonRingGrad = ctx.createRadialGradient(
        centerX, centerY, baseShadowRadius * 0.88,
        centerX, centerY, baseShadowRadius * 2.3
      );
      photonRingGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      photonRingGrad.addColorStop(0.12, "rgba(254, 215, 170, 0.5)"); // Warm thermal gold
      photonRingGrad.addColorStop(0.35, "rgba(194, 65, 12, 0.2)");  // Deep amber
      photonRingGrad.addColorStop(0.7, "rgba(67, 20, 7, 0.05)");    // Faint infrared glow
      photonRingGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = photonRingGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseShadowRadius * 2.3, 0, Math.PI * 2);
      ctx.fill();

      // 3. Upper Lensed Accretion Disk Arc (Light curved over top of the black hole)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 4, baseShadowRadius * 2.1, baseShadowRadius * 0.95, 0, Math.PI, 0);
      const topArcGrad = ctx.createLinearGradient(centerX - 90, 0, centerX + 90, 0);
      topArcGrad.addColorStop(0, "rgba(154, 52, 18, 0.15)"); // Redshifted receding side
      topArcGrad.addColorStop(0.35, "rgba(255, 250, 240, 0.9)"); // Blueshifted approaching side
      topArcGrad.addColorStop(0.65, "rgba(251, 146, 60, 0.5)");
      topArcGrad.addColorStop(1, "rgba(124, 45, 18, 0.1)");
      ctx.strokeStyle = topArcGrad;
      ctx.lineWidth = 9;
      ctx.filter = "blur(2.5px)";
      ctx.stroke();
      ctx.filter = "none";
      ctx.restore();

      // 4. Lower Lensed Accretion Disk Arc (Secondary image under the horizon)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 4, baseShadowRadius * 1.6, baseShadowRadius * 0.45, 0, 0, Math.PI);
      const bottomArcGrad = ctx.createLinearGradient(centerX - 70, 0, centerX + 70, 0);
      bottomArcGrad.addColorStop(0.3, "rgba(255, 245, 230, 0.5)");
      bottomArcGrad.addColorStop(0.7, "rgba(194, 65, 12, 0.2)");
      ctx.strokeStyle = bottomArcGrad;
      ctx.lineWidth = 5;
      ctx.filter = "blur(2px)";
      ctx.stroke();
      ctx.filter = "none";
      ctx.restore();

      // 5. Thermal Plasma Accretion Disk (Rotated 74 deg perspective)
      for (const p of diskParticles) {
        // Frame-dragging velocity boost
        const speedBoost = 1 + (spin * 1.5) / Math.max(1, p.distFactor);
        p.angle += p.baseSpeed * speedBoost;

        const radX = baseShadowRadius * p.distFactor;
        const radY = radX * 0.26; // 3D tilt perspective

        const px = centerX + Math.cos(p.angle) * radX;
        const py = centerY + Math.sin(p.angle) * radY;

        // Relativistic Doppler Beaming: Approaching side (left) is amplified & white-hot; Receding side (right) is dimmed & dark red
        const dopplerFactor = (Math.cos(p.angle + Math.PI / 2) + 1) / 2; // 1 = approaching, 0 = receding

        // Natural Planck Thermal Color Gradient
        let r, g, b, a;
        if (p.distFactor < 1.6) {
          // Inner Hot ISCO Region: 10,000K+ White/Gold
          r = 255;
          g = Math.round(220 + dopplerFactor * 35);
          b = Math.round(180 + dopplerFactor * 75);
          a = (0.35 + dopplerFactor * 0.65) * p.alpha;
        } else {
          // Outer Cooler Disk: 3,000K - 6,000K Amber / Crimson
          r = Math.round(200 + dopplerFactor * 55);
          g = Math.round(90 + dopplerFactor * 90);
          b = Math.round(30 + dopplerFactor * 50);
          a = (0.2 + dopplerFactor * 0.6) * p.alpha;
        }

        // Mask particles behind black hole shadow
        const isBehind = Math.sin(p.angle) < 0 && Math.abs(px - centerX) < baseShadowRadius * 1.02;
        if (!isBehind) {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * (0.8 + dopplerFactor * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 6. Black Hole Apparent Shadow (True Absolute Black)
      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      if (spin > 0.5) {
        // Kerr shadow slight D-shape flattening on approaching side
        ctx.ellipse(centerX - spin * 3, centerY, baseShadowRadius * 0.94, baseShadowRadius * 0.98, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(centerX, centerY, baseShadowRadius * 0.96, 0, Math.PI * 2);
      }
      ctx.fill();

      // Sharp Photon Ring Luminous Boundary
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseShadowRadius * 0.95, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Event Horizon Reference Ring (Subtle)
      ctx.strokeStyle = "rgba(239, 68, 68, 0.35)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, horizonRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 7. Observer Shuttle Orbit Trajectory Ring
      const maxVisualRadius = width * 0.43;
      const minVisualRadius = baseShadowRadius * 0.95;
      const normalizedR = Math.min(10, Math.max(1.0, rOverRs));
      const visualProbeRadius = minVisualRadius + ((normalizedR - 1.0) / 9.0) * (maxVisualRadius - minVisualRadius);

      const probeOrbitAngle = t * (0.25 + spin * 0.3);
      const probeX = centerX + Math.cos(probeOrbitAngle) * visualProbeRadius;
      const probeY = centerY + Math.sin(probeOrbitAngle) * (visualProbeRadius * 0.32);

      ctx.save();
      ctx.strokeStyle = isEventHorizon
        ? "rgba(239, 68, 68, 0.8)"
        : isErgosphere
        ? "rgba(249, 115, 22, 0.75)"
        : isPhotonSphere
        ? "rgba(245, 158, 11, 0.65)"
        : isIsco
        ? "rgba(147, 197, 253, 0.65)"
        : "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 0.9;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, visualProbeRadius, visualProbeRadius * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Observer Probe Point
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(probeX, probeY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Probe Label
      ctx.font = "9px monospace";
      ctx.fillStyle = isEventHorizon ? "#f87171" : isErgosphere ? "#fb923c" : "#e2e8f0";
      ctx.fillText(
        isEventHorizon ? "⚡ GÖZLEMCİ (OLAY UFKUNDA)" : isErgosphere ? "🌀 ERGOSFERDE" : `🛰️ r = ${rOverRs.toFixed(2)} rₛ`,
        probeX + 7,
        probeY - 5
      );
      ctx.restore();

      // 8. Visual Physics Legend in Canvas
      ctx.save();
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
      ctx.fillText(`r₊: Olay Ufku (${(1 + spinShrink).toFixed(2)} M)`, 14, height - 38);
      ctx.fillStyle = spin > 0 ? "rgba(249, 115, 22, 0.85)" : "rgba(255, 255, 255, 0.4)";
      ctx.fillText(`Ergosfer Sınırı (rₑ = 2M) ${spin > 0 ? "[AKTİF]" : "[YOK]"}`, 14, height - 24);
      ctx.fillStyle = "rgba(147, 197, 253, 0.85)";
      ctx.fillText(`ISCO: ${spin > 0 ? (1 + Math.cbrt(1 - spin*spin)).toFixed(2) : "3.0"} rₛ`, 14, height - 10);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [rOverRs, spin, isEventHorizon, isErgosphere, isPhotonSphere, isIsco]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
      <canvas
        ref={canvasRef}
        width={580}
        height={280}
        className="w-full h-auto block"
        style={{ aspectRatio: "580/280" }}
      />
      <div className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-300 border border-white/10">
        {spin > 0 ? `KERR METRİĞİ (SPIN a* = ${spin.toFixed(3)})` : "SCHWARZSCHILD METRİĞİ (STATİK a* = 0)"}
      </div>
      <div className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-black/80 text-white/70 border border-white/10">
        r = {rOverRs >= 100 ? "∞ (Düz Uzay)" : `${rOverRs.toFixed(3)} rₛ`}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CANVAS 2: KERR & SCHWARZSCHILD TIME DILATION CURVE GRAPH
════════════════════════════════════════════════════════════ */
function SpacetimeCurveCanvas({ rOverRs, spin, factor }) {
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
    const xMin = 0.5; // Kerr horizon can be smaller than 1.0 Rs (down to 0.5 Rs for maximal spin)
    const xMax = 6.0;
    const xLabels = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0];

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

    // Kerr Outer Horizon r_+ location: r_+ = (1 + sqrt(1 - a^2)) / 2  (in units of rs = 2M)
    const rPlus = (1 + Math.sqrt(Math.max(0, 1 - spin * spin))) / 2;
    const xAsymptoteNorm = (rPlus - xMin) / (xMax - xMin);
    const xAsymptote = padLeft + xAsymptoteNorm * plotWidth;

    // Asymptote Singularity Line at r_+
    ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(xAsymptote, padTop);
    ctx.lineTo(xAsymptote, height - padBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "8px monospace";
    ctx.fillStyle = "#ef4444";
    ctx.textAlign = "left";
    ctx.fillText(`Olay Ufku r₊ = ${rPlus.toFixed(2)} rₛ`, xAsymptote + 4, padTop + 10);

    // Plot Theoretical Spacetime Curve (Kerr equatorial / Schwarzschild)
    ctx.beginPath();
    ctx.strokeStyle = spin > 0 ? "#38bdf8" : "#f59e0b";
    ctx.lineWidth = 2.4;

    const samples = 150;
    for (let i = 0; i <= samples; i++) {
      const rVal = (rPlus + 0.008) + (i / samples) * (xMax - (rPlus + 0.008));
      // Kerr equatorial time dilation approximation: dt/dtau ~ 1 / sqrt(1 - 1/r + 2a*sqrt(1/r^3)/r...)
      const g00 = -(1 - 1 / rVal);
      const f = g00 < 0 ? 1 / Math.sqrt(Math.abs(g00)) : 10;
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
    const curR = Math.min(xMax, Math.max(rPlus + 0.001, rOverRs));
    const curF = !isFinite(factor) ? 10 : Math.min(10, Math.max(1, factor));
    const curXNorm = (curR - xMin) / (xMax - xMin);
    const curYNorm = (curF - 1) / (10 - 1);

    const ptX = padLeft + curXNorm * plotWidth;
    const ptY = padTop + plotHeight * (1 - curYNorm);

    // Point Glow
    const ptGlow = ctx.createRadialGradient(ptX, ptY, 1, ptX, ptY, 10);
    ptGlow.addColorStop(0, "#ffffff");
    ptGlow.addColorStop(0.4, spin > 0 ? "#38bdf8" : "#fbbf24");
    ptGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
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
    ctx.fillStyle = spin > 0 ? "#38bdf8" : "#fbbf24";
    ctx.textAlign = curXNorm > 0.7 ? "right" : "left";
    ctx.fillText(
      `r = ${rOverRs.toFixed(2)} rₛ (${!isFinite(factor) ? "∞" : factor.toFixed(2) + "x"})`,
      ptX + (curXNorm > 0.7 ? -10 : 10),
      ptY - 8
    );
  }, [rOverRs, spin, factor]);

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
        UZAY-ZAMAN EĞRİSİ dt/dτ [KERR / SCHWARZSCHILD]
      </div>
      <div className="absolute bottom-3 right-3 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-black/80 text-white/70 border border-white/10">
        Faktör = {!isFinite(factor) ? "∞ (Tekillik)" : `${factor.toFixed(4)}x`}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   LIVE TWIN CLOCK DILATION COMPONENT
════════════════════════════════════════════════════════════ */
function GravitationalTwinClocks({ factor, isEventHorizon, isErgosphere, spin }) {
  const [earthSeconds, setEarthSeconds] = useState(0);
  const [probeSeconds, setProbeSeconds] = useState(0);

  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const updateClocks = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setEarthSeconds((prev) => prev + dt);

      if (!isEventHorizon && isFinite(factor) && factor > 0) {
        setProbeSeconds((prev) => prev + dt / factor);
      }

      animId = requestAnimationFrame(updateClocks);
    };

    animId = requestAnimationFrame(updateClocks);
    return () => cancelAnimationFrame(animId);
  }, [factor, isEventHorizon]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      {/* Clock 1: Distant Earth Observer */}
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
          Yerçekimi ve dönüş etkisinden uzak sonsuzluktaki standart koordinat zamanı (t).
        </p>
      </div>

      {/* Clock 2: Probe Observer near Black Hole */}
      <div className={`cockpit-panel p-5 rounded-2xl border ${
        isEventHorizon ? 'border-red-500/50 bg-red-950/20' : isErgosphere ? 'border-orange-500/40 bg-orange-950/20' : 'border-amber-500/30 bg-black/50'
      } backdrop-blur-md`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`font-mono text-[10px] uppercase tracking-widest ${
            isEventHorizon ? 'text-red-400 font-black' : isErgosphere ? 'text-orange-400 font-bold' : 'text-amber-400 font-bold'
          } flex items-center gap-2`}>
            <span className={`h-2 w-2 rounded-full ${isEventHorizon ? 'bg-red-500 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            {isEventHorizon ? "⚡ ZAMAN DONDU (OLAY UFKU)" : isErgosphere ? "🌀 ERGOSFER (FRAME DRAGGING)" : "🛰️ Kara Delik Yörüngesindeki Gözlemci"}
          </span>
          <span className="font-mono text-[10px] text-white/50">Öz Zaman (τ)</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`font-mono text-3xl md:text-4xl font-black ${
            isEventHorizon ? 'text-red-400' : isErgosphere ? 'text-orange-300' : 'text-amber-300'
          } tracking-wider`}>
            {isEventHorizon ? "0.0 (DURDU)" : probeSeconds.toFixed(1)}
          </span>
          <span className="font-mono text-sm text-white/60">saniye</span>
        </div>
        <p className="font-mono text-[11px] text-white/50 mt-2">
          {isEventHorizon
            ? "Olay ufkunda (r = r_+) yerçekimsel zaman tamamen durur. Uzak gözlemciye göre donmuş görünürsünüz."
            : isErgosphere
            ? `Ergosfer içinde uzay-zaman ışıktan hızlı dönmektedir. Her ${factor.toFixed(2)} Dünya saniyesine karşılık mekikte 1 saniye geçer.`
            : `Uzak gözlemcideki her ${factor.toFixed(2)} saniyeye karşılık mekikte yalnızca 1 saniye geçer.`}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN RELATIVISTIC TIME DILATION SIMULATOR PAGE
════════════════════════════════════════════════════════════ */
export default function TimeDilationPage() {
  const [lang, setLang] = useState("tr");
  const [activeTab, setActiveTab] = useState("simulator"); // 'simulator' | 'theory' | 'archive'

  // Metric Mode: 'schwarzschild' (Static) or 'kerr' (Rotating)
  const [metricMode, setMetricMode] = useState("kerr"); // 'kerr' | 'schwarzschild'

  // Selected Preset or Custom Mass & Spin
  const [selectedPreset, setSelectedPreset] = useState(BLACK_HOLE_PRESETS[0]);
  const [customMassSolar, setCustomMassSolar] = useState(100000000);
  const [spin, setSpin] = useState(0.998); // Kerr spin parameter a* in [0, 0.998]

  // Radius expressed in units of r_s (Schwarzschild radius = 2M)
  const [rOverRs, setROverRs] = useState(1.000000002);

  // Compute Physics Values
  const currentMassKg = selectedPreset ? selectedPreset.massKg : customMassSolar * M_SUN;
  const rsMeters = (2 * G * currentMassKg) / (C * C);
  const rsKm = rsMeters / 1000;
  const currentRadiusKm = rOverRs * rsKm;

  // Active Spin: If in Schwarzschild mode, spin is forced to 0
  const activeSpin = metricMode === "schwarzschild" ? 0.0 : spin;

  // Kerr Horizons & Ergosphere Boundaries (in units of M = rs / 2)
  // r_+ = M + sqrt(M^2 - a^2) -> in units of rs: rPlus_Rs = (1 + sqrt(1 - a^2)) / 2
  const rPlus_Rs = (1 + Math.sqrt(Math.max(0, 1 - activeSpin * activeSpin))) / 2;
  // Ergosphere at equator: r_ergo = 2M = 1.0 rs
  const isErgosphere = rOverRs <= 1.0 && rOverRs > rPlus_Rs;
  const isEventHorizon = rOverRs <= rPlus_Rs + 0.000001;

  // Photon Sphere for prograde orbit: r_ph = 2M (1 + cos(2/3 arccos(-a)))
  const isInsidePhotonSphere = rOverRs < 1.5 && !isEventHorizon;
  const isPhotonSphere = Math.abs(rOverRs - 1.5) < 0.05;

  // ISCO for prograde orbit shrinks with spin from 3.0 rs (6M) down to 0.5 rs (1M) for maximal spin!
  const iscoRadius_Rs = metricMode === "schwarzschild"
    ? 3.0
    : (3.0 - activeSpin * 2.5); // Accurately interpolates from 3.0 Rs (a=0) to 0.5 Rs (a=1)
  const isInsideIsco = rOverRs < iscoRadius_Rs && !isEventHorizon;
  const isIsco = Math.abs(rOverRs - iscoRadius_Rs) < 0.1;

  // Gravitational Time Dilation Factor:
  // For Schwarzschild: factor = 1 / sqrt(1 - rs/r)
  // For Kerr (Equatorial plane): factor = 1 / sqrt(1 - rs/r + (activeSpin^2 * rs^2)/(4r^2)...)
  let factor = 1.0;
  if (rOverRs > rPlus_Rs) {
    const g00 = -(1.0 - 1.0 / rOverRs);
    if (g00 < 0) {
      factor = 1.0 / Math.sqrt(Math.abs(g00));
      // Frame dragging bonus for prograde orbit near spinning Kerr hole (Interstellar Miller Planet factor)
      if (activeSpin > 0) {
        factor *= (1.0 + (activeSpin * 0.45) / Math.pow(rOverRs, 1.2));
      }
    } else {
      factor = Infinity;
    }
  } else {
    factor = Infinity;
  }

  // Gravitational Redshift: z = factor - 1
  const redshiftZ = isFinite(factor) ? factor - 1 : Infinity;

  // Frame-Dragging Angular Velocity: Omega = (2 a M r) / (r^4 + a^2 r^2 + 2 a^2 M r)
  const frameDraggingKms = activeSpin > 0 && rOverRs > rPlus_Rs
    ? Math.min(299792, (activeSpin * C * 0.001) / Math.pow(rOverRs, 1.5))
    : 0;

  // Tidal Acceleration Difference on 1.8m human
  const rMeters = currentRadiusKm * 1000;
  const tidalAcceleration = (2 * G * currentMassKg * 1.8) / Math.pow(rMeters, 3);
  const tidalGForce = tidalAcceleration / 9.80665;

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setCustomMassSolar(preset.massSolar);
    setROverRs(preset.defaultR_Rs);
    setSpin(preset.defaultSpin);
    if (preset.defaultSpin === 0) setMetricMode("schwarzschild");
    else setMetricMode("kerr");
  };

  const PAGE_TEXT = {
    tr: {
      badge: "GENEL GÖRELİLİK // KERR & SCHWARZSCHILD METRİĞİ",
      title: "Kerr & Schwarzschild Zaman Dilatasyonu\n& Dönen Kara Delik Simülatörü",
      sub: "Albert Einstein'ın Genel Görelilik ve Roy Kerr'in dönen kara delik denklemlerine göre uzay-zaman girdabını (Frame-Dragging), ergosferi, ışık bükülmesini ve yerçekimsel zaman genleşmesini interaktif olarak simüle edin.",
      tabSim: "🕳️ Karadelik & Zaman Simülatörü",
      tabTheory: "📐 Görelilik Kuramı & Metrikler",
      tabArchive: "🎬 Bilimsel Arşiv & Video"
    },
    en: {
      badge: "GENERAL RELATIVITY // KERR & SCHWARZSCHILD METRIC",
      title: "Kerr & Schwarzschild Time Dilation\n& Rotating Black Hole Simulator",
      sub: "Interactively simulate spacetime frame-dragging, ergosphere harvesting, light bending and gravitational time dilation near rotating (Kerr) and static (Schwarzschild) black holes.",
      tabSim: "🕳️ Black Hole Simulator",
      tabTheory: "📐 General Relativity & Kerr Metric",
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
            {/* Control Panel: Metric Mode Switch & Presets */}
            <div className="cockpit-panel p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl bg-black/60 backdrop-blur-xl">
              {/* Metric Switch Mode: Kerr (Rotating) vs Schwarzschild (Static) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
                    METRİK MODELİ SEÇİMİ:
                  </h3>
                  <p className="text-xs text-white/60">
                    Statik küresel simetrik model veya dönen uzay-zaman (Kerr / Ergosfer) modeli.
                  </p>
                </div>
                <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10">
                  <button
                    onClick={() => {
                      setMetricMode("kerr");
                      if (spin === 0) setSpin(0.998);
                    }}
                    className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                      metricMode === "kerr"
                        ? "bg-amber-500 text-black shadow-lg font-black"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    🌀 DÖNEN KERR (SPIN a* &gt; 0)
                  </button>
                  <button
                    onClick={() => setMetricMode("schwarzschild")}
                    className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                      metricMode === "schwarzschild"
                        ? "bg-amber-500 text-black shadow-lg font-black"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    ⚪ STATİK SCHWARZSCHILD (a* = 0)
                  </button>
                </div>
              </div>

              {/* Preset Cards */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold">
                    KOZMİK KARA DELİK ÖNAYARLARI:
                  </span>
                  <span className="font-mono text-xs text-white/60">
                    Schwarzschild Yarıçapı (rₛ): <strong className="text-amber-300 font-bold">{rsKm >= 10000 ? `${(rsKm / 1e6).toFixed(2)} Milyon km` : `${rsKm.toLocaleString('tr-TR')} km`}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              </div>

              {/* Sliders Area: Distance and Spin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                {/* Slider 1: Distance Slider */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold">
                      RADYAL MESAFE (r / rₛ):
                    </span>
                    <span className="font-mono text-lg font-black text-amber-300">
                      {isEventHorizon ? `r₊ = ${rPlus_Rs.toFixed(4)} rₛ (Olay Ufku)` : `${rOverRs.toFixed(4)} rₛ`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={metricMode === "kerr" ? "0.5" : "1.0"}
                    max="10.0"
                    step="0.0001"
                    value={rOverRs}
                    onChange={(e) => setROverRs(parseFloat(e.target.value))}
                    className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-white/10 accent-amber-400"
                  />
                  <div className="flex justify-between font-mono text-[9px] mt-2 text-white/60">
                    <span className="text-red-400 font-bold cursor-pointer" onClick={() => setROverRs(rPlus_Rs)}>
                      {rPlus_Rs.toFixed(2)} rₛ (Olay Ufku r₊)
                    </span>
                    <span className="text-orange-400 font-bold cursor-pointer" onClick={() => setROverRs(1.0)}>
                      1.0 rₛ (Ergosfer)
                    </span>
                    <span className="text-emerald-400 font-bold cursor-pointer" onClick={() => setROverRs(iscoRadius_Rs)}>
                      {iscoRadius_Rs.toFixed(1)} rₛ (ISCO)
                    </span>
                    <span className="text-white/60 cursor-pointer" onClick={() => setROverRs(10.0)}>
                      10.0 rₛ
                    </span>
                  </div>
                </div>

                {/* Slider 2: Kerr Spin Parameter a* (Disabled in Schwarzschild mode) */}
                <div className={metricMode === "schwarzschild" ? "opacity-40 pointer-events-none" : ""}>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">
                      AÇISAL MOMENTUM / SPIN (a* = Jc / GM²):
                    </span>
                    <span className="font-mono text-lg font-black text-cyan-300">
                      {metricMode === "schwarzschild" ? "0.000 (Statik)" : `${activeSpin.toFixed(3)}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.998"
                    step="0.001"
                    value={activeSpin}
                    onChange={(e) => {
                      setSpin(parseFloat(e.target.value));
                      if (metricMode !== "kerr") setMetricMode("kerr");
                    }}
                    className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-white/10 accent-cyan-400"
                  />
                  <div className="flex justify-between font-mono text-[9px] mt-2 text-white/60">
                    <span className="cursor-pointer" onClick={() => setSpin(0.0)}>0.0 (Dönmeyen)</span>
                    <span className="cursor-pointer" onClick={() => setSpin(0.5)}>0.50 (Orta Spin)</span>
                    <span className="text-cyan-400 font-bold cursor-pointer" onClick={() => setSpin(0.998)}>
                      0.998 (Thorne Limiti - Gargantua)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Twin Clocks Simulation (Realtime Synchronized Coordinates) */}
            <GravitationalTwinClocks
              factor={factor}
              isEventHorizon={isEventHorizon}
              isErgosphere={isErgosphere}
              spin={activeSpin}
            />

            {/* Dual Interactive Canvases: Lensed Accretion Disk & Spacetime Curve */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold mb-2 flex items-center gap-2">
                  <span>🌌</span> KÜTLEÇEKİMSEL MERCEKLEME, ERGOSFER & FRAME-DRAGGING
                </h4>
                <RelativisticBlackHoleCanvas
                  rOverRs={rOverRs}
                  spin={activeSpin}
                  isEventHorizon={isEventHorizon}
                  isErgosphere={isErgosphere}
                  isPhotonSphere={isInsidePhotonSphere || isPhotonSphere}
                  isIsco={isIsco}
                />
              </div>

              <div>
                <h4 className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold mb-2 flex items-center gap-2">
                  <span>📈</span> UZAY-ZAMAN EĞRİSİ VE TEKİLLİK ASİMPTOTU
                </h4>
                <SpacetimeCurveCanvas rOverRs={rOverRs} spin={activeSpin} factor={factor} />
              </div>
            </div>

            {/* Realtime Relativistic Output Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Time Dilation Factor */}
              <div className="cockpit-panel p-5 rounded-2xl border border-white/10 bg-black/40">
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold block mb-1">
                  Zaman Genleşme Faktörü (dt / dτ)
                </span>
                <span className="font-mono text-2xl font-black text-white">
                  {!isFinite(factor) ? "∞ TEKİLLİK" : `${factor.toFixed(4)}x`}
                </span>
                <p className="font-mono text-[10px] text-white/50 mt-2">
                  Mekikte geçen 1 saniyeye karşılık Dünya'da geçen süre.
                </p>
              </div>

              {/* Metric 2: Frame Dragging Velocity */}
              <div className="cockpit-panel p-5 rounded-2xl border border-white/10 bg-black/40">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                  Uzay Sürüklenme Hızı (Frame-Dragging)
                </span>
                <span className="font-mono text-2xl font-black text-white">
                  {activeSpin === 0 ? "0 km/s (Statik)" : `~${frameDraggingKms.toFixed(0)} km/s`}
                </span>
                <p className="font-mono text-[10px] text-white/50 mt-2">
                  Uzay-zaman dokusunun kara delik dönüşüyle girdap gibi sürüklenme hızı.
                </p>
              </div>

              {/* Metric 3: Gravitational Redshift */}
              <div className="cockpit-panel p-5 rounded-2xl border border-white/10 bg-black/40">
                <span className="font-mono text-[10px] uppercase tracking-widest text-purple-400 font-bold block mb-1">
                  Kütleçekimsel Kırmızıya Kayma (z)
                </span>
                <span className="font-mono text-2xl font-black text-white">
                  {!isFinite(redshiftZ) ? "∞ (Karanlık)" : `+${redshiftZ.toFixed(4)}`}
                </span>
                <p className="font-mono text-[10px] text-white/50 mt-2">
                  Mekikten yayılan ışığın uzak gözlemciye ulaşırken kaybettiği enerji.
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
                : isErgosphere
                ? "border-orange-500 bg-orange-950/30 text-orange-300"
                : isInsidePhotonSphere
                ? "border-rose-500 bg-rose-950/20 text-rose-300"
                : isInsideIsco
                ? "border-amber-500 bg-amber-950/20 text-amber-300"
                : "border-emerald-500 bg-emerald-950/20 text-emerald-300"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {isEventHorizon ? "⚡" : isErgosphere ? "🌀" : isInsidePhotonSphere ? "⚠️" : isInsideIsco ? "🔄" : "✅"}
                </span>
                <div>
                  <h5 className="font-mono text-xs font-black uppercase tracking-wider">
                    {isEventHorizon
                      ? `DIŞ OLAY UFKU (r₊ = ${rPlus_Rs.toFixed(2)} rₛ): GERİ DÖNÜŞÜ OLMAYAN NOKTA`
                      : isErgosphere
                      ? "ERGOSFER BÖLGESİ (r₊ < r ≤ 2M): UZAY-ZAMAN IŞIKTAN HIZLI SÜRÜKLENİYOR"
                      : isInsidePhotonSphere
                      ? "FOTON KÜRESİ İÇİ (r < 1.5 rₛ): IŞIK DOĞRUDAN MERKEZE ÇEKİLİR"
                      : isInsideIsco
                      ? `KARARSIZ YÖRÜNGE (r < ${iscoRadius_Rs.toFixed(1)} rₛ ISCO): SÜREKLİ İTKİ GEREKİR`
                      : "STABİL VE GÜVENLİ YÖRÜNGE (r ≥ ISCO): SERBEST DÜŞÜM DENGESİ"}
                  </h5>
                  <p className="text-xs opacity-80 mt-0.5">
                    {isEventHorizon
                      ? "Kaçış hızı ışık hızını aşmıştır (v_esc ≥ c). Zaman dış gözlemciye göre sonsuza kilitlenir, fiziksel nesne tekilliğe çöker."
                      : isErgosphere
                      ? "Ergosferdesiniz! Sabit durmak fiziksel olarak imkânsızdır; uzay-zaman aracınızı kara delikle birlikte döndürür. Penrose süreciyle enerji hasat edilebilir."
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
                KURAMSAL ASTROFİZİK // EINSTEIN & KERR ALAN DENKLEMLERİ
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                Schwarzschild (Statik) ve Kerr (Dönen) Metrikleri Karşılaştırması
              </h2>
              <p className="text-sm md:text-base text-white/70 mt-3 leading-relaxed">
                Evrendeki hemen hemen tüm gerçek kara delikler açısal momentuma (spin) sahiptir. 1963 yılında Yeni Zelandalı matematikçi Roy Kerr, dönen bir kara deliğin uzay-zaman geometrisini kesin analitik olarak çözmüştür.
              </p>
            </div>

            {/* Formula Block 1: Kerr Metric in Boyer-Lindquist Coordinates */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="font-mono text-sm font-bold text-cyan-300 mb-2">
                1. Dönen Kara Delik (Kerr Metriği - Boyer-Lindquist Koordinatları)
              </h3>
              <div className="font-mono text-xs md:text-sm bg-black/60 p-4 rounded-xl text-cyan-200 overflow-x-auto border border-white/5 my-3 leading-relaxed">
                ds² = -(1 - 2Mr/ρ²) dt² - (4aMr sin²θ / ρ²) dt dφ + (ρ²/Δ) dr² + ρ² dθ² + (r² + a² + 2Ma²r sin²θ / ρ²) sin²θ dφ²
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Burada Δ = r² - 2Mr + a² ve ρ² = r² + a² cos²θ'dır. Dikkat ederseniz <strong>dt dφ</strong> çapraz terimi bulunur; bu terim uzay ile zamanın birbirine dolandığını ve uzay-zamanın kara delikle birlikte döndüğünü (<strong>Frame-Dragging / Lense-Thirring</strong> etkisi) gösterir.
              </p>
            </div>

            {/* Formula Block 2: Static Schwarzschild Metric */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="font-mono text-sm font-bold text-amber-300 mb-2">
                2. Statik Dönmeyen Kara Delik (Schwarzschild Metriği, a = 0)
              </h3>
              <div className="font-mono text-xs md:text-sm bg-black/60 p-4 rounded-xl text-amber-200 overflow-x-auto border border-white/5 my-3">
                ds² = -(1 - 2M/r) dt² + (1 - 2M/r)⁻¹ dr² + r² (dθ² + sin²θ dφ²)
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                a = 0 olduğunda Kerr metriği tam olarak Schwarzschild metriğine sadeleşir. Olay ufku r_s = 2M olur ve ergosfer sıfırlanır.
              </p>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/15">
                <h4 className="font-mono text-xs font-bold text-amber-300 mb-1">⚪ Schwarzschild (Dönmeyen)</h4>
                <ul className="text-xs text-white/70 space-y-1.5 list-disc list-inside mt-2">
                  <li><strong>Tekillik:</strong> Boyutsuz nokta (r = 0)</li>
                  <li><strong>Olay Ufku:</strong> Tek küresel sınır (r = 2M = 1.0 rₛ)</li>
                  <li><strong>Ergosfer:</strong> Yoktur</li>
                  <li><strong>ISCO:</strong> Sabit 6M (3.0 rₛ)</li>
                  <li><strong>Frame-Dragging:</strong> Yoktur</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/15">
                <h4 className="font-mono text-xs font-bold text-cyan-300 mb-1">🌀 Kerr (Dönen Gerçek Kara Delik)</h4>
                <ul className="text-xs text-white/70 space-y-1.5 list-disc list-inside mt-2">
                  <li><strong>Tekillik:</strong> Halka Tekillik (Ring Singularity)</li>
                  <li><strong>Olay Ufku:</strong> Çift ufuk (Dış r₊ ve İç r₋)</li>
                  <li><strong>Ergosfer:</strong> Olay ufkunun dışına taşan enerji bölgesi</li>
                  <li><strong>ISCO:</strong> Spin arttıkça 6M'den 1M'ye (0.5 rₛ) kadar daralır</li>
                  <li><strong>Frame-Dragging:</strong> Uzay-zaman ışıktan hızlı sürüklenir</li>
                </ul>
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
                Dönen Kara Delikler, Ergosfer ve Zaman Bükülmesi
              </h2>
              <p className="text-sm md:text-base text-white/70 mt-3 leading-relaxed">
                Kip Thorne ve astrofizik enstitülerinin Kerr dönen kara delikleri, ergosfer enerji hasadı (Penrose süreci) ve Interstellar simülasyon kayıtları.
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
                  Nobel ödüllü astrofizikçi Kip Thorne'un Interstellar filmi için modellediği devasa dönen Kerr kara deliği ve 1 saat = 7 yıl denklemi.
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

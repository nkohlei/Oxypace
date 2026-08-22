"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../../blog/components/Header";
import Footer from "../../blog/components/Footer";
import ReadingProgressBar from "../../blog/components/ReadingProgressBar";
import CookieConsent from "../../blog/components/CookieConsent";
import { SPACECRAFT_BASE64 } from "./spacecraftAsset";

/* ════════════════════════════════════════════════════════════
   CONSTANTS & PRESETS
════════════════════════════════════════════════════════════ */
const C_KMS = 299792.458; // Speed of light in km/s

const PRESETS = [
  {
    nameTr: "🚗 Otoban Otomobili",
    nameEn: "🚗 Highway Car",
    vFraction: 0.00000011, // ~120 km/h (0.0333 km/s)
    badge: "Klasik Newton",
    badgeEn: "Classical",
    descTr: "120 km/s hızda görelilik etkisi sıfıra yakındır (10⁻¹⁴).",
    descEn: "Relativistic effects are practically zero (10⁻¹⁴) at 120 km/h."
  },
  {
    nameTr: "🛰️ ISS Uzay İstasyonu",
    nameEn: "🛰️ ISS Space Station",
    vFraction: 0.0000256, // ~7.66 km/s
    badge: "Alçak Yörünge",
    badgeEn: "LEO Orbit",
    descTr: "Günde yaklaşık 28 mikrosaniye zaman kayması yaşanır.",
    descEn: "Experiences approx 28 microseconds time drift per day."
  },
  {
    nameTr: "🚀 Parker Solar Probe",
    nameEn: "🚀 Parker Solar Probe",
    vFraction: 0.000635, // ~190 km/s (rekor insan yapımı hız)
    badge: "Güneş Rekoru",
    badgeEn: "Solar Record",
    descTr: "En hızlı insan yapımı araç: saniyede 190 kilometre.",
    descEn: "Fastest human-made object: 190 kilometers per second."
  },
  {
    nameTr: "🌌 Göreli Keşif (0.50c)",
    nameEn: "🌌 Relativistic Cruiser (0.50c)",
    vFraction: 0.5,
    badge: "%50 Işık Hızı",
    badgeEn: "50% Light Speed",
    descTr: "Lorentz faktörü 1.155. Boyutlar %13.4 kısalır.",
    descEn: "Lorentz factor 1.155. Dimensions contract by 13.4%."
  },
  {
    nameTr: "⚡ Warp Öncesi (0.90c)",
    nameEn: "⚡ Pre-Warp Thruster (0.90c)",
    vFraction: 0.9,
    badge: "%90 Işık Hızı",
    badgeEn: "90% Light Speed",
    descTr: "Lorentz faktörü 2.294. Gemi boyu yarıdan aza iner.",
    descEn: "Lorentz factor 2.294. Ship length contracts to under half."
  },
  {
    nameTr: "💫 Ultra Göreli (0.99c)",
    nameEn: "💫 Ultra Relativistic (0.99c)",
    vFraction: 0.99,
    badge: "%99 Işık Hızı",
    badgeEn: "99% Light Speed",
    descTr: "Lorentz faktörü 7.088. 1 saniye uzayda = Dünya'da 7 saniye.",
    descEn: "Lorentz factor 7.088. 1 second on ship = 7.09 seconds on Earth."
  },
  {
    nameTr: "🔬 CERN LHC Protonu (0.999999991c)",
    nameEn: "🔬 CERN LHC Proton (0.999999991c)",
    vFraction: 0.999999991,
    badge: "Parçacık Hızlandırıcı",
    badgeEn: "Particle Accelerator",
    descTr: "Lorentz faktörü γ ≈ 7,450. Proton kütlesi 7 bin kat artar.",
    descEn: "Lorentz factor γ ≈ 7,450. Relativistic proton mass scales x7450."
  },
  {
    nameTr: "🌟 Foton / Işık Hızı Sınırı (1.00c)",
    nameEn: "🌟 Photon / Speed of Light (1.00c)",
    vFraction: 1.0,
    badge: "Foton Referansı (Zaman Donar)",
    badgeEn: "Photon Frame (Time Freezes)",
    descTr: "v = c. Lorentz faktörü sonsuzdur (γ = ∞). Foton için zaman donar (Δt₀ = 0), boyut sıfıra iner (L = 0).",
    descEn: "v = c. Lorentz factor is infinite (γ = ∞). Time completely freezes (Δt₀ = 0) and length contracts to zero (L = 0)."
  }
];

// Format Helper for accurate velocity percentage without false 100% rounding
function formatVelocityPercent(v) {
  if (v >= 1) return "100.0000";
  const percent = v * 100;
  // If it's extremely close to 100% (e.g. 0.999999991 -> 99.9999991%)
  if (v >= 0.9999) {
    const str = v.toString();
    const decPart = str.split('.')[1] || '';
    const decimalsNeeded = Math.min(7, Math.max(4, decPart.length - 2));
    const formatted = percent.toFixed(decimalsNeeded);
    if (parseFloat(formatted) >= 100) {
      return "99.9999991";
    }
    return formatted;
  }
  return percent.toFixed(4);
}

/* ════════════════════════════════════════════════════════════
   CANVAS 1: PREMIUM REALISTIC RELATIVISTIC SPACECRAFT & WARP CANVAS
════════════════════════════════════════════════════════════ */
function RelativisticSpacecraftCanvas({ vFraction, gamma }) {
  const canvasRef = useRef(null);
  const shipImgRef = useRef(null);

  useEffect(() => {
    // Preload embedded base64 image instantly once
    const img = new Image();
    img.src = SPACECRAFT_BASE64;
    shipImgRef.current = img;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const width = canvas.width;
    const height = canvas.height;

    // Realistic Deep-Space Astrophysical Starfield: Uniform faint, tiny pinpoints (0.3px to 1.1px) with natural starlight tones
    const starColors = [
      { r: 255, g: 255, b: 255, a: 0.85 }, // Faint Diamond White
      { r: 225, g: 235, b: 255, a: 0.75 }, // Soft Pale Blue
      { r: 255, g: 245, b: 230, a: 0.70 }, // Soft Warm White
      { r: 210, g: 220, b: 245, a: 0.65 }, // Distant Starlight
    ];

    const starCount = 380;
    const stars = [];

    for (let i = 0; i < starCount; i++) {
      const col = starColors[Math.floor(Math.random() * starColors.length)];
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedFactor: 0.3 + Math.random() * 1.5,
        size: 0.4 + Math.random() * 0.7, // Uniform subtle faint pinpoint size
        r: col.r,
        g: col.g,
        b: col.b,
        baseAlpha: col.a * (0.4 + Math.random() * 0.5),
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + Math.random() * 1.2
      });
    }

    let t = 0;

    const render = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Deep space backdrop: True pitch black cosmic void
      ctx.fillStyle = "#010206";
      ctx.fillRect(0, 0, width, height);

      // Smooth continuous physical flight speed scaling
      const currentFlightSpeed = vFraction === 0 ? 0 : (vFraction * 2.8 + Math.pow(vFraction, 4) * 32);
      const isSpeedOfLight = vFraction >= 1.0;

      // Render Deep-Space Starfield: Faint pinpoint stars with smooth continuous elongation as v increases
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (currentFlightSpeed > 0) {
          star.x -= star.speedFactor * currentFlightSpeed;
          if (star.x < -40) {
            star.x = width + Math.random() * 30;
            star.y = Math.random() * height;
          }
        }

        // Natural subtle twinkle
        const twinkle = Math.sin(t * star.twinkleSpeed + star.twinklePhase) * 0.15 + 0.85;
        const currentAlpha = star.baseAlpha * twinkle;

        // At v = 0, stars are perfectly stationary faint pinpoints. As v > 0, streak smoothly elongates with velocity.
        const streakLength = isSpeedOfLight
          ? width * 1.2
          : (currentFlightSpeed === 0 ? 0 : Math.max(0.5, currentFlightSpeed * star.speedFactor * 1.4));

        if (streakLength < 1.2) {
          // Stationary or nearly stationary sharp pinpoint
          ctx.fillStyle = `rgba(${star.r}, ${star.g}, ${star.b}, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.75, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Smooth, faint relativistic starlight streaks (no harsh neon blobs, realistic faint light lines)
          const streakGrad = ctx.createLinearGradient(star.x, star.y, star.x + streakLength, star.y);
          streakGrad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha})`);
          streakGrad.addColorStop(0.3, `rgba(${star.r}, ${star.g}, ${star.b}, ${currentAlpha * 0.7})`);
          streakGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.beginPath();
          ctx.strokeStyle = streakGrad;
          ctx.lineWidth = Math.min(1.1, Math.max(0.5, star.size * 0.7));
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x + streakLength, star.y);
          ctx.stroke();
        }
      }

      // Spacecraft rendering with Lorentz Length Contraction
      const centerX = width * 0.52;
      const centerY = height * 0.5;
      const originalLength = 175; // L₀
      const originalHeight = 78;
      // Length contraction: L = L0 / gamma (0 if v = c)
      const contractedLength = isSpeedOfLight ? 0 : Math.max(4, originalLength / gamma);

      // If at exact Speed of Light (v = c): Pure Photon Laser & Hyper-Singularity Flash
      if (isSpeedOfLight) {
        // Hyperspace Flash Beam
        const beamGrad = ctx.createLinearGradient(0, centerY, width, centerY);
        beamGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        beamGrad.addColorStop(0.25, "rgba(220, 235, 255, 0.7)");
        beamGrad.addColorStop(0.52, "rgba(255, 255, 255, 1)");
        beamGrad.addColorStop(0.75, "rgba(180, 220, 255, 0.85)");
        beamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.save();
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = 5 + Math.sin(t * 25) * 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Core Photon Singularity Glow
        const photonGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50 + Math.sin(t * 18) * 8);
        photonGlow.addColorStop(0, "#ffffff");
        photonGlow.addColorStop(0.3, "rgba(255, 255, 255, 0.95)");
        photonGlow.addColorStop(0.6, "rgba(200, 230, 255, 0.5)");
        photonGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = photonGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Ion Engine Exhaust Plume (Active when v > 0)
        if (vFraction > 0) {
          const thrustPulse = Math.sin(t * 20) * 3;
          const thrustLength = (16 + vFraction * 130) + thrustPulse;
          const thrustX = centerX - contractedLength / 2;

          const plumeGrad = ctx.createRadialGradient(
            thrustX, centerY, 1,
            thrustX - thrustLength, centerY, thrustLength * 0.85
          );
          plumeGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          plumeGrad.addColorStop(0.2, `rgba(186, 230, 253, ${0.7 + vFraction * 0.2})`);
          plumeGrad.addColorStop(0.7, `rgba(59, 130, 246, ${0.3 + vFraction * 0.3})`);
          plumeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.save();
          ctx.beginPath();
          ctx.fillStyle = plumeGrad;
          ctx.moveTo(thrustX, centerY - 9);
          ctx.lineTo(thrustX - thrustLength, centerY - 16 - vFraction * 7);
          ctx.quadraticCurveTo(thrustX - thrustLength * 1.3, centerY, thrustX - thrustLength, centerY + 16 + vFraction * 7);
          ctx.lineTo(thrustX, centerY + 9);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Render EXACT User Spacecraft Image seamlessly (Preloaded base64)
        ctx.save();
        ctx.translate(centerX, centerY);

        const loadedImg = shipImgRef.current;
        if (loadedImg && loadedImg.complete && loadedImg.naturalWidth > 0) {
          // Draw the exact uploaded white space plane image flipped so nose points forward (+x direction)
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(
            loadedImg,
            -contractedLength / 2,
            -originalHeight / 2,
            contractedLength,
            originalHeight
          );
          ctx.restore();
        }

        ctx.restore();
      }

      // Dimension Indicator Arrow (L / L0 measurement)
      ctx.save();
      const arrowY = centerY + originalHeight * 0.55 + 16;
      const arrowLeft = centerX - (isSpeedOfLight ? 1 : contractedLength / 2);
      const arrowRight = centerX + (isSpeedOfLight ? 1 : contractedLength / 2);

      ctx.strokeStyle = isSpeedOfLight ? "rgba(239, 68, 68, 0.9)" : "rgba(255, 255, 255, 0.65)";
      ctx.fillStyle = isSpeedOfLight ? "rgba(239, 68, 68, 0.9)" : "rgba(255, 255, 255, 0.65)";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(arrowLeft, arrowY);
      ctx.lineTo(arrowRight, arrowY);
      // Ticks
      ctx.moveTo(arrowLeft, arrowY - 4);
      ctx.lineTo(arrowLeft, arrowY + 4);
      ctx.moveTo(arrowRight, arrowY - 4);
      ctx.lineTo(arrowRight, arrowY + 4);
      ctx.stroke();

      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        isSpeedOfLight ? "L = 0.00% L₀ (2D Düzlem / Tekillik)" : `L = ${(100 / gamma).toFixed(1)}% L₀`,
        centerX,
        arrowY + 14
      );
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [vFraction, gamma]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
      <canvas
        ref={canvasRef}
        width={560}
        height={260}
        className="w-full h-auto block"
        style={{ aspectRatio: "560/260" }}
      />
      <div className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white/80 border border-white/10">
        Relativistic Warp Canvas (L = L₀ / γ)
      </div>
      <div className="absolute bottom-3 right-3 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-black/90 text-white/80 border border-white/10">
        v = {formatVelocityPercent(vFraction)}% c
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CANVAS 2: INTERACTIVE LORENTZ ASYMPTOTIC CURVE CHART
════════════════════════════════════════════════════════════ */
function LorentzCurveChart({ vFraction, gamma }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Padding
    const pLeft = 45;
    const pRight = 20;
    const pTop = 25;
    const pBottom = 30;
    const plotW = width - pLeft - pRight;
    const plotH = height - pTop - pBottom;

    // Background Grid
    ctx.fillStyle = "rgba(10, 12, 26, 0.8)";
    ctx.fillRect(0, 0, width, height);

    // Grid lines & labels
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    ctx.font = "9px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";

    // Gamma Y-axis scale (1 to 10)
    const maxGammaScale = 10;
    for (let g = 1; g <= maxGammaScale; g += 2) {
      const y = pTop + plotH - ((g - 1) / (maxGammaScale - 1)) * plotH;
      ctx.beginPath();
      ctx.moveTo(pLeft, y);
      ctx.lineTo(pLeft + plotW, y);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText(`${g}×`, pLeft - 6, y + 3);
    }

    // Velocity X-axis scale (0 to 1.0c)
    for (let v = 0; v <= 1.0; v += 0.2) {
      const x = pLeft + v * plotW;
      ctx.beginPath();
      ctx.moveTo(x, pTop);
      ctx.lineTo(x, pTop + plotH);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillText(`${v.toFixed(1)}c`, x, pTop + plotH + 16);
    }

    // Light speed asymptote vertical line (c = 1.0)
    const asymptoteX = pLeft + plotW;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(asymptoteX, pTop);
    ctx.lineTo(asymptoteX, pTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
    ctx.textAlign = "right";
    ctx.fillText("Işık Hızı Sınırı (c)", asymptoteX - 4, pTop + 10);

    // Plot Lorentz Factor curve: gamma = 1 / sqrt(1 - (v)^2)
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    for (let px = 0; px <= plotW; px += 1) {
      const curV = px / plotW;
      if (curV >= 0.9999) break;
      const curGamma = 1 / Math.sqrt(1 - curV * curV);
      const clampedGamma = Math.min(maxGammaScale, curGamma);
      const plotY = pTop + plotH - ((clampedGamma - 1) / (maxGammaScale - 1)) * plotH;

      if (!started) {
        ctx.moveTo(pLeft + px, plotY);
        started = true;
      } else {
        ctx.lineTo(pLeft + px, plotY);
      }
    }
    ctx.stroke();

    // Area under curve fill
    ctx.lineTo(pLeft + plotW, pTop + plotH);
    ctx.lineTo(pLeft, pTop + plotH);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, pTop, 0, pTop + plotH);
    areaGrad.addColorStop(0, "rgba(168, 85, 247, 0.25)");
    areaGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Current operating point indicator
    const curX = pLeft + Math.min(1, vFraction) * plotW;
    const clampedCurGamma = Math.min(maxGammaScale, gamma);
    const curY = pTop + plotH - ((clampedCurGamma - 1) / (maxGammaScale - 1)) * plotH;

    // Crosshairs
    ctx.strokeStyle = "rgba(234, 179, 8, 0.6)";
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(curX, pTop + plotH);
    ctx.lineTo(curX, curY);
    ctx.lineTo(pLeft, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing point on curve
    ctx.beginPath();
    ctx.fillStyle = "#eab308";
    ctx.shadowColor = "#eab308";
    ctx.shadowBlur = 10;
    ctx.arc(curX, curY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

  }, [vFraction, gamma]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/60">
      <canvas
        ref={canvasRef}
        width={480}
        height={240}
        className="w-full h-auto block"
        style={{ aspectRatio: "480/240" }}
      />
      <div className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-yellow-400 border border-yellow-500/30">
        Lorentz Asymptotic Curve γ(v)
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TWIN PARADOX DUAL CLOCKS SIMULATION
════════════════════════════════════════════════════════════ */
function TwinParadoxClocks({ gamma, vFraction, lang }) {
  const [earthTime, setEarthTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setEarthTime((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const isSpeedOfLight = vFraction >= 1.0 || !isFinite(gamma);
  const shipTime = isSpeedOfLight ? 0.0 : earthTime / (gamma > 0 ? gamma : 1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Earth Clock */}
      <div className="cockpit-panel p-5 rounded-xl border border-blue-500/20 bg-blue-950/10 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            {lang === "en" ? "Earth Stationary Frame (t)" : "Dünya Durgun Referansı (t)"}
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">v = 0</span>
        </div>
        <div className="my-4 text-center">
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
            {earthTime.toFixed(1)} <span className="text-sm font-normal text-white/60">{lang === "en" ? "sec" : "san"}</span>
          </div>
          <p className="text-[11px] text-white/50 mt-1 font-mono">
            {lang === "en" ? "Standard laboratory clock ticking" : "Standart laboratuvar referans saati"}
          </p>
        </div>
        <div className="w-full bg-blue-950/40 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-400 h-full transition-all duration-100"
            style={{ width: `${(earthTime % 10) * 10}%` }}
          />
        </div>
      </div>

      {/* Traveler Clock */}
      <div className={`cockpit-panel p-5 rounded-xl border flex flex-col justify-between ${
        isSpeedOfLight
          ? "border-red-500/50 bg-red-950/20 shadow-lg shadow-red-500/10"
          : "border-purple-500/30 bg-purple-950/10"
      }`}>
        <div className="flex items-center justify-between">
          <span className={`font-mono text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5 ${
            isSpeedOfLight ? "text-red-400" : "text-purple-400"
          }`}>
            <span className={`h-2 w-2 rounded-full ${isSpeedOfLight ? "bg-red-400" : "bg-purple-400 animate-pulse"}`} />
            {isSpeedOfLight
              ? (lang === "en" ? "Photon Frame (t₀ = 0)" : "Foton Referansı (t₀ = 0)")
              : (lang === "en" ? "Relativistic Traveler Frame (t₀)" : "Seyyah Öz Zamanı (t₀)")}
          </span>
          <span className={`font-mono text-[9px] px-2 py-0.5 rounded ${
            isSpeedOfLight ? "bg-red-500/20 text-red-300" : "bg-purple-500/20 text-purple-300"
          }`}>
            γ = {isSpeedOfLight ? "∞" : gamma.toFixed(3)}
          </span>
        </div>
        <div className="my-4 text-center">
          <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
            isSpeedOfLight ? "text-red-400" : "text-purple-300"
          }`}>
            {isSpeedOfLight ? "0.0" : shipTime.toFixed(1)} <span className="text-sm font-normal opacity-60">{lang === "en" ? "sec" : "san"}</span>
          </div>
          <p className={`text-[11px] mt-1 font-mono font-bold ${
            isSpeedOfLight ? "text-red-400" : "text-purple-300/70"
          }`}>
            {isSpeedOfLight
              ? (lang === "en"
                  ? "⚡ TIME IS FROZEN (Δt₀ = 0): For a photon, the entire lifetime of the universe passes in 0 seconds."
                  : "⚡ ZAMAN DONDU (Δt₀ = 0): Bir foton için evrenin milyarlarca yıllık ömrü tam 0 saniyede geçer.")
              : gamma > 1.05
              ? (lang === "en"
                  ? `Time flows ${gamma.toFixed(2)}x slower on spacecraft`
                  : `Uzay gemisinde zaman ${gamma.toFixed(2)} kat yavaş akıyor`)
              : (lang === "en" ? "Near classical flow" : "Klasik zaman akışına yakın")}
          </p>
        </div>
        <div className="w-full bg-purple-950/40 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${isSpeedOfLight ? "bg-red-500 w-0" : "bg-purple-400"}`}
            style={{ width: isSpeedOfLight ? "0%" : `${(shipTime % 10) * 10}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE EXPORT
════════════════════════════════════════════════════════════ */
export default function LorentzCalculatorPage() {
  const [lang, setLang] = useState("tr");
  // Velocity fraction: 0 to 0.999999
  const [vFraction, setVFraction] = useState(0.866); // Default: v = 0.866c (gamma ≈ 2.0)
  const [activeTab, setActiveTab] = useState("simulator"); // 'simulator' | 'physics' | 'multimedia'

  // Calculations
  const vKmS = vFraction * C_KMS;
  const betaSq = Math.min(0.999999999999, Math.pow(vFraction, 2));
  const gamma = 1 / Math.sqrt(1 - betaSq);
  const lengthRatio = (1 / gamma) * 100; // Percentage of original length L0
  const kineticEnergyFactor = gamma - 1; // E_k = (gamma - 1) * m_0 * c^2
  const dopplerBlueFactor = Math.sqrt((1 + vFraction) / (1 - vFraction)); // Head-on Doppler shift

  // Format Helper for accurate velocity percentage without false 100% rounding
  const formatVelocityPercent = (v) => {
    if (v >= 1) return "100.0000";
    const percent = v * 100;
    // If it's extremely close to 100% (e.g. 0.999999991 -> 99.9999991%)
    if (v >= 0.9999) {
      // Determine precision so trailing 9s and significant digits are preserved
      const str = v.toString();
      const decPart = str.split('.')[1] || '';
      const decimalsNeeded = Math.min(7, Math.max(4, decPart.length - 2));
      const formatted = percent.toFixed(decimalsNeeded);
      // Ensure we NEVER display "100.0000%" if v < 1
      if (parseFloat(formatted) >= 100) {
        return "99.9999991";
      }
      return formatted;
    }
    return percent.toFixed(4);
  };

  // Format Helper for large gamma
  const fmtGamma = (g) => {
    if (!isFinite(g)) return "∞ (Işık Sınırı)";
    if (g > 10000) return g.toExponential(4);
    return g.toFixed(4);
  };

  const PAGE_TEXT = {
    tr: {
      badge: "SPECIAL RELATIVITY // LORENTZ KINEMATICS",
      title: "Özel Görelilik &\nLorentz Faktörü Simülatörü",
      sub: "Albert Einstein'ın 1905 Özel Görelilik Kuramı ışığında; hız ışık sınırına (c) yaklaştıkça uzay-zaman sürekliliğindeki zaman genleşmesini (Time Dilation), uzunluk daralmasını (Length Contraction) ve göreli enerji artışını interaktif simüle edin.",
      tabs: {
        sim: "🎛️ İnteraktif Simülatör & Kokpit",
        physics: "📐 Formüller & Kuramsal Fizik",
        media: "🎬 Video & Bilimsel Multimedya"
      }
    },
    en: {
      badge: "SPECIAL RELATIVITY // LORENTZ KINEMATICS",
      title: "Special Relativity &\nLorentz Factor Simulator",
      sub: "Explore Albert Einstein's 1905 Special Theory of Relativity. Live simulate space-time warping, Lorentz factor (γ), relativistic time dilation, length contraction, and mass-energy scaling as velocity approaches the speed of light.",
      tabs: {
        sim: "🎛️ Interactive Simulator & Cockpit",
        physics: "📐 Physics & Derivations",
        media: "🎬 Video & Scientific Media"
      }
    }
  }[lang];

  return (
    <div className="min-h-screen transition-theme" style={{ color: "var(--foreground)" }}>
      <ReadingProgressBar />
      <Header isArticle={false} lang={lang} onLangChange={setLang} />

      {/* Hero Header */}
      <section
        className="py-16 animate-fade-in-up"
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/calculations"
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest mb-6 transition-theme"
            style={{ color: "var(--foreground-muted)" }}
          >
            ← {lang === "en" ? "All Calculation Tools" : "Tüm Hesaplama Araçları"}
          </Link>

          <div
            className="inline-flex items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full block w-fit"
            style={{ border: "1px solid var(--border-color)", background: "var(--glass-bg)", color: "var(--foreground-muted)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: "#a855f7" }} />
            {PAGE_TEXT.badge}
          </div>

          <h1
            className="font-black uppercase animate-fade-in-up-delay-1"
            style={{
              fontSize: "clamp(2rem,5vw,3.5rem)",
              letterSpacing: "-0.04em",
              color: "var(--foreground)",
              lineHeight: 0.95,
              whiteSpace: "pre-line",
            }}
          >
            {PAGE_TEXT.title}
          </h1>
          <p className="mt-4 text-sm md:text-base leading-relaxed max-w-3xl animate-fade-in-up-delay-2"
            style={{ color: "var(--foreground-muted)" }}>
            {PAGE_TEXT.sub}
          </p>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-8 flex-wrap">
            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                activeTab === "simulator"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {PAGE_TEXT.tabs.sim}
            </button>
            <button
              onClick={() => setActiveTab("physics")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                activeTab === "physics"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {PAGE_TEXT.tabs.physics}
            </button>
            <button
              onClick={() => setActiveTab("multimedia")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                activeTab === "multimedia"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {PAGE_TEXT.tabs.media}
            </button>
          </div>
        </div>
      </section>

      {/* Main Interactive Body */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {activeTab === "simulator" && (
          <div className="space-y-8">
            {/* Speed Input Cockpit Panel */}
            <div className="cockpit-panel p-6 md:p-8 rounded-2xl shadow-2xl space-y-6">
              <div>
                <div className="flex flex-wrap justify-between items-baseline gap-2 mb-3">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold" style={{ color: "var(--foreground-muted)" }}>
                    {lang === "en" ? "Velocity Ratio (v / c)" : "Hız Oranı (v / c)"}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-purple-400">
                      {vKmS.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} km/s
                    </span>
                    <span style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--foreground)" }}>
                      {formatVelocityPercent(vFraction)}% c
                    </span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  id="velocity-slider"
                  type="range"
                  min={0}
                  max={1.0}
                  step={0.0001}
                  value={vFraction}
                  onChange={(e) => setVFraction(parseFloat(e.target.value))}
                  className="slider-dilation w-full"
                  style={{
                    height: "8px",
                    background: `linear-gradient(90deg, #a855f7 ${vFraction * 100}%, rgba(255,255,255,0.1) ${vFraction * 100}%)`,
                  }}
                />

                <div className="flex justify-between font-mono text-[10px] mt-2 text-white/50">
                  <span>0.0c (Durgun)</span>
                  <span>0.5c</span>
                  <span>0.866c (γ = 2)</span>
                  <span>0.99c (γ = 7.1)</span>
                  <span className="text-purple-400 font-bold">1.00c (Işık Sınırı / Foton)</span>
                </div>
              </div>

              {/* Cosmic & Real-World Presets */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-3">
                  {lang === "en" ? "Cosmic Velocity Presets:" : "Kozmik & Gerçek Dünya Hız Önayarları:"}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setVFraction(p.vFraction)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        Math.abs(vFraction - p.vFraction) < 0.00000001
                          ? "bg-purple-600/30 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <div className="font-bold text-xs truncate">
                        {lang === "en" ? p.nameEn : p.nameTr}
                      </div>
                      <div className="font-mono text-[9px] text-purple-300 mt-0.5">
                        {lang === "en" ? p.badgeEn : p.badge}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Canvas Simulations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RelativisticSpacecraftCanvas vFraction={vFraction} gamma={gamma} />
              <LorentzCurveChart vFraction={vFraction} gamma={gamma} />
            </div>

            {/* Live Scientific Metrics Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Metric 1: Lorentz Factor */}
              <div className="cockpit-panel p-5 rounded-xl border border-white/10 bg-white/5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-purple-400 mb-1">
                  {lang === "en" ? "Lorentz Factor (γ)" : "Lorentz Faktörü (γ)"}
                </p>
                <p className="text-3xl font-black font-mono tracking-tight text-white">
                  {fmtGamma(gamma)}
                </p>
                <p className="text-[11px] text-white/50 mt-1 font-mono">
                  {vFraction >= 1.0 ? "γ → ∞ (Singularity / Tekillik)" : "γ = 1 / √(1 - v²/c²)"}
                </p>
              </div>

              {/* Metric 2: Time Dilation */}
              <div className="cockpit-panel p-5 rounded-xl border border-white/10 bg-white/5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">
                  {lang === "en" ? "Time Dilation (Δt / Δt₀)" : "Zaman Genleşmesi (Δt)"}
                </p>
                <p className="text-3xl font-black font-mono tracking-tight text-white">
                  {vFraction >= 1.0 ? "∞ (Zaman Durdu)" : `${fmtGamma(gamma)}×`}
                </p>
                <p className="text-[11px] text-white/50 mt-1 font-mono">
                  {vFraction >= 1.0 ? (
                    <strong className="text-red-400">Δt₀ = 0 (Öz Zaman Dondu)</strong>
                  ) : (
                    <>
                      {lang === "en" ? "1 sec in ship = " : "Gemide 1 sn = "}
                      <strong className="text-blue-300">{fmtGamma(gamma)} sn</strong>
                    </>
                  )}
                </p>
              </div>

              {/* Metric 3: Length Contraction */}
              <div className="cockpit-panel p-5 rounded-xl border border-white/10 bg-white/5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-pink-400 mb-1">
                  {lang === "en" ? "Contracted Length (L)" : "Daralan Uzunluk (L)"}
                </p>
                <p className="text-3xl font-black font-mono tracking-tight text-white">
                  {vFraction >= 1.0 ? "0.00%" : `${lengthRatio.toFixed(2)}%`}
                </p>
                <p className="text-[11px] text-white/50 mt-1 font-mono">
                  {vFraction >= 1.0 ? (
                    <strong className="text-red-400">L = 0 (Uzay 2D Düzlem Oldu)</strong>
                  ) : (
                    `L = L₀ / γ (${((1 - 1 / gamma) * 100).toFixed(1)}% ${lang === "en" ? "shorter" : "kısalma"})`
                  )}
                </p>
              </div>

              {/* Metric 4: Relativistic Kinetic Energy */}
              <div className="cockpit-panel p-5 rounded-xl border border-white/10 bg-white/5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
                  {lang === "en" ? "Relativistic Energy (E/E₀)" : "Göreli Enerji (E/E₀)"}
                </p>
                <p className="text-3xl font-black font-mono tracking-tight text-white">
                  {vFraction >= 1.0 ? "∞ (Sonsuz Enerji)" : `${fmtGamma(gamma)} E₀`}
                </p>
                <p className="text-[11px] text-white/50 mt-1 font-mono">
                  {vFraction >= 1.0
                    ? "Yalnızca m₀=0 Fotonlar Ulaşabilir"
                    : `E_k = ${kineticEnergyFactor > 1000 ? kineticEnergyFactor.toExponential(2) : kineticEnergyFactor.toFixed(3)} m₀c²`}
                </p>
              </div>
            </div>

            {/* Twin Paradox Real-Time Clock Simulator */}
            <div className="cockpit-panel p-6 md:p-8 rounded-2xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⏳</span> {lang === "en" ? "Twin Paradox Real-Time Clock Simulation" : "İkizler Paradoksu Canlı Saat Simülatörü"}
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-purple-400">
                  {lang === "en" ? "Differential Ageing Mechanism" : "Farklı Yaşlanma Mekanizması"}
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                {lang === "en"
                  ? "According to special relativity, an observer traveling on a high-velocity spacecraft experiences time dilation relative to an Earth-bound twin. The clocks below demonstrate real-time elapsed seconds in both reference frames simultaneously."
                  : "Özel görelilik yasalarına göre; ışık hızına yakın seyreden bir uzay gemisindeki seyyahın biyolojik ve atomik saati, Dünya'da bekleyen ikizine göre yavaşlar. Aşağıdaki canlı göstergeler iki referans sisteminde geçen saniyeleri anlık kıyaslar."}
              </p>
              <TwinParadoxClocks gamma={gamma} vFraction={vFraction} lang={lang} />
            </div>
          </div>
        )}

        {/* Tab 2: Physics & Derivations */}
        {activeTab === "physics" && (
          <div className="space-y-6">
            <div className="cockpit-panel p-6 md:p-8 rounded-2xl shadow-2xl space-y-6">
              <h2 className="text-2xl font-black text-white">
                {lang === "en" ? "Theoretical Principles of Special Relativity" : "Özel Görelilik ve Lorentz Dönüşümlerinin Kuramsal Temelleri"}
              </h2>

              {/* Principle 1 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h3 className="font-bold text-purple-400 text-sm">
                  1. {lang === "en" ? "Lorentz Factor Definition (γ)" : "Lorentz Faktörü Tanımı (γ)"}
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  {lang === "en"
                    ? "The Lorentz factor γ is a quantity expressing how much the measurements of time, length, and relativistic mass change for an object while that object is moving relative to an inertial reference frame:"
                    : "Lorentz faktörü γ, bir cismin gözlemcinin eylemsiz referans sistemine göre hareket ederken zaman, uzunluk ve dinamik kütle ölçümlerinin klasik mekanikten ne kadar saptığını belirten temel görelilik çarpanıdır:"}
                </p>
                <div className="p-3 rounded-lg bg-black/50 font-mono text-sm text-purple-300 text-center">
                  γ = 1 / √(1 − v² / c²) = 1 / √(1 − β²)
                </div>
              </div>

              {/* Principle 2 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h3 className="font-bold text-blue-400 text-sm">
                  2. {lang === "en" ? "Time Dilation (Δt = γ Δt₀)" : "Zaman Genleşmesi (Zamanın Yavaşlaması)"}
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  {lang === "en"
                    ? "Proper time (t₀) is measured in a frame where the clock is at rest. In any other moving frame, the time interval between the same two events appears lengthened by a factor of γ."
                    : "Öz zaman (t₀), saatin durgun olduğu sistemde ölçülen zamandır. Durgun bir gözlemciye göre hızla hareket eden bir saat daima daha yavaş çalışır:"}
                </p>
                <div className="p-3 rounded-lg bg-black/50 font-mono text-sm text-blue-300 text-center">
                  Δt = γ · Δt₀ = Δt₀ / √(1 − v² / c²)
                </div>
              </div>

              {/* Principle 3 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h3 className="font-bold text-pink-400 text-sm">
                  3. {lang === "en" ? "Lorentz-FitzGerald Length Contraction (L = L₀ / γ)" : "Lorentz-FitzGerald Uzunluk Daralması"}
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  {lang === "en"
                    ? "Objects moving at relativistic speeds are measured to be shortened along the direction of motion relative to their rest length L₀. Perpendicular dimensions remain unaffected."
                    : "Işık hızına yakın hareket eden bir cismin boyu, yalnızca hareket doğrultusu boyunca durgunluk uzunluğu L₀'a kıyasla daralır. Harekete dik eksenlerde herhangi bir değişim olmaz:"}
                </p>
                <div className="p-3 rounded-lg bg-black/50 font-mono text-sm text-pink-300 text-center">
                  L = L₀ / γ = L₀ · √(1 − v² / c²)
                </div>
              </div>

              {/* Principle 4 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h3 className="font-bold text-emerald-400 text-sm">
                  4. {lang === "en" ? "Relativistic Mass & Energy Equivalence (E = γ m₀ c²)" : "Relativistik Kütle-Enerji Eşdeğerliği"}
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  {lang === "en"
                    ? "As velocity approaches c, the relativistic kinetic energy required to accelerate the object further tends toward infinity, ensuring no object with rest mass can ever reach or exceed light speed."
                    : "Hız ışık hızına (c) yaklaştıkça cismi daha fazla ivmelendirmek için gereken kinetik enerji sonsuza ıraksar. Bu nedenle durgun kütleye (m₀) sahip hiçbir madde ışık hızına tam olarak ulaşamaz veya aşamaz:"}
                </p>
                <div className="p-3 rounded-lg bg-black/50 font-mono text-sm text-emerald-300 text-center">
                  E_toplam = γ · m₀ · c² = E₀ + E_kinetik
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Video & Scientific Multimedia */}
        {activeTab === "multimedia" && (
          <div className="space-y-6">
            <div className="cockpit-panel p-6 md:p-8 rounded-2xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-2xl font-black text-white">
                  {lang === "en" ? "Special Relativity Video & Archive Media" : "Özel Görelilik Video & Bilimsel Arşiv Kaynakları"}
                </h2>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-purple-600/20 text-purple-300 border border-purple-500/30">
                  EVENT HORIZON SCI-ARCHIVE
                </span>
              </div>

              {/* Embedded Video Showcase */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/ajhFNcUTJI0"
                  title="Special Relativity and Time Dilation"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Explanatory Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>💡</span> {lang === "en" ? "Michelson-Morley Experiment (1887)" : "Michelson-Morley Deneyi (1887)"}
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {lang === "en"
                      ? "The historic experiment that proved the speed of light in vacuum is constant in all inertial reference frames, leading to the collapse of the luminiferous aether hypothesis."
                      : "Işık hızının tüm eylemsiz referans sistemlerinde sabit olduğunu kanıtlayarak eter (esir) hipotezini çürüten ve Einstein'ın görelilik kuramına zemin hazırlayan dönüm noktası deneydir."}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>🛰️</span> {lang === "en" ? "GPS Satellites Relativistic Drift" : "GPS Uydularında Relativistik Düzeltme"}
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {lang === "en"
                      ? "GPS atomic clocks tick ~7 microseconds slower per day due to orbital velocity (special relativity) and ~45 microseconds faster due to gravitational altitude (general relativity)."
                      : "GPS atom saatleri özel görelilik (yörünge hızı) sebebiyle günde 7 mikrosaniye geri kalırken, genel görelilik (yerçekimi farkı) sebebiyle 45 mikrosaniye ileri gider; net +38 mikrosaniye her gün düzeltilmektedir."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation back to all tools */}
        <div className="mt-12">
          <Link
            href="/calculations"
            className="font-mono text-[11px] uppercase tracking-widest transition-theme inline-flex items-center gap-2"
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

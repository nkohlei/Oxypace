"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../../blog/components/Header";
import Footer from "../../blog/components/Footer";
import ReadingProgressBar from "../../blog/components/ReadingProgressBar";
import CookieConsent from "../../blog/components/CookieConsent";

/* ════════════════════════════════════════════════════════════
   3D BLACK HOLE CSS SIMULATION
════════════════════════════════════════════════════════════ */
function BlackHoleSim({ distance, rs = 10 }) {
  const proximity = 1 - Math.min(1, (distance - rs) / 90);
  const holeR    = 60 + proximity * 40;
  const ringR    = holeR + 20 + proximity * 40;

  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "240px", height: "240px",
      flexShrink: 0,
    }}>
      {[1.8, 1.5, 1.25, 1.08].map((scale, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${ringR * scale * 2}px`,
          height: `${ringR * scale * 0.35}px`,
          borderRadius: "50%",
          border: `${0.8 - i * 0.15}px solid rgba(255,255,255,${0.07 - i * 0.015})`,
          animation: `warp-drift ${8 + i * 3}s linear infinite${i % 2 === 1 ? " reverse" : ""}`,
          transform: `rotateX(75deg)`,
        }} />
      ))}

      <div style={{
        position: "absolute",
        width: `${ringR * 2}px`,
        height: `${ringR * 0.3}px`,
        borderRadius: "50%",
        background: `radial-gradient(ellipse at center,
          rgba(${200 + Math.round(proximity*55)},${Math.round(120 - proximity*80)},20,0.9) 0%,
          rgba(200,80,20,0.5) 40%,
          transparent 70%)`,
        transform: "rotateX(70deg)",
        transition: "all 0.5s ease",
        filter: "blur(1px)",
      }} />

      <div style={{
        position: "relative",
        zIndex: 10,
        width: `${holeR * 2}px`,
        height: `${holeR * 2}px`,
        borderRadius: "50%",
        background: "radial-gradient(ellipse at 35% 35%, rgba(30,30,40,0.3) 0%, #000 60%)",
        boxShadow: `0 0 ${20 + proximity*40}px rgba(0,0,0,0.8), inset 0 0 ${holeR}px rgba(0,0,0,0.95)`,
        transition: "width 0.5s ease, height 0.5s ease, box-shadow 0.5s ease",
      }} />

      <div style={{
        position: "absolute", zIndex: 11,
        width: `${holeR * 2 + 8}px`,
        height: `${holeR * 2 + 8}px`,
        borderRadius: "50%",
        border: `1px solid rgba(255,200,100,${0.2 + proximity * 0.35})`,
        transition: "all 0.5s ease",
      }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TIME DILATION PAGE
════════════════════════════════════════════════════════════ */
export default function TimeDilationPage() {
  const [lang, setLang] = useState("tr");
  const [distance, setDistance] = useState(35);
  const rs = 10;
  
  const isUnstable = distance < 30 && distance > 15;
  const isExtreme = distance <= 15;

  let factor = 1;
  if (distance > rs) factor = 1 / Math.sqrt(1 - rs / distance);
  else factor = Infinity;

  const fmt = (f) => {
    if (!isFinite(f)) return lang === "en" ? "∞  EVENT HORIZON" : "∞  OLAY UFKU";
    if (f > 3600) return `${(f/3600).toFixed(3)} ${lang === "en" ? "HOURS" : "SAAT"}`;
    if (f > 60)   return `${(f/60).toFixed(3)}  ${lang === "en" ? "MIN" : "DAK"}`;
    return `${f.toFixed(4)} ${lang === "en" ? "SEC" : "SAN"}`;
  };

  const PAGE_TEXT = {
    tr: {
      badge: "ASTROPHYSICS // RELATIVISTIC PHYSICS",
      title: "Schwarzschild Zaman\nDilatasyonu Simülatörü",
      sub: "Dönmeyen bir kara deliğe (Schwarzschild metriği) yaklaştıkça kütleçekimsel zaman genleşmesini, foton küresini ve ISCO kararlı yörünge sınırlarını simüle et.",
    },
    en: {
      badge: "ASTROPHYSICS // RELATIVISTIC PHYSICS",
      title: "Schwarzschild Time\nDilation Simulator",
      sub: "Simulate gravitational time dilation, photon sphere, and ISCO orbit stability limits near a non-rotating black hole.",
    },
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
            <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: "var(--accent)" }} />
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
          <p className="mt-4 text-sm md:text-base leading-relaxed max-w-2xl animate-fade-in-up-delay-2"
            style={{ color: "var(--foreground-muted)" }}>
            {PAGE_TEXT.sub}
          </p>
        </div>
      </section>

      {/* Main Interactive Tool */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="cockpit-panel p-6 md:p-10 shadow-2xl">
          <div className="mb-8">
            <div className="flex justify-between items-baseline mb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider font-bold" style={{ color: "var(--foreground-muted)" }}>
                {lang === "en" ? "Radial Distance (r)" : "Radyal Uzaklık (r)"}
              </span>
              <span style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--foreground)" }}>
                {distance} km
              </span>
            </div>
            <input
              id="dilation-slider"
              type="range" min={10} max={100} step={1}
              value={distance}
              onChange={(e) => setDistance(+e.target.value)}
              className="slider-dilation"
              style={{
                height: "6px",
                background: `linear-gradient(90deg,var(--accent) ${((distance-10)/90)*100}%,var(--glass-border) ${((distance-10)/90)*100}%)`,
              }}
            />
            <div className="flex justify-between font-mono text-[10px] mt-2" style={{ color: "var(--foreground-subtle)" }}>
              <span style={{ color: "#ef4444" }}>10 km ({lang === "en" ? "Event Horizon, rₛ=10km" : "Olay Ufku, rₛ=10km"})</span>
              <span style={{ color: "#f59e0b" }}>15 km (Foton Küresi)</span>
              <span style={{ color: "#22c55e" }}>30 km (ISCO Sınırı)</span>
              <span>100 km ({lang === "en" ? "Flat Space" : "Düz Uzay"})</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "32px", alignItems: "center", flexWrap: "wrap" }}>
            <BlackHoleSim distance={distance} rs={rs} />

            <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="cockpit-panel" style={{ padding: "14px 16px" }}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--foreground-subtle)" }}>
                  General Relativity Formula
                </p>
                <code style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "monospace" }}>
                  t = t₀ / √(1 − rₛ/r)
                </code>
              </div>

              <div className="cockpit-panel" style={{ padding: "14px 16px" }}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--foreground-subtle)" }}>
                  {lang === "en" ? "1 sec on shuttle = Earth:" : "Mekikte 1 sn = Dünya:"}
                </p>
                <p style={{
                  fontSize: "clamp(1.2rem,3vw,1.8rem)", fontWeight: 900,
                  letterSpacing: "-0.04em", wordBreak: "break-all",
                  color: isExtreme ? "#ef4444" : isUnstable ? "#f59e0b" : "var(--foreground)",
                  transition: "color 0.5s ease",
                }}>
                  {fmt(factor)}
                </p>
              </div>

              <div className="cockpit-panel" style={{ padding: "14px 16px" }}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--foreground-subtle)" }}>
                  {lang === "en" ? "Dilation Factor" : "Dilatasyon Faktörü"}
                </p>
                <p style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--foreground)" }}>
                  ×{isFinite(factor) ? factor.toFixed(4) : "∞"}
                </p>
              </div>

              {isExtreme ? (
                <div className="cockpit-panel" style={{ padding: "12px 16px", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
                  <p className="font-mono text-[11px] font-black uppercase tracking-wider" style={{ color: "#ef4444" }}>
                    ⚠ {lang === "en" ? "CRITICAL GRAVITY (Inside Photon Sphere)" : "KRİTİK ÇÖKÜŞ (Foton Küresi İçi)"}
                  </p>
                </div>
              ) : isUnstable ? (
                <div className="cockpit-panel" style={{ padding: "12px 16px", borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)" }}>
                  <p className="font-mono text-[11px] font-black uppercase tracking-wider" style={{ color: "#f59e0b" }}>
                    ⚠ {lang === "en" ? "UNSTABLE ORBIT (r < 30km ISCO)" : "KARARSIZ YÖRÜNGE (r < 30km ISCO)"}
                  </p>
                </div>
              ) : (
                <div className="cockpit-panel" style={{ padding: "12px 16px" }}>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider" style={{ color: "#22c55e" }}>
                    ✓ {lang === "en" ? "Orbit Stable (r ≥ 30 km)" : "Yörünge Stabil (r ≥ 30 km)"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation back */}
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

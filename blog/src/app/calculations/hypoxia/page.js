"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../../blog/components/Header";
import Footer from "../../blog/components/Footer";
import ReadingProgressBar from "../../blog/components/ReadingProgressBar";
import CookieConsent from "../../blog/components/CookieConsent";

/* ════════════════════════════════════════════════════════════
   ATMOSPHERIC SVG VISUALISER
════════════════════════════════════════════════════════════ */
function AtmosphericVisualiser({ altitude, isDeathZone, lang }) {
  const MAX  = 12000;
  const frac = altitude / MAX; // 0..1
  const SVG_H = 280;
  const lineY  = SVG_H - frac * SVG_H;

  const layers = [
    { y: 0,          h: SVG_H * 0.08, fill: "#1a0536", label: lang === "en" ? "Exosphere" : "Ekzosfer",   alt: "500+ km" },
    { y: SVG_H * 0.08, h: SVG_H * 0.16, fill: "#0a1a45", label: lang === "en" ? "Thermosphere" : "Termosfer", alt: "80–500 km" },
    { y: SVG_H * 0.24, h: SVG_H * 0.14, fill: "#0c2a5e", label: lang === "en" ? "Mesosphere" : "Mezosfer",   alt: "50–80 km" },
    { y: SVG_H * 0.38, h: SVG_H * 0.20, fill: "#1a3f7a", label: lang === "en" ? "Stratosphere" : "Stratosfer", alt: "12–50 km" },
    { y: SVG_H * 0.58, h: SVG_H * 0.42, fill: "#1e5095", label: lang === "en" ? "Troposphere" : "Troposfer",  alt: "0–12 km" },
  ];

  const o2 = (20.9 * Math.exp(-altitude / 8200)).toFixed(2);
  const pressure = (101.325 * Math.exp(-altitude / 8200)).toFixed(1);

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flexWrap: "wrap" }}>
      {/* SVG atmosphere column */}
      <div style={{ flex: "0 0 auto" }}>
        <svg width="80" height={SVG_H} viewBox={`0 0 80 ${SVG_H}`} style={{ borderRadius: "8px", overflow: "hidden" }}>
          {layers.map((l, i) => (
            <rect key={i} x={0} y={l.y} width={80} height={l.h} fill={l.fill} />
          ))}

          {isDeathZone && (
            <rect
              x={0} y={lineY} width={80}
              height={SVG_H - lineY}
              fill="rgba(239,68,68,0.18)"
              style={{ animation: "death-blink 1s ease-in-out infinite" }}
            />
          )}

          <line
            x1={0} y1={lineY} x2={80} y2={lineY}
            stroke={isDeathZone ? "#ef4444" : "rgba(255,255,255,0.9)"}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            style={{ transition: "y1 0.4s ease, y2 0.4s ease" }}
          />

          <rect x={4} y={lineY - 14} width={46} height={13} rx={3} fill="rgba(0,0,0,0.6)" />
          <text x={8} y={lineY - 4}
            fill={isDeathZone ? "#ef4444" : "#fff"}
            fontSize="8" fontFamily="monospace" fontWeight="700"
          >
            {altitude.toLocaleString()} m
          </text>

          <line x1={0} y1={SVG_H - (8000 / MAX) * SVG_H} x2={80} y2={SVG_H - (8000 / MAX) * SVG_H}
            stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
          <text x={4} y={SVG_H - (8000 / MAX) * SVG_H - 3}
            fill="#ef4444" fontSize="6.5" fontFamily="monospace">8000m</text>
        </svg>
      </div>

      {/* Stats column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", minWidth: "160px" }}>
        <div className="cockpit-panel" style={{ padding: "14px 16px" }}>
          <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--foreground-subtle)" }}>
            {lang === "en" ? "Effective O₂" : "Efektif O₂"}
          </p>
          <p style={{
            fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em",
            color: isDeathZone ? "#ef4444" : "var(--foreground)",
            transition: "color 0.5s ease",
          }}>
            {o2}%
          </p>
          <div style={{ height: "3px", background: "var(--glass-border)", borderRadius: "2px", marginTop: "8px" }}>
            <div style={{
              height: "100%", borderRadius: "2px",
              width: `${(parseFloat(o2) / 20.9) * 100}%`,
              background: isDeathZone ? "#ef4444" : "var(--foreground)",
              transition: "width 0.4s ease, background 0.4s ease",
            }} />
          </div>
          <p className="font-mono text-[9px] mt-1" style={{ color: "var(--foreground-subtle)" }}>
            {lang === "en" ? "Sea level: 20.9%" : "Deniz sev.: 20.9%"}
          </p>
        </div>

        <div className="cockpit-panel" style={{ padding: "14px 16px" }}>
          <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--foreground-subtle)" }}>
            {lang === "en" ? "Atm. Pressure" : "Atm. Basıncı"}
          </p>
          <p style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--foreground)" }}>
            {pressure}
          </p>
          <p className="font-mono text-[9px]" style={{ color: "var(--foreground-subtle)" }}>kPa</p>
        </div>

        {isDeathZone ? (
          <div
            className="cockpit-panel animate-death-blink"
            style={{ padding: "12px 16px", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}
          >
            <p className="font-mono text-[11px] font-black uppercase tracking-wider" style={{ color: "#ef4444" }}>
              ☠️ DEATH ZONE
            </p>
            <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(239,68,68,0.7)" }}>
              {lang === "en" ? "Hypoxia critical. Cell breakdown active." : "Hipoksi kritik. Hücresel bozunma aktif."}
            </p>
          </div>
        ) : (
          <div className="cockpit-panel" style={{ padding: "12px 16px" }}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#22c55e" }}>
              ✓ {lang === "en" ? "Life Support Stable" : "Yaşam Destek Stabil"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ATMOSPHERIC HYPOXIA PAGE
════════════════════════════════════════════════════════════ */
export default function AtmosphericHypoxiaPage() {
  const [lang, setLang] = useState("tr");
  const [altitude, setAltitude] = useState(4500);
  const isDeathZone = altitude >= 8000;

  const PAGE_TEXT = {
    tr: {
      badge: "ATMOSPHERIC BIOPHYSICS // SIMULATOR",
      title: "Atmosferik Hipoksi\nKontrol Merkezi",
      sub: "İrtifa değiştikçe atmosfer katmanları, barometrik basınç ve efektif O₂ oranının insan metabolizmasına biyofiziksel etkilerini canlı simüle et.",
    },
    en: {
      badge: "ATMOSPHERIC BIOPHYSICS // SIMULATOR",
      title: "Atmospheric Hypoxia\nControl Center",
      sub: "Live simulate the biophysical effects of altitude changes, barometric pressure, and effective O₂ levels on human metabolism.",
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
                {lang === "en" ? "Target Altitude (m)" : "Hedef İrtifa (m)"}
              </span>
              <span style={{
                fontSize: "24px", fontWeight: 900, letterSpacing: "-0.04em",
                color: isDeathZone ? "#ef4444" : "var(--foreground)",
                transition: "color 0.4s ease",
              }}>
                {altitude.toLocaleString()} m
              </span>
            </div>
            <input
              id="altitude-slider"
              type="range" min={0} max={12000} step={50}
              value={altitude}
              onChange={(e) => setAltitude(+e.target.value)}
              className="slider-altitude"
              style={{
                height: "6px",
                background: isDeathZone
                  ? `linear-gradient(90deg,#ef4444 ${(altitude/12000)*100}%,var(--glass-border) ${(altitude/12000)*100}%)`
                  : `linear-gradient(90deg,var(--accent) ${(altitude/12000)*100}%,var(--glass-border) ${(altitude/12000)*100}%)`,
              }}
            />
            <div className="flex justify-between font-mono text-[10px] mt-2" style={{ color: "var(--foreground-subtle)" }}>
              <span>{lang === "en" ? "0 m (Sea Level)" : "0 m (Deniz Seviyesi)"}</span>
              <span style={{ color: "#ef4444" }}>{lang === "en" ? "8.000 m+ (Death Zone)" : "8.000 m+ (Ölüm Bölgesi)"}</span>
              <span>{lang === "en" ? "12,000 m (Apex)" : "12.000 m (Apex)"}</span>
            </div>
          </div>

          <AtmosphericVisualiser altitude={altitude} isDeathZone={isDeathZone} lang={lang} />
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

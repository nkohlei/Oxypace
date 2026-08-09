"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../blog/components/Header";
import Footer from "../blog/components/Footer";
import ReadingProgressBar from "../blog/components/ReadingProgressBar";
import CookieConsent from "../blog/components/CookieConsent";
import { formatBlogImageUrl } from "../blog/utils/imageHelper";

const DEFAULT_CALCULATORS = [
  {
    id: "hypoxia",
    toolId: "hypoxia",
    slug: "/calculations/hypoxia",
    category: "ATMOSPHERIC BIOPHYSICS",
    type: "INTERACTIVE SIMULATOR",
    image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80",
    title: {
      tr: "Atmosferik Hipoksi Kontrol Merkezi",
      en: "Atmospheric Hypoxia Control Center",
    },
    excerpt: {
      tr: "İrtifaya bağlı olarak atmosfer katmanlarındaki efektif O₂ oranını, barometrik basınç değişimini ve biyofiziksel hipoksi sınırlarını canlı simüle edin.",
      en: "Live simulate effective O₂ percentages, barometric pressure changes, and biophysical hypoxia limits across atmospheric layers based on altitude.",
    },
    accentColor: "#0ea5e9",
  },
  {
    id: "time-dilation",
    toolId: "time-dilation",
    slug: "/calculations/time-dilation",
    category: "ASTROPHYSICS & GR",
    type: "INTERACTIVE SIMULATOR",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80",
    title: {
      tr: "Schwarzschild Zaman Dilatasyonu Simülatörü",
      en: "Schwarzschild Time Dilation Simulator",
    },
    excerpt: {
      tr: "Schwarzschild metriğindeki kütleçekimsel zaman genleşmesini, foton küresi limitini ve ISCO kararlı yörünge stabilitesini interaktif olarak hesaplayın.",
      en: "Interactively calculate gravitational time dilation, photon sphere limits, and ISCO orbit stability near a non-rotating Schwarzschild black hole.",
    },
    accentColor: "#818cf8",
  },
];

export default function CalculationsPage() {
  const [lang, setLang] = useState("tr");
  const [calculators, setCalculators] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const baseUrl = typeof window !== 'undefined'
          ? (window.location.origin.includes('localhost') ? 'http://localhost:5000/api/blog/calculations' : '/api/blog/calculations')
          : '/api/blog/calculations';
        const apiUrl = `${baseUrl}?_t=${Date.now()}`;
        const res = await fetch(apiUrl, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCalculators(data.map(item => ({
              ...item,
              id: item.toolId || item.id,
              title: typeof item.title === 'object' ? (item.title[lang] || item.title.tr) : item.title,
              excerpt: typeof item.excerpt === 'object' ? (item.excerpt[lang] || item.excerpt.tr) : item.excerpt,
            })));
          } else {
            setCalculators(DEFAULT_CALCULATORS);
          }
        } else {
          setCalculators(DEFAULT_CALCULATORS);
        }
      } catch (e) {
        console.error('Fetch calculation tools error:', e);
        setCalculators(DEFAULT_CALCULATORS);
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, [lang]);

  const PAGE = {
    tr: {
      badge: "RESEARCH APEX // INTERACTIVE PHYSICS",
      title: "Analiz & Hesaplama\nPortalı",
      sub: "Biyofiziksel atmosferik hipoksi ve astrofiziksel kütleçekimsel zaman genleşmesi interaktif simülasyon ve hesaplama araçları.",
      launchLabel: "Simülatörü Çalıştır →",
    },
    en: {
      badge: "RESEARCH APEX // INTERACTIVE PHYSICS",
      title: "Analysis & Calculations\nPortal",
      sub: "Interactive simulation and calculation tools for biophysical atmospheric hypoxia and astrophysical gravitational time dilation.",
      launchLabel: "Launch Simulator →",
    },
  }[lang];

  return (
    <div className="min-h-screen transition-theme" style={{ color: "var(--foreground)" }}>
      <ReadingProgressBar />
      <Header isArticle={false} lang={lang} onLangChange={setLang} />

      {/* Hero */}
      <section
        className="py-20 animate-fade-in-up"
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ border: "1px solid var(--border-color)", background: "var(--glass-bg)", color: "var(--foreground-muted)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: "var(--accent)" }} />
            {PAGE.badge}
          </div>
          <h1
            className="font-black uppercase animate-fade-in-up-delay-1"
            style={{
              fontSize: "clamp(2.5rem,7vw,4.5rem)",
              letterSpacing: "-0.05em",
              color: "var(--foreground)",
              lineHeight: 0.95,
              whiteSpace: "pre-line",
            }}
          >
            {PAGE.title}
          </h1>
          <p className="mt-6 text-base leading-relaxed max-w-2xl animate-fade-in-up-delay-2"
            style={{ color: "var(--foreground-muted)" }}>
            {PAGE.sub}
          </p>
        </div>
      </section>

      {/* Calculation Tools Grid */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {loading || !calculators ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((n) => (
              <div key={n} className="glass-card rounded-2xl p-6 h-[380px] animate-pulse space-y-4">
                <div className="h-48 w-full bg-white/5 rounded-xl border border-white/10" />
                <div className="h-6 w-3/4 bg-white/5 rounded-lg border border-white/10" />
                <div className="h-12 w-full bg-white/5 rounded-lg border border-white/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {calculators.map((calc) => {
            const titleStr = typeof calc.title === 'object' ? (calc.title[lang] || calc.title.tr) : calc.title;
            const excerptStr = typeof calc.excerpt === 'object' ? (calc.excerpt[lang] || calc.excerpt.tr) : calc.excerpt;

            return (
              <article
                key={calc.id || calc.toolId}
                className="group glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col"
                id={`calc-card-${calc.id || calc.toolId}`}
              >
                {/* Cover Image */}
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img
                    src={formatBlogImageUrl(calc.image)}
                    alt={titleStr}
                    className="h-full w-full object-cover"
                    style={{
                      transition: "transform 0.8s cubic-bezier(0.16,1,0.3,1), filter 0.5s ease",
                      filter: "saturate(0.9)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.06)";
                      e.currentTarget.style.filter = "saturate(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.filter = "saturate(0.9)";
                    }}
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }}
                  />
                  <div className="absolute top-4 left-4 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10">
                    {calc.type || "INTERACTIVE SIMULATOR"}
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-col flex-1 p-6 gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge-category">{calc.category}</span>
                  </div>

                  <h2 className="text-xl font-bold leading-snug tracking-tight" style={{ color: "var(--foreground)" }}>
                    <Link href={calc.slug} className="focus:outline-none hover:opacity-80 transition-opacity">
                      {titleStr}
                    </Link>
                  </h2>

                  <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--foreground-muted)" }}>
                    {excerptStr}
                  </p>

                <div className="pt-2 mt-auto">
                  <Link
                    href={calc.slug}
                    className="inline-flex items-center justify-between w-full font-mono text-[11px] uppercase tracking-widest px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border-color)",
                      color: "var(--foreground)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = calc.accentColor;
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.borderColor = calc.accentColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "var(--foreground)";
                      e.currentTarget.style.borderColor = "var(--border-color)";
                    }}
                  >
                    <span>{PAGE.launchLabel}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </article>
          );
        </div>
        )}

        {/* Back to archive link */}
        <div className="mt-16">
          <Link
            href="/blog"
            className="font-mono text-[11px] uppercase tracking-widest transition-theme"
            style={{ color: "var(--foreground-muted)", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--foreground-muted)"; }}
          >
            ← {lang === "en" ? "Back to Archive" : "Arşive Geri Dön"}
          </Link>
        </div>
      </main>

      <Footer lang={lang} />
      <CookieConsent lang={lang} />
    </div>
  );
}

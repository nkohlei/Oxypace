"use client";

import { useState, useEffect } from "react";
import { FeaturedCard, MinimalCard, GridCard } from "./components/BlogCard";
import CookieConsent from "./components/CookieConsent";
import ReadingProgressBar from "./components/ReadingProgressBar";
import Header from "./components/Header";
import Footer from "./components/Footer";
import QuoteCards from "./components/QuoteCards";
import { posts as staticPosts } from "./data/posts";

const HERO_TEXT = {
  tr: {
    badge: "SECURE DEEP SCIENCE ARCHIVE // CLASSIFIED",
    title: ["EVENT", "HORIZON"],
    sub: "Evrenin fiziksel sınırlarını, astrofiziksel kuramları ve ekstrem doğa koşullarının biyofiziksel sınırlarını araştıran bağımsız teknik analiz arşivi.",
    featuredLabel: "ÖNE ÇIKAN DOKÜMAN",
    indexLabel: "TEKNİK İNDEKS",
    calcLink: "→ Analiz & Hesaplama Portali",
    gridLabel: "TÜM ANALİZLER",
    adSponsor: "SPONSOR PLACEMENT",
    adSponsorGrid: "SPONSOR IN-GRID",
    adBottom: "SPONSOR BOTTOM DISPLAY",
  },
  en: {
    badge: "SECURE DEEP SCIENCE ARCHIVE // CLASSIFIED",
    title: ["EVENT", "HORIZON"],
    sub: "An independent technical analysis archive researching the physical limits of the universe, astrophysical theories, and the biophysical boundaries of extreme environments.",
    featuredLabel: "FEATURED DOCUMENT",
    indexLabel: "TECHNICAL INDEX",
    calcLink: "→ Analysis & Calculations Portal",
    gridLabel: "ALL ANALYSES",
    adSponsor: "SPONSOR PLACEMENT",
    adSponsorGrid: "SPONSOR IN-GRID",
    adBottom: "SPONSOR BOTTOM DISPLAY",
  },
};

export default function BlogHome() {
  const [lang, setLang] = useState("tr");
  const [allPosts, setAllPosts] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kullanıcı manuel çıkış yapmadıysa (geçerli JWT token varsa) derhal Oxypace Portal'a geçiş yap
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const isCleanToken = token && 
        token !== "null" && 
        token !== "undefined" && 
        token !== "false" && 
        typeof token === 'string' &&
        token.trim().length > 20;

      if (isCleanToken) {
        window.location.replace("/messages");
      }
    } catch (_) {}
  }, []);

  // Dinamik makaleleri API'den çek
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const apiUrl = typeof window !== 'undefined'
          ? (window.location.origin.includes('localhost') ? 'http://localhost:5000/api/blog' : '/api/blog')
          : '/api/blog';
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // MongoDB `_id` alanını `id` veya `_id` şeklinde eşle
            const formatted = data.map(p => ({
              ...p,
              id: p._id || p.id
            }));
            setAllPosts(formatted);
          } else {
            setAllPosts(staticPosts);
          }
        } else {
          setAllPosts(staticPosts);
        }
      } catch (e) {
        console.error('API blog posts fetch error, fallback to static:', e);
        setAllPosts(staticPosts);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const T = HERO_TEXT[lang];

  if (loading || !allPosts) {
    return (
      <div className="relative min-h-screen transition-theme" style={{ color: "var(--foreground)" }}>
        <Header isArticle={false} lang={lang} onLangChange={setLang} />
        <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-12">
            <div className="space-y-4">
              <div className="h-6 w-48 bg-white/5 rounded-full border border-white/10" />
              <div className="h-20 w-full max-w-2xl bg-white/5 rounded-2xl border border-white/10" />
              <div className="h-12 w-full max-w-xl bg-white/5 rounded-xl border border-white/10" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
              <div className="lg:col-span-8 h-[450px] bg-white/5 rounded-2xl border border-white/10" />
              <div className="lg:col-span-4 h-[450px] bg-white/5 rounded-2xl border border-white/10" />
            </div>
          </div>
        </main>
        <Footer lang={lang} />
      </div>
    );
  }

  const featuredPost = allPosts[0] || staticPosts[0];
  const indexPosts   = allPosts.length > 1 ? allPosts.slice(1, 3) : staticPosts.slice(1, 3);
  const gridPosts    = allPosts.length > 3 ? allPosts.slice(3) : (allPosts.length > 1 ? allPosts.slice(1) : staticPosts.slice(3));

  return (
    <div className="relative min-h-screen transition-theme" style={{ color: "var(--foreground)" }}>
      {/* ── Cosmic background mesh (fixed, pointer-events:none) ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-15%", left: "-10%",
          width: "700px", height: "700px", borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.055) 0%, transparent 65%)",
          filter: "blur(40px)",
          animation: "mesh-drift 25s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "35%", right: "-20%",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.045) 0%, transparent 65%)",
          filter: "blur(60px)",
          animation: "mesh-drift 32s ease-in-out infinite reverse",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", left: "25%",
          width: "800px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(14,165,233,0.035) 0%, transparent 65%)",
          filter: "blur(80px)",
          animation: "mesh-drift 40s ease-in-out infinite",
          animationDelay: "-10s",
        }} />
      </div>

      {/* Content above mesh */}
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* Reading progress */}
      <ReadingProgressBar />

      {/* Header — owns lang state via callback */}
      <Header isArticle={false} lang={lang} onLangChange={setLang} />

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section
        className="relative py-20 animate-fade-in-up"
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ border: "1px solid var(--border-color)", background: "var(--glass-bg)", color: "var(--foreground-muted)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full inline-block"
              style={{ background: "var(--foreground-subtle)", animation: "ping-soft 2s ease infinite" }}
            />
            {T.badge}
          </div>

          <div className="max-w-3xl">
            <h1
              className="font-black uppercase leading-[0.95] animate-fade-in-up-delay-1"
              style={{ fontSize: "clamp(3rem,8vw,6rem)", letterSpacing: "-0.05em", color: "var(--foreground)" }}
            >
              {T.title[0]}<br />{T.title[1]}
            </h1>
            <p
              className="mt-6 text-base leading-relaxed max-w-2xl animate-fade-in-up-delay-2"
              style={{ color: "var(--foreground-muted)" }}
            >
              {T.sub}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          MAIN
      ══════════════════════════════════════ */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

        {/* AdSense top */}
        <AdPlaceholder label={T.adSponsor} size="728×90" mb className="mb-12" />

        {/* ── ASYMMETRIC GRID 8/4 ── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 mb-20 animate-fade-in-up-delay-1">

          {/* Left — featured hero */}
          <div className="lg:col-span-8">
            <SectionLabel dot="accent">{T.featuredLabel}</SectionLabel>
            <FeaturedCard post={featuredPost} lang={lang} />
          </div>

          {/* Right — vertical index */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <SectionLabel dot="muted">{T.indexLabel}</SectionLabel>

            {/* Index panel */}
            <div
              className="glass-card rounded-xl p-4 flex-1"
            >
              {indexPosts.map((p) => (
                <MinimalCard key={p.id} post={p} lang={lang} />
              ))}
            </div>

            {/* Calculations portal link */}
            <a
              href="/calculations"
              className="glass-card glass-card-hover rounded-xl p-4 font-mono text-[11px] uppercase tracking-widest flex items-center justify-between"
              style={{ color: "var(--foreground-muted)", textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--foreground-muted)"; }}
            >
              <span>📊 {T.calcLink}</span>
            </a>

            {/* AdSense in-grid */}
            <AdPlaceholder label={T.adSponsorGrid} size="300×250" />
          </div>
        </div>

        {/* ── ALL ARTICLES — VISUAL GRID 3 col (new posts only) ── */}
        <section className="mb-20 animate-fade-in-up-delay-2">
          <SectionLabel dot="muted">{T.gridLabel}</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            {gridPosts.map((p) => (
              <GridCard key={p.id} post={p} lang={lang} />
            ))}
          </div>
        </section>

        {/* ── Reference Brands Grid (Desktop: 4 columns, Mobile: 2 columns side-by-side) ── */}
        <section className="mb-16">
          <SectionLabel dot="accent">
            {lang === "en" ? "GLOBAL SCIENCE & TECH PARTNERS" : "REFERANS VE İŞ ORTAKLIĞI KURUMLARI"}
          </SectionLabel>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 glass-card rounded-2xl">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 text-center">
              <span className="text-sm font-extrabold tracking-wider" style={{ color: "var(--foreground)" }}>CERN</span>
              <span className="text-[10px] mt-1 opacity-60">Fizik Araştırmaları</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 text-center">
              <span className="text-sm font-extrabold tracking-wider" style={{ color: "var(--foreground)" }}>NASA</span>
              <span className="text-[10px] mt-1 opacity-60">Uzay Lab.</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 text-center">
              <span className="text-sm font-extrabold tracking-wider" style={{ color: "var(--foreground)" }}>ESA</span>
              <span className="text-[10px] mt-1 opacity-60">Avrupa Uzay Ajansı</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 text-center">
              <span className="text-sm font-extrabold tracking-wider" style={{ color: "var(--foreground)" }}>MIT</span>
              <span className="text-[10px] mt-1 opacity-60">Teknoloji Enst.</span>
            </div>
          </div>
        </section>

        {/* ── QUOTE CARDS ── */}
        <section className="mb-20">
          <QuoteCards lang={lang} />
        </section>

        {/* AdSense bottom */}
        <AdPlaceholder label={T.adBottom} size="970×90" />
      </main>

      <Footer lang={lang} />
      <CookieConsent lang={lang} />
      </div>{/* end z-index wrapper */}
    </div>
  );
}

/* ──────── Helper sub-components ──────── */

function SectionLabel({ children, dot = "muted" }) {
  return (
    <div
      className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest mb-4"
      style={{ color: "var(--foreground-muted)" }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full inline-block"
        style={{ background: dot === "accent" ? "var(--accent)" : "var(--foreground-subtle)" }}
      />
      {children}
    </div>
  );
}

function AdPlaceholder({ label, size, mb }) {
  return (
    <div
      className={`py-6 px-4 text-center rounded-xl transition-all border-2 border-dashed border-zinc-300 dark:border-zinc-800 glass-card flex flex-col items-center justify-center min-h-[140px] ${mb ? "mb-12" : ""}`}
    >
      <span 
        className="text-[10px] font-bold tracking-[0.25em] text-zinc-400 dark:text-zinc-650 uppercase mb-4 block"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        // ADVERTISEMENT SPACE //
      </span>
      <div
        className="w-full max-w-[728px] h-[64px] border border-dashed border-zinc-200 dark:border-zinc-900 rounded-lg flex items-center justify-center transition-all bg-white/40 dark:bg-black/20"
      >
        <span 
          className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-450"
          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
        >
          {label} ({size})
        </span>
      </div>
    </div>
  );
}

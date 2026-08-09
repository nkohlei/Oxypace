"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function BlogHomeContent() {
  const [lang, setLang] = useState("tr");
  const [allPosts, setAllPosts] = useState(null);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const categoryParam = searchParams ? searchParams.get("category") : null;

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

  // Filter posts if categoryParam is set
  const filteredPosts = categoryParam
    ? allPosts.filter((p) => {
        if (!p.category) return false;
        const pCat = p.category.toLowerCase().trim();
        const target = categoryParam.toLowerCase().trim();
        return pCat.includes(target) || target.includes(pCat);
      })
    : allPosts;

  const isFiltered = !!categoryParam;
  const featuredPost = filteredPosts[0] || allPosts[0];
  const indexPosts   = filteredPosts.length > 1 ? filteredPosts.slice(1, 3) : allPosts.slice(1, 3);
  const gridPosts    = filteredPosts.length > 3 ? filteredPosts.slice(3) : (filteredPosts.length > 1 ? filteredPosts.slice(1) : allPosts.slice(1));

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

        {/* Category Active Filter Bar */}
        {isFiltered && (
          <div className="mb-10 p-5 rounded-2xl glass-card border border-sky-500/30 bg-sky-500/10 flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-sky-400 font-bold uppercase tracking-widest">
                {lang === "en" ? "ACTIVE CATEGORY:" : "SEÇİLİ KATEGORİ:"}
              </span>
              <span className="text-sm font-extrabold text-white px-3.5 py-1 rounded-xl bg-sky-500/20 border border-sky-500/40">
                {categoryParam}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                ({filteredPosts.length} {lang === "en" ? "articles found" : "makale bulundu"})
              </span>
            </div>
            <a
              href="/blog"
              className="text-xs font-bold text-sky-400 hover:text-white transition-colors underline font-mono uppercase tracking-wider"
            >
              {lang === "en" ? "Show All Articles ✕" : "Tüm Makaleleri Göster ✕"}
            </a>
          </div>
        )}

        {/* AdSense top */}
        <AdPlaceholder label={T.adSponsor} size="728×90" mb className="mb-12" />

        {/* ── ASYMMETRIC GRID 8/4 ── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 mb-20 animate-fade-in-up-delay-1">

          {/* Left — featured hero */}
          <div className="lg:col-span-8">
            <SectionLabel dot="accent">
              {isFiltered ? `${categoryParam} - ${T.featuredLabel}` : T.featuredLabel}
            </SectionLabel>
            {featuredPost ? (
              <FeaturedCard post={featuredPost} lang={lang} />
            ) : (
              <div className="p-8 glass-card rounded-2xl text-center text-slate-400 text-sm">
                Bu kategoride henüz makale bulunmuyor.
              </div>
            )}
          </div>

          {/* Right — vertical index */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <SectionLabel dot="muted">{T.indexLabel}</SectionLabel>

            {/* Index panel */}
            <div className="glass-card rounded-xl p-4 flex-1">
              {indexPosts.length > 0 ? (
                indexPosts.map((p) => (
                  <MinimalCard key={p.id} post={p} lang={lang} />
                ))
              ) : (
                <div className="p-4 text-xs text-slate-400 text-center">İndeks makalesi bulunamadı</div>
              )}
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

        {/* ── ALL ARTICLES — VISUAL GRID 3 col ── */}
        <section className="mb-20 animate-fade-in-up-delay-2">
          <SectionLabel dot="muted">
            {isFiltered ? `${categoryParam} ${lang === "en" ? "ANALYSES" : "ANALİZLERİ"}` : T.gridLabel}
          </SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            {gridPosts.map((p) => (
              <GridCard key={p.id} post={p} lang={lang} />
            ))}
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

export default function BlogHome() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060913]" />}>
      <BlogHomeContent />
    </Suspense>
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
      <div className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-1">
        {label} [{size}]
      </div>
      <div className="text-xs opacity-30 font-sans">
        AdSense Responsive Ad Unit
      </div>
    </div>
  );
}

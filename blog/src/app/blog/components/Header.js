"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import SearchModal from "./SearchModal";

/* ── Left nav items (non-article pages) ── */
const LEFT_NAV = [
  { key: "analyses", tr: "Analizler",  en: "Analyses",   href: "/blog" },
  { key: "calculations", tr: "Hesaplama Araçları", en: "Calculation Tools", href: "/calculations" },
];

/* ── Modules dropdown entries ── */
const MODULES_ITEMS = [
  { icon: "🌌", key: "physics",   tr: "Teorik Fizik",           en: "Theoretical Physics",       href: "/blog" },
  { icon: "🚀", key: "cosmo",     tr: "Kozmoloji & Uzay",        en: "Cosmology & Space",         href: "/blog" },
  { icon: "🏔️", key: "extreme",   tr: "Ekstrem Doğa Fiziği",    en: "Extreme Adventure",         href: "/blog" },
  { icon: "⚫", key: "bh",        tr: "Kozmik Simülatör",        en: "Cosmic Simulator",          href: "/calculations" },
  { icon: "📊", key: "alt",       tr: "İrtifa Hesaplayıcı",      en: "Altitude Calculator",       href: "/calculations" },
];

const NAV_LABELS = {
  tr: { modules: "Modüller", back: "← Geri Dön" },
  en: { modules: "Modules",  back: "← Go Back"  },
};

export default function Header({ isArticle = false, lang = "tr", onLangChange }) {
  const [theme,          setTheme]          = useState("dark");
  const [scrolled,       setScrolled]       = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const dropdownRef = useRef(null);
  const t = NAV_LABELS[lang] || NAV_LABELS.tr;

  /* Initialise theme from localStorage */
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  /* Scroll listener */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!dropdownOpen) return;
    const h = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [dropdownOpen]);

  /* ESC closes search */
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") setSearchOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  const toggleLang = () => {
    const next = lang === "tr" ? "en" : "tr";
    onLangChange?.(next);
  };

  return (
    <>
      <header
        className="glass-nav sticky top-0 z-40 w-full transition-theme"
        style={{
          borderBottom: scrolled
            ? "1px solid var(--border-color)"
            : "1px solid transparent",
          boxShadow: scrolled ? "var(--glass-shadow)" : "none",
        }}
      >
        <div className="mx-auto flex max-w-7xl h-15 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4"
          style={{ height: "60px" }}>

        {/* ── LEFT SECTION: Logo ── */}
          <div className="flex items-center gap-1">
            {/* Logo */}
            <Link href="/blog" className="flex items-center shrink-0 mr-2 md:mr-4">
              {/* Point dot — visible only on desktop */}
              <span className="hidden md:flex relative h-1.5 w-1.5 mr-2.5" style={{ flexShrink: 0 }}>
                <span className="absolute inline-flex h-full w-full rounded-full"
                  style={{ background: "var(--foreground-muted)", animation: "ping-soft 2s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.6 }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                  style={{ background: "var(--foreground-muted)" }} />
              </span>

              {/* Desktop Logo: Single line */}
              <span className="hidden md:inline-block" style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--foreground)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                EVENT HORIZON
              </span>

              {/* Mobile Logo: Stacked vertically, aligned left */}
              <div className="flex md:hidden flex-col leading-none" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                <span style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--foreground)" }}>EVENT</span>
                <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--foreground-muted)", marginTop: "1px" }}>HORIZON</span>
              </div>
            </Link>

            {/* Left nav — hidden on mobile */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
              {LEFT_NAV.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="px-2 sm:px-3 py-1.5 rounded-lg font-semibold"
                  style={{
                    fontSize: "12px",
                    color: "var(--foreground-muted)",
                    textDecoration: "none",
                    transition: "background 0.2s, color 0.2s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-bg)"; e.currentTarget.style.color = "var(--foreground)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--foreground-muted)"; }}
                >
                  {lang === "en" ? item.en : item.tr}
                </Link>
              ))}

              {/* Modules dropdown — desktop only */}
              <div ref={dropdownRef} className="hidden md:block" style={{ position: "relative" }}>
                <button
                  id="modules-btn"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                  style={{
                    color: dropdownOpen ? "var(--foreground)" : "var(--foreground-muted)",
                    background: dropdownOpen ? "var(--glass-bg)" : "transparent",
                    fontSize: "12px", border: "none", cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-bg)"; e.currentTarget.style.color = "var(--foreground)"; }}
                  onMouseLeave={(e) => { if (!dropdownOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--foreground-muted)"; } }}
                >
                  {t.modules}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transition: "transform 0.2s ease", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="dropdown-menu" style={{ minWidth: "240px", left: 0, transform: "none" }}>
                    {MODULES_ITEMS.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span style={{ fontSize: "14px" }}>{item.icon}</span>
                        <span>{lang === "en" ? item.en : item.tr}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Back link — article page only, desktop only */}
            {isArticle && (
              <Link
                href="/blog"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg ml-2"
                style={{ fontSize: "12px", color: "var(--foreground-muted)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--foreground-muted)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                {t.back}
              </Link>
            )}
          </div>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Oxypace Platform Yolu Button — Desktop: "Oxypace Portal", Mobile: "Oxypace" */}
            <a
              href="/login"
              className="mercury-btn flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all"
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 35%, #94a3b8 70%, #e2e8f0 100%)",
                color: "#090d16",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(255, 255, 255, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.8), inset 0 -1px 2px rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                letterSpacing: "-0.01em",
                fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
              }}
            >
              <span className="hidden md:inline font-extrabold">Oxypace Portal</span>
              <span className="inline md:hidden font-extrabold text-[11px]">Oxypace</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>

            {/* Search button — Desktop only (Mobile gets floating search bar below) */}
            <button
              id="search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Ara"
              className="hidden md:flex items-center justify-center rounded-lg transition-theme"
              style={{
                width: "34px", height: "34px",
                border: "1px solid var(--border-color)",
                background: "transparent", cursor: "pointer",
                color: "var(--foreground-muted)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-bg)"; e.currentTarget.style.color = "var(--foreground)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--foreground-muted)"; e.currentTarget.style.borderColor = "var(--border-color)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            {/* Language toggle — Desktop: "TR / EN", Mobile: Only active "TR" or "EN" */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLang}
              aria-label="Dil Değiştir"
              className="flex items-center justify-center rounded-lg transition-theme"
              style={{
                height: "32px", padding: "0 8px",
                border: "1px solid var(--border-color)",
                background: "transparent", cursor: "pointer",
                color: "var(--foreground-muted)",
                fontSize: "11px", fontFamily: "var(--font-geist-mono), monospace",
                fontWeight: 700, letterSpacing: "0.04em",
              }}
            >
              <span className="hidden md:inline-flex items-center gap-1">
                <span style={{ opacity: lang === "tr" ? 1 : 0.4 }}>TR</span>
                <span style={{ color: "var(--border-hover)" }}>/</span>
                <span style={{ opacity: lang === "en" ? 1 : 0.4 }}>EN</span>
              </span>
              <span className="inline-flex md:hidden uppercase font-bold text-[11px]" style={{ color: "var(--foreground)" }}>
                {lang}
              </span>
            </button>

            {/* Theme toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Temayı Değiştir"
              className="flex items-center justify-center rounded-lg transition-theme"
              style={{
                width: "34px", height: "34px",
                border: "1px solid var(--border-color)",
                background: "transparent", cursor: "pointer",
                color: "var(--foreground-muted)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-bg)"; e.currentTarget.style.color = "var(--foreground)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--foreground-muted)"; e.currentTarget.style.borderColor = "var(--border-color)"; }}
            >
              {theme === "dark" ? (
                /* Sun */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                /* Moon */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile-Only Non-Fixed Search Bar (Expands Left with Backdrop Blur) ── */}
      <div className="flex md:hidden absolute top-[62px] right-3 z-30 items-center justify-end">
        {searchOpen ? (
          <>
            {/* Backdrop Blur Overlay when search is active */}
            <div
              className="fixed inset-0 z-20 transition-all duration-300"
              style={{
                background: "rgba(0, 0, 0, 0.45)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
              onClick={() => setSearchOpen(false)}
            />

            {/* Expanding Search Bar */}
            <div
              className="relative z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl shadow-2xl transition-all duration-300 w-[calc(100vw-24px)]"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(24px)",
                border: "1px solid var(--border-hover)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0" style={{ color: "var(--foreground-muted)" }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                autoFocus
                placeholder="Makale, konu veya içerik ara..."
                className="bg-transparent text-xs outline-none w-full font-medium"
                style={{ color: "var(--foreground)" }}
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-full text-xs font-bold shrink-0 opacity-70 hover:opacity-100"
                style={{ color: "var(--foreground)" }}
              >
                ✕
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Mobil Arama"
            className="flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
            style={{
              width: "36px", height: "36px",
              background: "var(--glass-bg)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border-hover)",
              color: "var(--foreground)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        )}
      </div>

      {/* Search modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        lang={lang}
      />
    </>
  );
}

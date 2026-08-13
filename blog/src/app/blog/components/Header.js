"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import SearchModal from "./SearchModal";
import { posts } from "../data/posts";
import { formatBlogImageUrl } from "../utils/imageHelper";

/* ── Left nav items (non-article pages) ── */
const LEFT_NAV = [
  { key: "analyses", tr: "Analizler",  en: "Analyses",   href: "/blog" },
  { key: "calculations", tr: "Hesaplama Araçları", en: "Calculation Tools", href: "/calculations" },
];

/* ── Categories dropdown entries ── */
const CATEGORIES_ITEMS = [
  { icon: "🌌", key: "physics",   tr: "Teorik Fizik",                      en: "Theoretical Physics",            href: "/blog?category=Teorik+Fizik" },
  { icon: "🚀", key: "cosmo",     tr: "Kozmoloji & Uzay",                   en: "Cosmology & Space",              href: "/blog?category=Kozmoloji" },
  { icon: "🏔️", key: "extreme",   tr: "Ekstrem Doğa Fiziği",               en: "Extreme Biophysics",             href: "/blog?category=Ekstrem+Do%C4%9Fa+Fizi%C4%9Fi" },
  { icon: "🧮", key: "calc",      tr: "Kozmik Simülatörler & Hesaplamalar", en: "Cosmic Simulators & Calculations", href: "/calculations" },
  { icon: "🌐", key: "all",       tr: "Tüm Kategoriler",                   en: "All Categories",                 href: "/blog" },
];

const NAV_LABELS = {
  tr: { categories: "Kategoriler", back: "← Geri Dön" },
  en: { categories: "Categories",  back: "← Go Back"  },
};

export default function Header({ isArticle = false, lang = "tr", onLangChange }) {
  const [theme,          setTheme]          = useState("dark");
  const [scrolled,       setScrolled]       = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const dropdownRef = useRef(null);
  const t = NAV_LABELS[lang] || NAV_LABELS.tr;

  const [allPosts, setAllPosts] = useState([]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const apiUrl =
          typeof window !== "undefined"
            ? window.location.origin.includes("localhost")
              ? "http://localhost:5000/api/blog"
              : "/api/blog"
            : "/api/blog";
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAllPosts(data.map(p => ({ ...p, id: p._id || p.id })));
          } else {
            setAllPosts(posts);
          }
        } else {
          setAllPosts(posts);
        }
      } catch (e) {
        setAllPosts(posts);
      }
    };
    loadPosts();
  }, []);

  const normalizeStr = (text = "") =>
    text
      .toString()
      .toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .trim();

  const normQuery = normalizeStr(searchQuery);

  const filteredPosts = normQuery === ""
    ? []
    : allPosts.filter(p =>
        normalizeStr(p.title || "").includes(normQuery) ||
        normalizeStr(p.excerpt || "").includes(normQuery) ||
        normalizeStr(p.category || "").includes(normQuery) ||
        normalizeStr(p.content || "").includes(normQuery)
      );

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

  /* Strict Body & HTML Scroll Lock when search is active (Desktop & Mobile) */
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    if (searchOpen || mobileSearchOpen) {
      htmlEl.style.overflow = "hidden";
      bodyEl.style.overflow = "hidden";
      bodyEl.style.touchAction = "none";
    } else {
      htmlEl.style.overflow = "";
      bodyEl.style.overflow = "";
      bodyEl.style.touchAction = "";
    }

    return () => {
      htmlEl.style.overflow = "";
      bodyEl.style.overflow = "";
      bodyEl.style.touchAction = "";
    };
  }, [searchOpen, mobileSearchOpen]);

  /* ESC closes search */
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { setSearchOpen(false); setMobileSearchOpen(false); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    localStorage.setItem("theme_mode", next);
    setTheme(next);
  };

  const toggleLang = () => {
    const next = lang === "tr" ? "en" : "tr";
    onLangChange?.(next);
  };

  return (
    <>
      <style jsx global>{`
        @media (min-width: 769px) {
          .desktop-header-only { display: flex !important; }
          .mobile-header-only { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-header-only { display: none !important; }
          .mobile-header-only { display: flex !important; }
        }
      `}</style>

      <header
        className="glass-nav sticky top-0 z-40 w-full transition-theme"
        style={{
          borderBottom: scrolled
            ? "1px solid var(--border-color)"
            : "1px solid transparent",
          boxShadow: scrolled ? "var(--glass-shadow)" : "none",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          style={{ height: "60px" }}>

          {/* =========================================================
              1) DESKTOP HEADER (Visible > 768px)
             ========================================================= */}
          <div className="desktop-header-only items-center justify-between w-full">
            {/* Desktop Left */}
            <div className="flex items-center gap-1">
              <Link href="/blog" className="flex items-center gap-2.5 shrink-0 mr-4">
                <span className="relative flex h-1.5 w-1.5" style={{ flexShrink: 0 }}>
                  <span className="absolute inline-flex h-full w-full rounded-full"
                    style={{ background: "var(--foreground-muted)", animation: "ping-soft 2s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.6 }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                    style={{ background: "var(--foreground-muted)" }} />
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--foreground)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                  EVENT HORIZON
                </span>
              </Link>

              <nav className="flex items-center gap-1 sm:gap-2">
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

                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    id="categories-btn"
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
                    {t.categories}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      style={{ transition: "transform 0.2s ease", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="dropdown-menu" style={{ minWidth: "240px", left: 0, transform: "none" }}>
                      {CATEGORIES_ITEMS.map((item) => (
                        <a
                          key={item.key}
                          href={item.href}
                          className="dropdown-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <span style={{ fontSize: "14px" }}>{item.icon}</span>
                          <span>{lang === "en" ? item.en : item.tr}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              {isArticle && (
                <Link
                  href="/blog"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg ml-2"
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

            {/* Desktop Right */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  try {
                    const token = localStorage.getItem("token");
                    const isLoggedIn = token &&
                      token !== "null" &&
                      token !== "undefined" &&
                      token !== "false" &&
                      typeof token === "string" &&
                      token.trim().length > 20;
                    window.location.href = isLoggedIn ? "/messages" : "/login";
                  } catch (_) {
                    window.location.href = "/login";
                  }
                }}
                className="mercury-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all"
                style={{
                  background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 35%, #94a3b8 70%, #e2e8f0 100%)",
                  color: "#090d16",
                  boxShadow: "0 4px 14px rgba(255, 255, 255, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.8), inset 0 -1px 2px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  letterSpacing: "-0.01em",
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                  cursor: "pointer",
                }}
              >
                <span className="font-extrabold">Oxypace Portal</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>

              <button
                id="search-btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Ara"
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>

              <button
                id="lang-toggle-btn"
                onClick={toggleLang}
                aria-label="Dil Değiştir"
                className="flex items-center gap-1 rounded-lg transition-theme"
                style={{
                  height: "34px", padding: "0 10px",
                  border: "1px solid var(--border-color)",
                  background: "transparent", cursor: "pointer",
                  color: "var(--foreground-muted)",
                  fontSize: "11px", fontFamily: "var(--font-geist-mono), monospace",
                  fontWeight: 600, letterSpacing: "0.04em",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-bg)"; e.currentTarget.style.color = "var(--foreground)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--foreground-muted)"; e.currentTarget.style.borderColor = "var(--border-color)"; }}
              >
                <span style={{ opacity: lang === "tr" ? 1 : 0.4, transition: "opacity 0.3s" }}>TR</span>
                <span style={{ color: "var(--border-hover)" }}>/</span>
                <span style={{ opacity: lang === "en" ? 1 : 0.4, transition: "opacity 0.3s" }}>EN</span>
              </button>

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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* =========================================================
              2) MOBILE HEADER (Visible <= 768px)
             ========================================================= */}
          <div className="mobile-header-only items-center justify-between w-full">
            <Link href="/blog" className="flex items-center shrink-0">
              <div className="flex flex-col leading-none" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                <span style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--foreground)" }}>EVENT</span>
                <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--foreground-muted)", marginTop: "1px" }}>HORIZON</span>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href="/login"
                className="mercury-btn flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all"
                style={{
                  background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 35%, #94a3b8 70%, #e2e8f0 100%)",
                  color: "#090d16",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(255, 255, 255, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.8), inset 0 -1px 2px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
                }}
              >
                <span className="font-extrabold text-[11px]">Oxypace</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>

              <button
                id="mobile-lang-btn"
                onClick={toggleLang}
                className="flex items-center justify-center rounded-lg transition-theme"
                style={{
                  height: "30px", padding: "0 7px",
                  border: "1px solid var(--border-color)",
                  background: "transparent", cursor: "pointer",
                  color: "var(--foreground)",
                  fontSize: "11px", fontFamily: "var(--font-geist-mono), monospace",
                  fontWeight: 700,
                }}
              >
                <span className="uppercase font-bold text-[11px]">{lang}</span>
              </button>

              {/* Mobile Theme Toggle — Identical full SVG icon set as desktop */}
              <button
                id="mobile-theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Temayı Değiştir"
                className="flex items-center justify-center rounded-lg transition-theme"
                style={{
                  width: "32px", height: "32px",
                  border: "1px solid var(--border-color)",
                  background: "transparent", cursor: "pointer",
                  color: "var(--foreground-muted)",
                }}
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
        </div>
      </header>

      {/* Mobile Floating Search Bar */}
      <div className="mobile-header-only absolute top-[62px] right-3 z-30 items-center justify-end">
        {mobileSearchOpen ? (
          <>
            <div
              className="fixed inset-0 z-20 transition-all duration-300"
              style={{
                background: "rgba(0, 0, 0, 0.45)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                touchAction: "none",
              }}
              onTouchMove={(e) => e.preventDefault()}
              onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); }}
            />

            <div className="flex flex-col gap-2 w-[calc(100vw-24px)]">
              <div
                className="relative z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl shadow-2xl transition-all duration-300 w-full"
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Makale, konu veya içerik ara..."
                  className="bg-transparent text-xs outline-none w-full font-medium"
                  style={{ color: "var(--foreground)" }}
                />
                <button
                  onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); }}
                  className="p-1 rounded-full text-xs font-bold shrink-0 opacity-70 hover:opacity-100"
                  style={{ color: "var(--foreground)" }}
                >
                  ✕
                </button>
              </div>

              {searchQuery.trim() !== "" && (
                <div
                  className="relative z-30 flex flex-col rounded-2xl p-2 max-h-72 overflow-y-auto shadow-2xl"
                  style={{
                    background: "var(--glass-bg)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid var(--border-hover)",
                  }}
                >
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                      <Link
                        key={post.id || post.slug}
                        href={`/blog/post?slug=${post.slug}`}
                        onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); }}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                        style={{ borderBottom: "1px solid var(--border-color)", textDecoration: "none" }}
                      >
                        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="badge-category text-[9px] px-1.5 py-0.5 rounded font-semibold">{post.category || "Teorik Fizik"}</span>
                            {post.readTime && <span className="text-[10px]" style={{ color: "var(--foreground-subtle)" }}>{post.readTime}</span>}
                          </div>
                          <span className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{post.title}</span>
                          {post.excerpt && <span className="text-[10px] line-clamp-1 opacity-70" style={{ color: "var(--foreground-muted)" }}>{post.excerpt}</span>}
                        </div>
                        <div className="w-14 h-11 rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/10 flex items-center justify-center">
                          <img
                            src={formatBlogImageUrl(post.image)}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80";
                            }}
                          />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs" style={{ color: "var(--foreground-muted)" }}>
                      Eşleşen makale bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={() => setMobileSearchOpen(true)}
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

      {/* Desktop Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        lang={lang}
      />
    </>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import OxypaceBackground from "./OxypaceBackground";
import "./oxypace-home.css";

export default function OxypaceHomePage() {
  const [activeShowcase, setActiveShowcase] = useState("watch-party");
  const [timerKey, setTimerKey] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const timerRef = useRef(null);

  const showcases = [
    {
      id: "watch-party",
      title: "Birlikte Film İzle",
      subtitle: "Milisaniyelik eşzamanlama ve sıfır desenkron ile sinema keyfi.",
      image: "/onboarding-showcase/slide-3-watch-party.webp",
      alt: "Oxypace Birlikte Film İzleme ve Watch Party Arayüzü",
      badge: "Sıfır Gecikmeli Canlı Oynatıcı",
    },
    {
      id: "portals",
      title: "Kendi Portalını Kur",
      subtitle: "Sınırsız kanal, ses odaları ve gelişmiş yetkilendirme.",
      image: "/onboarding-showcase/slide-1-portal.webp",
      alt: "Oxypace Portallar ve Kanal Hiyerarşisi Arayüzü",
      badge: "Özelleştirilebilir Topluluk Portalı",
    },
    {
      id: "posts",
      title: "Topluluk Akışı",
      subtitle: "Görseller, tartışma başlıkları ve anlık canlı etkileşim.",
      image: "/onboarding-showcase/slide-2-post.webp",
      alt: "Oxypace Gönderi ve Etkileşim Duvarı",
      badge: "Canlı Akış ve Sosyal Katılım",
    },
    {
      id: "network",
      title: "Küresel Bağlantı Ağı",
      subtitle: "Dünyanın her yerinden üyelerle düşük gecikmeli WebRTC odaları.",
      image: "/onboarding-showcase/slide-4-globe.webp",
      alt: "Oxypace Küresel Ağ ve Canlı Odalar",
      badge: "WebRTC Düşük Gecikme Altyapısı",
    },
  ];

  // Auto-rotating timer with 4.5 seconds per card and reset on manual selection
  useEffect(() => {
    const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setActiveShowcase((prev) => {
          const currentIndex = showcases.findIndex((s) => s.id === prev);
          const nextIndex = (currentIndex + 1) % showcases.length;
          return showcases[nextIndex].id;
        });
        setTimerKey((k) => k + 1);
      }, 4500);
    };

    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showcases.length]);

  const handleManualTabClick = (id) => {
    setActiveShowcase(id);
    setTimerKey((k) => k + 1);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveShowcase((prev) => {
        const currentIndex = showcases.findIndex((s) => s.id === prev);
        const nextIndex = (currentIndex + 1) % showcases.length;
        return showcases[nextIndex].id;
      });
      setTimerKey((k) => k + 1);
    }, 4500);
  };

  // Scroll detection for enhanced silver glow on floating navigation
  useEffect(() => {
    let ticking = false;
    let lastState = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
          if (scrolled !== lastState) {
            lastState = scrolled;
            setIsScrolled(scrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const currentShowcase = showcases.find((s) => s.id === activeShowcase) || showcases[0];

  return (
    <div className="oxypace-landing relative">
      {/* 120 FPS Vivid-Color Cursor-Responsive Canvas Background */}
      <OxypaceBackground />

      {/* =========================================================================
          1. NAVIGATION:
          - Mobile: Always visible full-width frosted glass header bar across the top
          - Desktop: Floating container matched to content max-width (pulled inward),
                     silvery rectangular frame, 3D logo silhouette contour, and matching "Giriş Yap" button
          ========================================================================= */}

      {/* MOBILE HEADER BAR (Full-width frosted header bar, never hidden) */}
      <header className="md:hidden oxy-mobile-header-bar">
        <Link href="/" className="oxy-silver-rect-frame h-10 px-2" title="Oxypace Anasayfa">
          <div className="relative flex items-center justify-center w-8 h-8">
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={34}
              className="oxy-logo-silhouette-layer object-contain"
            />
            <Image
              src="/logo.png"
              alt="Oxypace"
              width={22}
              height={22}
              className="relative z-10 w-[22px] h-[22px] object-contain"
              priority
            />
          </div>
        </Link>
        <Link
          href="/login"
          className="oxy-nav-btn h-10 px-4 text-xs font-bold"
        >
          Giriş Yap
        </Link>
      </header>

      {/* DESKTOP FLOATING NAVIGATION (Hidden on mobile, aligned to max-w-6xl content width) */}
      <div className="hidden md:block fixed top-6 inset-x-0 z-50 pointer-events-none">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 flex items-center justify-between">
          {/* Left: Silvery Rectangular Frame with Logo Silhouette behind Original Logo */}
          <div className="pointer-events-auto">
            <Link
              href="/"
              className={`oxy-silver-rect-frame group ${isScrolled ? "scrolled" : ""}`}
              title="Oxypace Anasayfa"
            >
              <div className="relative flex items-center justify-center w-10 h-10">
                {/* 3D Silvery Logo Silhouette in Logo Shape */}
                <Image
                  src="/logo.png"
                  alt=""
                  width={42}
                  height={42}
                  className="oxy-logo-silhouette-layer object-contain transition-transform duration-300 group-hover:scale-105"
                />
                {/* Original Smaller Logo in Front */}
                <Image
                  src="/logo.png"
                  alt="Oxypace"
                  width={26}
                  height={26}
                  className="relative z-10 w-[26px] h-[26px] object-contain transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Right: Matching Height and Silver Styling Giriş Yap Button */}
          <div className="pointer-events-auto">
            <Link
              href="/login"
              className={`oxy-nav-btn ${isScrolled ? "scrolled" : ""}`}
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. HERO SECTION (Minimalist, Punchy, High Impact)
          ========================================================================= */}
      <section className="relative z-10 pt-28 sm:pt-36 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        {/* Master Headline in Outfit Font & Liquid Mercury Gradient */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.04] mb-6 max-w-5xl mx-auto">
          <span className="block text-white">TOPLULUK KUR.</span>
          <span className="block oxy-text-mercury mt-2">BİRLİKTE FİLM İZLE.</span>
        </h1>

        {/* Short, Clean Subtitle */}
        <p className="max-w-xl mx-auto text-base sm:text-lg md:text-xl text-slate-300/90 font-normal leading-relaxed mb-10">
          Arkadaşlarınla kendi portalını oluştur, kristal netliğinde sesli odalarda sıfır gecikmeyle birlikte film izle.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            href="/login"
            className="oxy-btn-mercury w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm sm:text-base font-bold shadow-2xl flex items-center justify-center gap-2 group"
          >
            <span>Web&apos;de Hemen Başla</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href="/downloads/oxypace.apk"
            className="oxy-btn-mercury-ghost w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.8559 8.1 12 8.1s-3.5902.311-5.1368.8504L4.8409 5.4474a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.784h24c-.3432-4.1251-2.6889-7.5973-6.1185-9.4626" />
            </svg>
            <span>Android APK</span>
          </a>
        </div>

        {/* =========================================================================
            3. REAL VISUAL SHOWCASE: 4 AUTO-ROTATING TABS WITH PROGRESS BAR ANIMATION
            ========================================================================= */}
        <div className="max-w-5xl mx-auto">
          {/* Interactive Navigation Tabs with Duration Progress Bar Animation */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6 max-w-fit mx-auto">
            {showcases.map((tab) => {
              const isActive = activeShowcase === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleManualTabClick(tab.id)}
                  className={`oxy-tab-pill text-xs sm:text-sm ${isActive ? "active" : ""}`}
                >
                  <span className="relative z-10">{tab.title}</span>
                  {isActive && (
                    <div
                      key={`timer-pill-${tab.id}-${timerKey}`}
                      className="oxy-tab-timer-line"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Visual Showcase Frame with Timeline Bar & High-Res Screenshots */}
          <div className="oxy-showcase-frame text-left">
            {/* Top Animated Timeline Bar for the 4.5s duration */}
            <div
              key={`showcase-bar-${activeShowcase}-${timerKey}`}
              className="oxy-showcase-timer-bar"
            />

            <div className="px-4 sm:px-5 py-3.5 bg-[#090A0D] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" />
                <span className="ml-2 text-xs font-mono text-slate-300">
                  {currentShowcase.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
                <span className="hidden sm:inline">Canlı Senkronizasyon</span>
              </div>
            </div>

            {/* High-Resolution Screenshot */}
            <div className="relative aspect-[16/9] sm:aspect-[16/8.5] w-full bg-[#050608] overflow-hidden group">
              <Image
                key={currentShowcase.id}
                src={currentShowcase.image}
                alt={currentShowcase.alt}
                fill
                priority
                className="object-contain object-top p-2 sm:p-4 transition-transform duration-500 group-hover:scale-[1.01]"
              />

              {/* Bottom Subtle Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {currentShowcase.title}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md">
                    {currentShowcase.subtitle}
                  </p>
                </div>
                <Link
                  href="/login"
                  className="oxy-btn-mercury px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                >
                  Dene →
                </Link>
              </div>
            </div>
          </div>

          {/* =========================================================================
              EVENT HORIZON CARD (Directly below the 4 showcase cards as requested)
              ========================================================================= */}
          <div className="mt-8 p-6 sm:p-7 rounded-2xl bg-[#090A0E]/85 border border-white/20 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-left shadow-2xl hover:border-white/40 transition-all duration-300">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[11px] font-mono uppercase tracking-widest text-slate-300 mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
                OXYPACE EKOSİSTEMİ // BİLİM ARŞİVİ
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                EVENT HORIZON — Bağımsız Popüler Bilim & Astrofizik Portalı
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                Evrenin fizik sınırları, kara delikler ve uzay-zaman geometrisi üzerine interaktif makale ve simülasyon arşivi. Oxypace topluluğunun bağımsız bilim alanı.
              </p>
            </div>
            <Link
              href="/blog"
              className="oxy-btn-mercury-ghost px-6 py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap hover:scale-105 transition-transform"
            >
              EVENT HORIZON&apos;a Git →
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. MINIMALIST CORE PILLARS (3 Clean Cards, Zero Emojis)
          ========================================================================= */}
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pillar 1 */}
          <div className="oxy-card-mercury p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 text-white">
                <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Birlikte Film İzle</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Buffer senkronizasyonu ile arkadaşlarınla aynı anda başlat, durdur ve kesintisiz izle.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="oxy-card-mercury p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 text-white">
                <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Özel Portallar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kendi kurallarını koyduğun, sınırsız ses ve metin kanallarına sahip bağımsız alanlar kur.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="oxy-card-mercury p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 text-white">
                <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Kristal Netliğinde Ses</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                WebRTC tabanlı düşük gecikmeli, gürültü filtreli ve arka planda çalışan ses motoru.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BIG FULL-WIDTH MULTI-LOGO BANNER (Ultra-Crisp 3072px Lanczos HD, Zero Blurriness)
          ========================================================================= */}
      <section className="relative z-10 oxy-banner-container mt-10">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-center">
          <Image
            src="/oxypace-multi-banner-hd.webp"
            alt="Oxypace Logo Varyasyonları ve Kimliği"
            width={3072}
            height={1014}
            className="oxy-banner-image select-none pointer-events-none"
            priority
            unoptimized
          />
        </div>
      </section>

      {/* =========================================================================
          6. MINIMALIST FOOTER
          ========================================================================= */}
      <footer className="relative z-10 border-t border-white/10 bg-black py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wider">OXYPACE</span>
            <span>—</span>
            <span>© 2026 Tüm hakları saklıdır.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <Link href="/login" className="hover:text-white transition-colors">
              Giriş
            </Link>
            <a href="/downloads/oxypace.apk" className="hover:text-white transition-colors">
              Android APK
            </a>
            <Link href="/blog" className="hover:text-white transition-colors">
              EVENT HORIZON
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Gizlilik
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Şartlar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

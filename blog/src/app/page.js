"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import OxypaceBackground from "./OxypaceBackground";
import "./oxypace-home.css";

export default function OxypaceHomePage() {
  const [activeShowcase, setActiveShowcase] = useState("watch-party");
  const [timerKey, setTimerKey] = useState(0);
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
  // Oturum açıkken kullanıcı ana sayfaya girdiğinde anında portalına/mesajlarına yönlendir
  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      const isLoggedIn = t && t !== 'null' && t !== 'undefined' && t !== 'false' && typeof t === 'string' && t.trim().length > 10;
      if (isLoggedIn) {
        const topPortal = localStorage.getItem('oxypace_top_portal');
        if (topPortal) {
          try {
            const parsed = JSON.parse(topPortal);
            if (parsed && parsed.id) {
              window.location.replace('/portal/' + parsed.id);
              return;
            }
          } catch (_) {}
        }
        window.location.replace('/messages');
      }
    } catch (_) {}
  }, []);

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

  const currentShowcase = showcases.find((s) => s.id === activeShowcase) || showcases[0];

  return (
    <div className="oxypace-landing relative">
      {/* 120 FPS Vivid-Color Cursor-Responsive Canvas Background */}
      <OxypaceBackground />

      {/* =========================================================================
          1. PERMANENT FLOATING NAVIGATION:
          - Logo is centered in the left margin corridor (between screen edge and 1024px content)
          - Giriş Yap is centered in the right margin corridor
          - Permanently visible across entire scroll with zero collision
          ========================================================================= */}
      <div className="oxy-nav-left-corridor">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center transition-transform hover:scale-105"
          title="Oxypace Anasayfa"
        >
          <Image
            src="/oxypace-ice-logo.png"
            alt="Oxypace"
            width={56}
            height={56}
            className="w-11 h-11 sm:w-13 sm:h-13 object-contain filter drop-shadow-[0_4px_18px_rgba(255,255,255,0.45)]"
            priority
          />
        </Link>
      </div>

      <div className="oxy-nav-right-corridor">
        <Link
          href="/login"
          className="pointer-events-auto oxy-btn-glass px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-tight shadow-xl"
        >
          Giriş Yap
        </Link>
      </div>

      {/* =========================================================================
          2. HERO SECTION (Minimalist, Punchy, High Impact)
          ========================================================================= */}
      <section className="relative z-10 pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Master Headline in Restored Syne Display Font & Reflective Liquid Mercury */}
        <h1 className="oxy-hero-title oxy-civa-title text-[2.15rem] min-[390px]:text-[2.5rem] min-[440px]:text-[2.9rem] sm:text-5xl md:text-6xl xl:text-[3.8rem] font-extrabold tracking-tight leading-[1.08] mb-6 w-full max-w-5xl mx-auto">
          <span className="block">TOPLULUK KUR.</span>
          <span className="block mt-2 sm:mt-3">
            <span className="block sm:inline">BİRLİKTE </span>
            <span className="block sm:inline">FİLM İZLE.</span>
          </span>
        </h1>

        {/* Short, Clean Subtitle */}
        <p className="oxy-hero-subtitle max-w-xl mx-auto text-base sm:text-lg md:text-xl text-slate-200 font-medium leading-relaxed mb-10">
          Arkadaşlarınla kendi portalını oluştur, kristal netliğinde sesli odalarda sıfır gecikmeyle birlikte film izle.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            href="/login"
            className="oxy-btn-mercury w-full sm:w-auto px-8 py-3.5 rounded-full text-sm sm:text-base font-bold shadow-2xl flex items-center justify-center gap-2 group"
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
            className="oxy-btn-glass w-full sm:w-auto px-7 py-3.5 rounded-full text-sm sm:text-base font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.8559 8.1 12 8.1s-3.5902.311-5.1368.8504L4.8409 5.4474a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.784h24c-.3432-4.1251-2.6889-7.5973-6.1185-9.4626" />
            </svg>
            <span>Android APK</span>
          </a>
        </div>

        {/* =========================================================================
            3. REAL VISUAL SHOWCASE: 4 AUTO-ROTATING TABS WITH PROGRESS BAR ANIMATION
            Pure Glassmorphic & Borderless
            ========================================================================= */}
        <div className="max-w-5xl mx-auto">
          {/* Interactive Navigation Tabs with Duration Progress Bar Animation - Compact on Mobile */}
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 p-1 sm:p-1.5 oxy-tab-container mb-5 sm:mb-6 max-w-fit mx-auto">
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

            {/* Slimmed Down Top Info Header */}
            <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-white/[0.03] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
                <span className="w-2 h-2 rounded-full bg-slate-700 inline-block" />
                <span className="w-2 h-2 rounded-full bg-slate-800 inline-block" />
                <span className="ml-1.5 text-[11px] sm:text-xs font-mono text-slate-300">
                  {currentShowcase.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono text-slate-200">
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
                  className="oxy-btn-mercury px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
                >
                  Dene →
                </Link>
              </div>
            </div>
          </div>

          {/* =========================================================================
              EVENT HORIZON CARD (Directly below the 4 showcase cards)
              Pure Glassmorphic & Borderless
              ========================================================================= */}
          <div className="mt-8 p-6 sm:p-8 oxy-card-horizon flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-left shadow-2xl">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-[11px] font-mono uppercase tracking-widest text-slate-300 mb-2.5">
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
              className="oxy-btn-glass px-6 py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap hover:scale-105 transition-transform"
            >
              EVENT HORIZON&apos;a Git →
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. MINIMALIST CORE PILLARS (3 Clean Cards, Zero Emojis)
          Pure Glassmorphic & Borderless
          ========================================================================= */}
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pillar 1 */}
          <div className="oxy-card-mercury p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-white">
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
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-white">
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
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-white">
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
          5. MINIMALIST FOOTER (Positioned directly above the bottom banner)
          - Left: Oxypace Ice Logo (mirrored from top-left, positioned top-left of the bottom banner)
          - Right: Only Policies (compact/refined) and Theme-matching Icon Social Links
          - Removed: "Tüm hakları saklıdır" & "oxypace" text as requested
          ========================================================================= */}
      <footer className="relative z-10 bg-black pt-12 pb-6 px-4 sm:px-6 lg:px-8 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          {/* Top-left of the bottom banner: Oxypace Ice Logo */}
          <div className="w-full sm:w-auto flex items-center justify-start">
            <Link
              href="/"
              className="inline-flex items-center transition-transform hover:scale-105 active:scale-95"
              title="Oxypace"
            >
              <Image
                src="/oxypace-ice-logo.png"
                alt="Oxypace"
                width={40}
                height={40}
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain filter drop-shadow-[0_2px_12px_rgba(255,255,255,0.35)]"
              />
            </Link>
          </div>

          {/* Right: Only Policies (compact/refined) and Theme-matching Icon Social Links */}
          <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-4 sm:gap-5 text-slate-400">
            {/* Policies - Sleek & Refined */}
            <div className="flex items-center gap-3 sm:gap-4 font-medium text-[11px] sm:text-xs tracking-wide">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Gizlilik
              </Link>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <Link href="/terms" className="hover:text-white transition-colors">
                Şartlar
              </Link>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-white/10" />

            {/* Theme-matching Icon Social Links */}
            <div className="flex items-center gap-2">
              <a
                href="https://x.com/oxypace"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="oxy-social-btn"
                title="X (Twitter)"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className="oxy-social-btn"
                title="Discord"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>

              <a
                href="https://github.com/nkohlei/Oxypace"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="oxy-social-btn"
                title="GitHub"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>

              <a
                href="https://instagram.com/oxypace"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="oxy-social-btn"
                title="Instagram"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          6. VERY BOTTOM FULL-WIDTH BRAND BANNER (User Added Ultra-HD Asset)
          ========================================================================= */}
      <section className="relative z-10 oxy-banner-container">
        <div className="w-full max-w-[1440px] mx-auto px-0 sm:px-6 flex items-center justify-center overflow-hidden">
          <Image
            src="/oxypace-brand-banner-ultra.webp?v=5"
            alt="Oxypace Banner"
            width={4076}
            height={612}
            className="oxy-banner-image select-none pointer-events-none"
            priority
            unoptimized
          />
        </div>
      </section>
    </div>
  );
}

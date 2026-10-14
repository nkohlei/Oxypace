"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import OxypaceBackground from "./OxypaceBackground";
import "./oxypace-home.css";

export default function OxypaceHomePage() {
  const [activeShowcase, setActiveShowcase] = useState("watch-party");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const currentShowcase = showcases.find((s) => s.id === activeShowcase) || showcases[0];

  return (
    <div className="oxypace-landing relative">
      {/* High-Pixel Cursor-Responsive Background with Logo Glyphs and Dynamic Non-Neon Shifting Colors */}
      <OxypaceBackground />

      {/* =========================================================================
          1. FLOATING BRAND LOGOS (Protected by Glassmorphic Capsule on Scroll, Never Disappears)
          ========================================================================= */}
      <Link
        href="/"
        className={`oxy-floating-logo-capsule group ${isScrolled ? "scrolled" : ""}`}
        title="Oxypace Anasayfa"
      >
        {/* Main Icon Logo: Made Bigger */}
        <Image
          src="/logo.png"
          alt="Oxypace"
          width={44}
          height={44}
          className="w-10 h-10 sm:w-11 sm:h-11 object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
        {/* Text Logo: Made Smaller and Closer */}
        <Image
          src="/oxypace-text-logo2.webp"
          alt="Oxypace"
          width={88}
          height={18}
          className="h-4 sm:h-4.5 w-auto object-contain brightness-125 -ml-1 sm:-ml-0.5"
          priority
        />
      </Link>

      {/* Floating Top-Right Action Button */}
      <div className={`oxy-floating-action ${isScrolled ? "scrolled" : ""}`}>
        <Link
          href="/login"
          className="oxy-btn-mercury-ghost px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-tight shadow-lg"
        >
          Giriş Yap
        </Link>
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
            className="oxy-btn-mercury-ghost w-full sm:w-auto px-7 py-3.5 rounded-full text-sm sm:text-base font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.8559 8.1 12 8.1s-3.5902.311-5.1368.8504L4.8409 5.4474a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.784h24c-.3432-4.1251-2.6889-7.5973-6.1185-9.4626" />
            </svg>
            <span>Android APK</span>
          </a>
        </div>

        {/* =========================================================================
            3. REAL VISUAL SHOWCASE: INTERACTIVE TABS & SCREENSHOTS
            ========================================================================= */}
        <div className="max-w-5xl mx-auto">
          {/* Interactive Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6 max-w-fit mx-auto">
            {showcases.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveShowcase(tab.id)}
                className={`oxy-tab-pill !rounded-full text-xs sm:text-sm ${activeShowcase === tab.id ? "active" : ""}`}
              >
                <span>{tab.title}</span>
              </button>
            ))}
          </div>

          {/* Visual Showcase Frame with Real Screenshots */}
          <div className="oxy-showcase-frame text-left">
            <div className="px-4 sm:px-5 py-3 bg-[#090A0D] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  {currentShowcase.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
                <span className="hidden sm:inline">Canlı Bağlantı</span>
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
        </div>
      </section>

      {/* =========================================================================
          4. MINIMALIST CORE PILLARS (3 Clean Cards, Zero Emojis)
          ========================================================================= */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
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
          5. BIG FULL-WIDTH MULTI-LOGO BANNER AT THE BOTTOM
          ========================================================================= */}
      <section className="relative z-10 w-full mt-10 mb-2 overflow-hidden flex items-center justify-center">
        <div className="w-full max-w-full">
          <Image
            src="/oxypace-multi-banner.jpg"
            alt="Oxypace Logos"
            width={1920}
            height={480}
            className="w-full h-auto object-cover object-center select-none pointer-events-none"
            priority
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

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import OxypaceBackground from "./OxypaceBackground";
import "./oxypace-home.css";

export default function OxypaceHomePage() {
  const [activeShowcase, setActiveShowcase] = useState("watch-party");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showcases = [
    {
      id: "watch-party",
      title: "Birlikte Film İzle",
      subtitle: "Milisaniyelik eşzamanlama ve sıfır desenkronizasyon ile sinema salonunu tarayıcına getir.",
      image: "/onboarding-showcase/slide-3-watch-party.webp",
      alt: "Oxypace Birlikte Film İzleme ve Watch Party Arayüzü",
      badge: "Sıfır Gecikmeli Canlı Oynatıcı",
    },
    {
      id: "portals",
      title: "Kendi Portalını Kur",
      subtitle: "Sınırsız metin kanalı, ses odaları ve gelişmiş rol yetkileriyle topluluğunu özgürce yönet.",
      image: "/onboarding-showcase/slide-1-portal.webp",
      alt: "Oxypace Portallar ve Kanal Hiyerarşisi Arayüzü",
      badge: "Özelleştirilebilir Topluluk Portalı",
    },
    {
      id: "posts",
      title: "Topluluk Akışı ve Paylaşım",
      subtitle: "Görseller, videolar, tartışma başlıkları ve anlık tepkilerle yaşayan dinamik duvar.",
      image: "/onboarding-showcase/slide-2-post.webp",
      alt: "Oxypace Gönderi ve Etkileşim Duvarı",
      badge: "Canlı Akış ve Sosyal Katılım",
    },
    {
      id: "network",
      title: "Küresel Bağlantı Ağı",
      subtitle: "Dünyanın her yerinden üyelerle düşük gecikmeli, kesintisiz WebRTC altyapısıyla buluş.",
      image: "/onboarding-showcase/slide-4-globe.webp",
      alt: "Oxypace Küresel Ağ ve Canlı Odalar",
      badge: "WebRTC Düşük Gecikme Altyapısı",
    },
  ];

  const currentShowcase = showcases.find((s) => s.id === activeShowcase) || showcases[0];

  return (
    <div className="oxypace-landing relative">
      {/* High-Pixel Cursor-Responsive Shaped Matrix Canvas */}
      <OxypaceBackground />

      {/* =========================================================================
          1. NAVIGATION BAR
          ========================================================================= */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-black/80 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Authentic Oxypace Brand Logo (No boxes, no frames) */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Oxypace"
              width={38}
              height={38}
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <Image
              src="/oxypace-text-logo2.webp"
              alt="Oxypace"
              width={118}
              height={26}
              className="object-contain brightness-125"
              priority
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#ozellikler" className="hover:text-white transition-colors">
              Özellikler
            </a>
            <a href="#birlikte-izle" className="hover:text-white transition-colors">
              Birlikte İzle
            </a>
            <a href="#portallar" className="hover:text-white transition-colors">
              Portallar
            </a>
            <a href="#nasil-calisir" className="hover:text-white transition-colors">
              Nasıl Çalışır?
            </a>
            <a href="#indir" className="hover:text-white transition-colors">
              İndir
            </a>
          </nav>

          {/* Right Action Buttons: Liquid Mercury & Titanium */}
          <div className="hidden sm:flex items-center gap-3.5">
            <Link
              href="/login"
              className="oxy-btn-mercury-ghost px-4 py-2 rounded-xl text-xs sm:text-sm"
            >
              Giriş Yap
            </Link>
            <Link
              href="/login"
              className="oxy-btn-mercury px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-tight"
            >
              Oxypace&apos;i Başlat
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white border border-white/15 bg-white/5"
            aria-label="Menü"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/10 bg-black/95 px-6 py-5 flex flex-col gap-4 backdrop-blur-2xl">
            <a
              href="#ozellikler"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white py-1 text-sm font-medium"
            >
              Özellikler
            </a>
            <a
              href="#birlikte-izle"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white py-1 text-sm font-medium"
            >
              Birlikte İzle
            </a>
            <a
              href="#portallar"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white py-1 text-sm font-medium"
            >
              Portallar
            </a>
            <a
              href="#nasil-calisir"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white py-1 text-sm font-medium"
            >
              Nasıl Çalışır?
            </a>
            <a
              href="#indir"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white py-1 text-sm font-medium"
            >
              İndir
            </a>
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <Link
                href="/login"
                className="oxy-btn-mercury-ghost w-full py-2.5 rounded-xl text-center text-sm"
              >
                Giriş Yap
              </Link>
              <Link
                href="/login"
                className="oxy-btn-mercury w-full py-2.5 rounded-xl text-center text-sm font-bold"
              >
                Oxypace&apos;i Başlat
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION
          ========================================================================= */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Master Headline in Outfit Font & Liquid Mercury Gradient */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.04] mb-7 max-w-5xl mx-auto">
          <span className="block text-white">TOPLULUK KUR.</span>
          <span className="block oxy-text-mercury mt-2">BİRLİKTE FİLM İZLE.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-300/90 font-normal leading-relaxed mb-10">
          Kendi özel portalını oluştur, arkadaşlarınla kristal netliğinde sesli odalarda buluş ve sinema keyfini milisaniyelik senkronizasyonla aynı ekranda paylaş. Sade, reklamsız, modern.
        </p>

        {/* Primary Liquid Mercury CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            href="/login"
            className="oxy-btn-mercury w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold shadow-2xl flex items-center justify-center gap-2 group"
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
            className="oxy-btn-mercury-ghost w-full sm:w-auto px-7 py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2.5"
          >
            <svg className="w-5 h-5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.8559 8.1 12 8.1s-3.5902.311-5.1368.8504L4.8409 5.4474a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.784h24c-.3432-4.1251-2.6889-7.5973-6.1185-9.4626" />
            </svg>
            <span>Android APK İndir</span>
          </a>
        </div>

        {/* =========================================================================
            3. REAL VISUAL SHOWCASE: REAL SCREENSHOTS & INTERACTIVE TABS
            ========================================================================= */}
        <div className="max-w-6xl mx-auto">
          {/* Interactive Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6 max-w-fit mx-auto">
            {showcases.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveShowcase(tab.id)}
                className={`oxy-tab-pill ${activeShowcase === tab.id ? "active" : ""}`}
              >
                <span>{tab.title}</span>
              </button>
            ))}
          </div>

          {/* Visual Showcase Frame with Real Screenshots */}
          <div className="oxy-showcase-frame text-left">
            {/* Top Frame Bar */}
            <div className="px-5 py-3.5 bg-[#090A0D] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-slate-600 inline-block" />
                <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
                <span className="w-3 h-3 rounded-full bg-slate-800 inline-block" />
                <span className="ml-3 text-xs font-mono text-slate-400 font-medium">
                  {currentShowcase.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                <span>Canlı Bağlantı</span>
              </div>
            </div>

            {/* Showcase Visual Content */}
            <div className="relative aspect-[16/9] sm:aspect-[16/8.5] w-full bg-[#050608] overflow-hidden group">
              <Image
                key={currentShowcase.id}
                src={currentShowcase.image}
                alt={currentShowcase.alt}
                fill
                priority
                className="object-contain object-top p-2 sm:p-4 transition-transform duration-500 group-hover:scale-[1.01]"
              />

              {/* Bottom Subtle Glass Information Caption */}
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-white tracking-tight">
                    {currentShowcase.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                    {currentShowcase.subtitle}
                  </p>
                </div>
                <Link
                  href="/login"
                  className="oxy-btn-mercury px-5 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                >
                  Deneyimle →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. CORE FEATURES (Strict Monochrome Silver, Vector Icons, Zero Emojis)
          ========================================================================= */}
      <section id="ozellikler" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-5">
            Sadece bir sohbet uygulaması değil.
            <span className="block oxy-text-mercury mt-1">Gerçek zamanlı bir yaşam alanı.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal">
            Gereksiz karmaşadan arındırılmış, yüksek performanslı ve doğrudan amaca yönelik araçlarla donatıldı.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Watch Party */}
          <div id="birlikte-izle" className="oxy-card-mercury p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 text-white">
                {/* Film Strip SVG */}
                <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Birlikte Film İzle (Sıfır Desenkron)
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Arkadaşlarınla aynı anda duraklat, ileri sar ve tepki ver. Gelişmiş buffer senkronizasyonu sayesinde hiç kimse diğerinden 1 saniye bile geri kalmaz.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Milisaniyelik Eşzamanlama</span>
              <span className="text-white font-semibold">Aktif</span>
            </div>
          </div>

          {/* Card 2: Portals */}
          <div id="portallar" className="oxy-card-mercury p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 text-white">
                {/* Server Grid SVG */}
                <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Özel Portallar ve Topluluklar
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Kendi kurallarını koyduğun, sınırsız ses ve metin kanalları açabileceğin bağımsız portallar kur. Rol izinleri ve özel davet bağlantılarıyla alanını yönet.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Sınırsız Kanal & Rol</span>
              <span className="text-white font-semibold">Aktif</span>
            </div>
          </div>

          {/* Card 3: Voice & Video */}
          <div className="oxy-card-mercury p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 text-white">
                {/* Microphone / Sound Wave SVG */}
                <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Kristal Netliğinde Sesli Odalar
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                WebRTC tabanlı ultra düşük gecikmeli ses motoru. Gürültü engelleme ve otomatik ses seviyesi optimizasyonu ile arka planda bile kopmayan kesintisiz iletişim.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>WebRTC Düşük Gecikme</span>
              <span className="text-white font-semibold">Aktif</span>
            </div>
          </div>
        </div>

        {/* Detailed Secondary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="oxy-card-mercury p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h4 className="text-lg font-bold text-white">Hafif, Sade ve Reklamsız</h4>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Seni boğan reklam bantları, gereksiz pop-up&apos;lar ve yavaşlatan ağır kütüphaneler yok. Oxypace; hız, sadelik ve şıklık için tasarlandı.
            </p>
            <div className="text-xs font-mono text-slate-500">
              Hızlı yükleme • Düşük bellek kullanımı • Pil dostu
            </div>
          </div>

          <div className="oxy-card-mercury p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h4 className="text-lg font-bold text-white">Gizlilik ve Kontrol Sende</h4>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Portallarını gizli veya herkese açık yapabilirsin. İstemediğin kimse odana giremez; kimin ne zaman ne izleyeceğini topluluk yöneticisi olarak sen belirlersin.
            </p>
            <div className="text-xs font-mono text-slate-500">
              Gelişmiş izin matrisi • Özel davet anahtarları
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. HOW IT WORKS (3 Simple Steps)
          ========================================================================= */}
      <section id="nasil-calisir" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Dakikalar içinde kendi alanını aç.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="oxy-card-mercury p-7 rounded-2xl relative">
            <div className="text-3xl font-black font-mono text-white/30 mb-4">01</div>
            <h3 className="text-lg font-bold text-white mb-2">Portalını Oluştur</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Tek bir tıkla portal adını ve avatarını belirle. İster sinema kulübü kur, ister arkadaş grubunla özel sohbet alanı yarat.
            </p>
          </div>

          <div className="oxy-card-mercury p-7 rounded-2xl relative">
            <div className="text-3xl font-black font-mono text-white/30 mb-4">02</div>
            <h3 className="text-lg font-bold text-white mb-2">Arkadaşlarını Davet Et</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Özel davet bağlantını kopyala ve arkadaşlarına gönder. İster web üzerinden anında katılsınlar, ister Android uygulamasından.
            </p>
          </div>

          <div className="oxy-card-mercury p-7 rounded-2xl relative">
            <div className="text-3xl font-black font-mono text-white/30 mb-4">03</div>
            <h3 className="text-lg font-bold text-white mb-2">Birlikte İzle ve Eğlen</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Canlı sinema odasını aç, filmini veya videonu seç. Sıfır gecikmeli sesli bağlantıyla sinema salonu keyfini evinize taşıyın.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. CROSS-PLATFORM DOWNLOADS (Web & Android)
          ========================================================================= */}
      <section id="indir" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="oxy-card-mercury p-8 sm:p-14 rounded-3xl border border-white/20 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-left">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                İster Web&apos;de kullan, ister Android cebinde.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Oxypace; modern tüm web tarayıcılarında kurulumsuz olarak saniyeler içinde açılır. Android için hazırlanan yerel APK ile arka plan ses ve anlık bildirim desteği cebinde.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5">
              <Link
                href="/login"
                className="oxy-btn-mercury px-6 py-4 rounded-xl text-center text-sm font-bold tracking-tight flex items-center justify-center gap-2"
              >
                <span>Tarayıcıda Aç (Web)</span>
                <span className="text-xs">↗</span>
              </Link>
              <a
                href="/downloads/oxypace.apk"
                className="oxy-btn-mercury-ghost px-6 py-4 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.8559 8.1 12 8.1s-3.5902.311-5.1368.8504L4.8409 5.4474a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.784h24c-.3432-4.1251-2.6889-7.5973-6.1185-9.4626" />
                </svg>
                <span>Android APK İndir (.apk)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. MODEST ECOSYSTEM MENTION (EVENT HORIZON - SIDE HOBBY AREA)
          ========================================================================= */}
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
              Hobi & Bilim Köşesi
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              EVENT HORIZON — Bağımsız Popüler Bilim Arşivi
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Oxypace bünyesindeki bağımsız astrofizik, kuantum ve ekstrem doğa koşulları yazı arşivi.
            </p>
          </div>
          <Link
            href="/blog"
            className="oxy-btn-mercury-ghost px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            Bilim Arşivine Git →
          </Link>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER
          ========================================================================= */}
      <footer className="relative z-10 border-t border-white/10 bg-black/95 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Oxypace"
                width={30}
                height={30}
                className="object-contain"
              />
              <Image
                src="/oxypace-text-logo2.webp"
                alt="Oxypace"
                width={100}
                height={22}
                className="object-contain brightness-125"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Yeni nesil topluluk kurma, sesli odalar ve eşzamanlı birlikte film izleme platformu.
            </p>
            <div className="text-[11px] font-mono text-slate-500">
              © 2026 Oxypace. Tüm hakları saklıdır.
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-white tracking-wider uppercase text-[11px] mb-3">
              Platform
            </div>
            <div>
              <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                Giriş Yap
              </Link>
            </div>
            <div>
              <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                Kayıt Ol
              </Link>
            </div>
            <div>
              <a href="/downloads/oxypace.apk" className="text-slate-400 hover:text-white transition-colors">
                Android APK İndir
              </a>
            </div>
          </div>

          {/* Col 3: Özellikler */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-white tracking-wider uppercase text-[11px] mb-3">
              Özellikler
            </div>
            <div>
              <a href="#birlikte-izle" className="text-slate-400 hover:text-white transition-colors">
                Birlikte Film İzle
              </a>
            </div>
            <div>
              <a href="#portallar" className="text-slate-400 hover:text-white transition-colors">
                Özel Portallar
              </a>
            </div>
            <div>
              <a href="#ozellikler" className="text-slate-400 hover:text-white transition-colors">
                Kristal Netliğinde Ses
              </a>
            </div>
          </div>

          {/* Col 4: Hobi & Yasal */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-white tracking-wider uppercase text-[11px] mb-3">
              Yasal & Arşiv
            </div>
            <div>
              <Link href="/blog" className="text-slate-400 hover:text-white transition-colors">
                EVENT HORIZON Bilim Arşivi
              </Link>
            </div>
            <div>
              <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                Gizlilik Politikası
              </Link>
            </div>
            <div>
              <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
                Kullanım Koşulları
              </Link>
            </div>
            <div>
              <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                İletişim
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

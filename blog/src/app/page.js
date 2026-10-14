"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import OxypaceBackground from "./OxypaceBackground";
import "./oxypace-home.css";

export default function OxypaceHomePage() {
  const [activePortalTab, setActivePortalTab] = useState("cinema");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="oxypace-landing relative">
      {/* Dynamic Animated Background: Silver dust & constellation lines on Obsidian Black */}
      <OxypaceBackground />

      {/* =========================================================================
          1. NAVIGATION BAR (Frosted Monochrome Glass)
          ========================================================================= */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-black/75 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/20 bg-black flex items-center justify-center p-1 group-hover:border-white/50 transition-colors shadow-sm">
              <Image
                src="/logo.png"
                alt="Oxypace"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wider oxy-text-silver-bright group-hover:text-white transition-colors">
                OXYPACE
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/15 text-slate-400">
              v2.4
            </span>
          </Link>

          {/* Desktop Nav Links */}
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

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="oxy-btn-secondary px-4 py-2 rounded-xl text-xs sm:text-sm font-medium"
            >
              Giriş Yap
            </Link>
            <Link
              href="/login"
              className="oxy-btn-primary px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide"
            >
              Oxypace&apos;i Başlat
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white border border-white/10 bg-white/5"
            aria-label="Menüyü Aç"
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

        {/* Mobile Dropdown Menu */}
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
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/login"
                className="oxy-btn-secondary w-full py-2.5 rounded-xl text-center text-sm font-medium"
              >
                Giriş Yap
              </Link>
              <Link
                href="/login"
                className="oxy-btn-primary w-full py-2.5 rounded-xl text-center text-sm font-semibold"
              >
                Oxypace&apos;i Başlat
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION (Massive Monochrome Impact)
          ========================================================================= */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Subtle Silver Badge */}
        <div className="inline-flex items-center justify-center mb-6">
          <div className="oxy-tag">
            <span className="oxy-pulse-dot" />
            <span className="tracking-widest text-[11px] text-slate-300">
              YENİ NESİL TOPLULUK & SİNEMA PLATFORMU
            </span>
          </div>
        </div>

        {/* Master Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] mb-6 max-w-5xl mx-auto">
          <span className="block text-white">TOPLULUK KUR.</span>
          <span className="block oxy-text-silver mt-1">BİRLİKTE FİLM İZLE.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-400 font-normal leading-relaxed mb-10">
          Kendi özel portalını oluştur, arkadaşlarınla kristal netliğinde sesli odalarda buluş ve sinema keyfini milisaniyelik senkronizasyonla aynı ekranda paylaş. Sade, reklamsız, modern.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-14">
          <Link
            href="/login"
            className="oxy-btn-primary w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold shadow-xl flex items-center justify-center gap-2 group"
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
            className="oxy-btn-secondary w-full sm:w-auto px-7 py-3.5 rounded-xl text-base font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 1.0003.4485 1.0003 1.0006s-.4487 1.0007-1.0003 1.0007m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.8559 8.1 12 8.1s-3.5902.311-5.1368.8504L4.8409 5.4474a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.784h24c-.3432-4.1251-2.6889-7.5973-6.1185-9.4626" />
            </svg>
            <span>Android APK İndir</span>
          </a>
        </div>

        {/* Feature Pills (No colors, pure titanium / silver style) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono text-slate-400">
          <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" /> Sıfır Gecikme (0ms)
          </span>
          <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" /> Canlı Eşzamanlı Oynatıcı
          </span>
          <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" /> Kristal Netliğinde Ses
          </span>
          <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" /> Web & Android
          </span>
        </div>

        {/* =========================================================================
            3. DISCORD-INSPIRED INTERACTIVE OXYPACE APP MOCKUP
            ========================================================================= */}
        <div className="mt-14 max-w-6xl mx-auto text-left">
          <div className="oxy-app-window">
            {/* Window Title Bar */}
            <div className="px-4 py-3 bg-[#0c0d12] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-zinc-700 inline-block" />
                <span className="w-3 h-3 rounded-full bg-zinc-600 inline-block" />
                <span className="w-3 h-3 rounded-full bg-zinc-500 inline-block" />
                <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline-block">
                  Oxypace // Sinema & Dizi Portalı • Canlı Bağlantı
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-white" /> 14ms (Optimal)
                </span>
              </div>
            </div>

            {/* Application Multi-column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
              {/* Col 1: Portal List (Discord style left strip) */}
              <div className="hidden lg:flex lg:col-span-1 bg-[#060709] border-r border-white/10 flex-col items-center py-4 gap-3">
                <button
                  type="button"
                  onClick={() => setActivePortalTab("cinema")}
                  className={`oxy-mockup-sidebar-icon ${activePortalTab === "cinema" ? "active" : ""}`}
                  title="Sinema & Dizi Portalı"
                >
                  <span className="text-base font-bold">🎬</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePortalTab("community")}
                  className={`oxy-mockup-sidebar-icon ${activePortalTab === "community" ? "active" : ""}`}
                  title="Genel Topluluk"
                >
                  <span className="text-base font-bold">💬</span>
                </button>
                <div className="w-6 h-[1px] bg-white/10 my-1" />
                <button
                  type="button"
                  className="oxy-mockup-sidebar-icon"
                  title="Yeni Portal Oluştur"
                >
                  <span className="text-lg font-light text-slate-400">+</span>
                </button>
              </div>

              {/* Col 2: Channel Hierarchy Sidebar */}
              <div className="hidden sm:flex sm:col-span-4 lg:col-span-3 bg-[#0b0c10] border-r border-white/10 flex-col justify-between p-3.5">
                <div>
                  {/* Portal Header */}
                  <div className="pb-3 border-b border-white/10 flex items-center justify-between">
                    <span className="font-semibold text-sm text-white tracking-wide">
                      Sinema Kulübü
                    </span>
                    <span className="text-xs text-slate-400">▾</span>
                  </div>

                  {/* Channel Categories */}
                  <div className="mt-4 space-y-4 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                        Metin Kanalları
                      </div>
                      <div className="space-y-1">
                        <div className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer flex items-center gap-2">
                          <span className="text-slate-500 font-mono">#</span>
                          <span>genel-sohbet</span>
                        </div>
                        <div className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer flex items-center gap-2">
                          <span className="text-slate-500 font-mono">#</span>
                          <span>film-önerileri</span>
                        </div>
                        <div className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer flex items-center gap-2">
                          <span className="text-slate-500 font-mono">#</span>
                          <span>spoiler-odası</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                        Canlı Sinema & Ses
                      </div>
                      <div className="space-y-1">
                        {/* Active Watch Party Room */}
                        <div className="px-2.5 py-2 rounded-lg bg-white/10 border border-white/20 text-white cursor-pointer">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold flex items-center gap-1.5">
                              <span>🎬</span> 1. Salon [Interstellar]
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-black font-bold">
                              CANLI
                            </span>
                          </div>
                          {/* Members in voice */}
                          <div className="pl-5 space-y-1 text-[11px] text-slate-300">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <span className="font-medium text-white">Kaan (Host)</span>
                              <span className="text-[9px] text-slate-400 font-mono">[Konuşuyor]</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              <span>Zeynep</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              <span>Emre</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              <span>Burak</span>
                            </div>
                          </div>
                        </div>

                        <div className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer flex items-center gap-2">
                          <span>🔊</span>
                          <span>Lobi Sohbeti (Boş)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Bottom Status Bar */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-xs font-bold text-white">
                        O
                      </div>
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-white border border-black" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-white leading-tight">Sen</div>
                      <div className="text-[10px] text-slate-400 leading-tight">Çevrimiçi</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="p-1 hover:text-white cursor-pointer" title="Mikrofon Açık">
                      🎙️
                    </span>
                    <span className="p-1 hover:text-white cursor-pointer" title="Kulaklık Açık">
                      🎧
                    </span>
                  </div>
                </div>
              </div>

              {/* Col 3: Main Stage — Synchronized Cinema Player */}
              <div className="col-span-1 sm:col-span-8 lg:col-span-8 bg-[#040507] p-4 sm:p-6 flex flex-col justify-between">
                {/* Cinema Screen Mockup */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/20 flex flex-col justify-between p-4 shadow-2xl">
                  {/* Subtle Cinematic Background Visual */}
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-700 via-zinc-950 to-black" />

                  {/* Top HUD Overlay */}
                  <div className="relative z-10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-black/80 border border-white/20 text-white font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        CANLI SENKRONİZASYON
                      </span>
                      <span className="hidden sm:inline-block px-2 py-1 rounded bg-black/60 border border-white/10 text-slate-300 font-mono">
                        0ms Desenkronizasyon
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-black/80 border border-white/20 text-slate-300 text-[11px]">
                        TR Dublaj • TR Altyazı
                      </span>
                    </div>
                  </div>

                  {/* Center Ambient Cinema Indicator */}
                  <div className="relative z-10 text-center my-auto">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/40 text-white mb-2 backdrop-blur-md cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 font-mono tracking-wider">
                      Interstellar (2014) • 1080p Full HD
                    </div>
                  </div>

                  {/* Bottom Scrubber & Controls */}
                  <div className="relative z-10 space-y-2">
                    {/* Timecode & scrubber bar */}
                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div className="oxy-scrubber-progress h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">01:42:18</span>
                        <span className="text-slate-500">/</span>
                        <span>02:49:00</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hover:text-white cursor-pointer">1080p</span>
                        <span className="hover:text-white cursor-pointer">Ses: %100</span>
                        <span className="hover:text-white cursor-pointer">Tam Ekran ⛶</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Watch Party Participants Cards */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs font-mono text-slate-400 mb-2.5 flex items-center justify-between">
                    <span>Odadaki İzleyiciler (4 Kişi Bağlı)</span>
                    <span className="text-[11px] text-slate-500">Ortak Oynatma Yetkisi: Aktif</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/20 flex items-center gap-2.5">
                      <div className="relative w-7 h-7 rounded-full bg-white text-black font-bold flex items-center justify-center text-xs oxy-speaking-ring">
                        K
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-white truncate">Kaan</div>
                        <div className="text-[10px] text-slate-300 font-mono truncate">Konuşuyor 🎙️</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 text-white font-bold flex items-center justify-center text-xs">
                        Z
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-white truncate">Zeynep</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">İzliyor 🍿</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 text-white font-bold flex items-center justify-center text-xs">
                        E
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-white truncate">Emre</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">İzliyor 👀</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 text-white font-bold flex items-center justify-center text-xs">
                        B
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-white truncate">Burak</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">Kulaklıkta 🎧</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. CORE FEATURES (Strict Monochrome Silver & Black Cards)
          ========================================================================= */}
      <section id="ozellikler" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="oxy-tag mb-4">
            <span className="text-[11px] text-slate-300">BENZERSİZ MİMARİ</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-5">
            Sadece bir sohbet uygulaması değil.
            <span className="block oxy-text-silver mt-1">Gerçek zamanlı bir yaşam alanı.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal">
            Gereksiz karmaşadan arındırılmış, yüksek performanslı ve doğrudan amaca yönelik araçlarla donatıldı.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Watch Party */}
          <div id="birlikte-izle" className="oxy-card p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl mb-6 text-white">
                🎬
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
              <span className="text-white">✓ Dahil</span>
            </div>
          </div>

          {/* Card 2: Portals */}
          <div id="portallar" className="oxy-card p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl mb-6 text-white">
                🏛️
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
              <span className="text-white">✓ Dahil</span>
            </div>
          </div>

          {/* Card 3: Voice & Video */}
          <div className="oxy-card p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl mb-6 text-white">
                🎙️
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Kristal Netliğinde Sesli Odalar
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                WebRTC tabanlı ultra düşük gecikmeli ses motoru. Gürültü engelleme ve otomatik ses seviyesi optimizasyonu ile arka planda bile kopmayan kesintisiz iletişim.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Düşük Gecikmeli WebRTC</span>
              <span className="text-white">✓ Dahil</span>
            </div>
          </div>
        </div>

        {/* Secondary Detailed Feature Row */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="oxy-card p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">⚡</span>
              <h4 className="text-lg font-bold text-white">Hafif, Sade ve Reklamsız</h4>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Seni boğan reklam bantları, gereksiz pop-up&apos;lar ve yavaşlatan ağır kütüphaneler yok. Oxypace; hız, sadelik ve şıklık için tasarlandı.
            </p>
            <div className="text-xs font-mono text-slate-500">
              Hızlı yükleme • Düşük bellek kullanımı • Pil dostu
            </div>
          </div>

          <div className="oxy-card p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">🔒</span>
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
          <div className="oxy-tag mb-4">
            <span className="text-[11px] text-slate-300">3 ADIMDA BAŞLA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Dakikalar içinde kendi alanını aç.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="oxy-card p-6 rounded-2xl relative">
            <div className="text-4xl font-black font-mono text-white/20 mb-4">01</div>
            <h3 className="text-lg font-bold text-white mb-2">Portalını Oluştur</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Tek bir tıkla portal adını ve avatarını belirle. İster sinema kulübü kur, ister arkadaş grubunla özel sohbet alanı yarat.
            </p>
          </div>

          <div className="oxy-card p-6 rounded-2xl relative">
            <div className="text-4xl font-black font-mono text-white/20 mb-4">02</div>
            <h3 className="text-lg font-bold text-white mb-2">Arkadaşlarını Çağır</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Özel davet bağlantını kopyala ve arkadaşlarına gönder. İster web üzerinden anında katılsınlar, ister Android uygulamasından.
            </p>
          </div>

          <div className="oxy-card p-6 rounded-2xl relative">
            <div className="text-4xl font-black font-mono text-white/20 mb-4">03</div>
            <h3 className="text-lg font-bold text-white mb-2">Birlikte İzle ve Eğlen</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Canlı sinema odasını aç, filmini veya videonu seç. Sıfır gecikmeli sesli bağlantıyla sinema salonu deneyimini evinize taşıyın.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. CROSS-PLATFORM DOWNLOADS (Web & Android)
          ========================================================================= */}
      <section id="indir" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="oxy-card p-8 sm:p-14 rounded-3xl border border-white/20 relative overflow-hidden">
          {/* Subtle glow / highlight in monochrome */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-left">
              <div className="oxy-tag mb-4">
                <span className="text-[11px] text-slate-300">HER CİHAZDA KESİNTİSİZ</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                İster Web&apos;de kullan, ister Android cebinde.
              </h2>
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
                Oxypace; modern tüm web tarayıcılarında kurulumsuz olarak saniyeler içinde açılır. Android için hazırlanan yerel APK ile arka plan ses ve anlık bildirim desteği cebinde.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5">
              <Link
                href="/login"
                className="oxy-btn-primary px-6 py-4 rounded-xl text-center text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
              >
                <span>Tarayıcıda Aç (Web)</span>
                <span className="text-xs">↗</span>
              </Link>
              <a
                href="/downloads/oxypace.apk"
                className="oxy-btn-secondary px-6 py-4 rounded-xl text-center text-sm font-medium flex items-center justify-center gap-2"
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
          User instruction: Event Horizon is a hobby area, not the main mission.
          Tastefully placed as an independent archive link without stealing focus.
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
            className="oxy-btn-secondary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            Bilim Arşivine Git →
          </Link>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER (Monochrome Minimalist)
          ========================================================================= */}
      <footer className="relative z-10 border-t border-white/10 bg-black/90 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/20 bg-black flex items-center justify-center p-0.5">
                <Image
                  src="/logo.png"
                  alt="Oxypace"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-bold tracking-wider oxy-text-silver-bright">
                OXYPACE
              </span>
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
            <div className="font-semibold text-white tracking-wider uppercase text-[11px] mb-3">
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
            <div className="font-semibold text-white tracking-wider uppercase text-[11px] mb-3">
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
            <div className="font-semibold text-white tracking-wider uppercase text-[11px] mb-3">
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

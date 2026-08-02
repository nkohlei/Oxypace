"use client";

import { useState, useEffect } from "react";
import ReadingProgressBar from "../components/ReadingProgressBar";
import CookieConsent from "../components/CookieConsent";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { formatBlogImageUrl } from "../utils/imageHelper";

const DEFAULT_AUTHOR = {
  name: "Bilal Yılmaz",
  title: "Founder & CEO of Oxypace",
  bio: "Ben Bilal. Elektrik-Elektronik Mühendisliği 2. sınıf öğrencisiyim. Mühendislik eğitimimin yanı sıra modern web teknolojileri ve bulut altyapıları kullanarak full-stack yazılım projeleri geliştiriyorum. Teknoloji ve yazılımın ötesinde; astronomi, kozmoloji ve ekstrem sporlara derin bir ilgi duyuyor, bilimsel merakımı dijital içerik üretimiyle projelerime yansıtıyorum.",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  badge: "Yazar",
  github: "https://github.com",
  twitter: "https://twitter.com",
  website: "https://oxypace.com.tr"
};

export default function ArticleClient({ initialPost, slug }) {
  const [post, setPost] = useState(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [author, setAuthor] = useState(DEFAULT_AUTHOR);
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : `https://oxypace.com.tr/blog/${slug}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareTitle = post?.title || "Oxypace Blog";
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://oxypace.com.tr/blog/${slug}`;

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    }
  };

  const sharePlatforms = [
    {
      name: "Twitter / X",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      action: () => window.open(`https://x.com/intent/post?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, "_blank"),
      hoverColor: "hover:text-sky-400 hover:border-sky-400/40 hover:bg-sky-500/10"
    },
    {
      name: "WhatsApp",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      ),
      action: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`, "_blank"),
      hoverColor: "hover:text-emerald-400 hover:border-emerald-400/40 hover:bg-emerald-500/10"
    },
    {
      name: "LinkedIn",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
      ),
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank"),
      hoverColor: "hover:text-blue-400 hover:border-blue-400/40 hover:bg-blue-500/10"
    },
    {
      name: "Facebook",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.79c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.89h-2.34v6.99C18.34 21.12 22 16.99 22 12z"/>
        </svg>
      ),
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank"),
      hoverColor: "hover:text-indigo-400 hover:border-indigo-400/40 hover:bg-indigo-500/10"
    },
    {
      name: "Telegram",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
        </svg>
      ),
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, "_blank"),
      hoverColor: "hover:text-cyan-400 hover:border-cyan-400/40 hover:bg-cyan-500/10"
    },
    {
      name: "Reddit",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491.957 0 1.73.774 1.73 1.73 0 .736-.459 1.367-1.11 1.618.026.236.041.478.041.724 0 3.659-4.249 6.627-9.49 6.627-5.24 0-9.489-2.968-9.489-6.627 0-.236.015-.468.037-.698a1.722 1.722 0 0 1-1.077-1.62c0-.956.774-1.73 1.73-1.73.475 0 .903.192 1.213.507 1.2-.857 2.868-1.417 4.706-1.484l.97-4.546a.35.35 0 0 1 .414-.27l3.07.647c.189-.481.654-.822 1.202-.822zM9.54 11.53c-.736 0-1.334.598-1.334 1.334s.598 1.334 1.334 1.334c.736 0 1.334-.598 1.334-1.334s-.598-1.334-1.334-1.334zm4.92 0c-.736 0-1.334.598-1.334 1.334s.598 1.334 1.334 1.334c.736 0 1.334-.598 1.334-1.334s-.598-1.334-1.334-1.334zm-4.98 4.29a.35.35 0 0 0-.247.598c.957.957 2.508 1.173 3.767 1.173 1.259 0 2.81-.216 3.767-1.173a.35.35 0 0 0-.495-.495c-.752.752-2.046.968-3.272.968-1.226 0-2.52-.216-3.272-.968a.346.346 0 0 0-.248-.103z"/>
        </svg>
      ),
      action: () => window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`, "_blank"),
      hoverColor: "hover:text-orange-400 hover:border-orange-400/40 hover:bg-orange-500/10"
    }
  ];

  useEffect(() => {
    // Fetch Author Profile from DB
    const fetchAuthor = async () => {
      try {
        const authorUrl = typeof window !== 'undefined'
          ? (window.location.origin.includes('localhost') ? 'http://localhost:5000/api/blog/author' : '/api/blog/author')
          : '/api/blog/author';
        const res = await fetch(authorUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.name || data.bio)) {
            setAuthor({
              ...DEFAULT_AUTHOR,
              ...data
            });
          }
        }
      } catch (e) {
        console.error('Fetch author profile error:', e);
      }
    };
    fetchAuthor();

    if (!slug) return;

    const fetchPost = async () => {
      try {
        const apiUrl = typeof window !== 'undefined'
          ? (window.location.origin.includes('localhost') ? `http://localhost:5000/api/blog/${slug}` : `/api/blog/${slug}`)
          : `/api/blog/${slug}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && data.title) {
            setPost(data);
          }
        }
      } catch (e) {
        console.error('Fetch post detail error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (!post && !loading) {
    return (
      <div className="min-h-screen bg-transparent text-foreground flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">404 — Makale Bulunamadı</h1>
        <p className="text-zinc-400 mb-6">Aradığınız makale yayından kaldırılmış veya taşınmış olabilir.</p>
        <a href="/blog" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-mono text-sm">
          [ ← ARŞİVE GERİ DÖN ]
        </a>
      </div>
    );
  }

  if (!post && loading) {
    return (
      <div className="min-h-screen bg-transparent text-foreground flex items-center justify-center p-6">
        <div className="animate-pulse font-mono text-sm text-zinc-400">Makale Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground transition-colors duration-300">
      {/* Reading Progress Line */}
      <ReadingProgressBar />

      {/* Header */}
      <Header isArticle={true} />

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 animate-fade-in-up">
        <article className="glass-card p-6 sm:p-10 rounded-2xl">
          {/* Category Tag & Meta */}
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 mb-6 flex-wrap">
            <span className="border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 px-2.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300 font-semibold">
              {post.category}
            </span>
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
            {post.views !== undefined && (
              <>
                <span>•</span>
                <span>👁 {post.views} okuma</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-6 leading-tight uppercase font-sans">
            {post.title}
          </h1>

          {/* Author Header Meta (Görsel 1: Tıklanınca Ortada Yazar Kartı Pop-up Açılır) */}
          {author && (
            <div 
              onClick={() => setAuthorModalOpen(true)}
              className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-200 dark:border-white/10 cursor-pointer group hover:opacity-90 transition-all w-fit"
              title="Yazar profil kartını ortada pencere olarak açmak için tıklayın"
            >
              <div className="relative">
                <img
                  src={formatBlogImageUrl(author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb')}
                  alt={author.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-cyan-400/50 shadow group-hover:scale-105 group-hover:border-cyan-400 transition-all"
                />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                  <span>{author.name || "Bilal Yılmaz"}</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-normal">
                    {author.badge || "Yazar"}
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    (Profili Gör ↗)
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  {author.title || "Founder & CEO of Oxypace"}
                </div>
              </div>
            </div>
          )}

          {/* Banner Image */}
          {post.image && (
            <div className="relative mb-12 overflow-hidden rounded border border-zinc-200 dark:border-white/10 bg-zinc-900 shadow-2xl aspect-video w-full">
              <img
                src={formatBlogImageUrl(post.image)}
                alt={post.title}
                className="h-full w-full object-cover opacity-90"
              />
            </div>
          )}

          {/* Article Body */}
          <div
            className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-6 text-base font-sans"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share Buttons / Footer */}
          <div className="mt-14 border-t border-zinc-200 dark:border-white/5 pt-8 flex flex-col gap-5 font-mono text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-3">
                <span className="text-zinc-500 uppercase tracking-widest text-[11px] font-semibold">Paylaş:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {sharePlatforms.map((platform) => (
                    <button
                      key={platform.name}
                      onClick={platform.action}
                      className={`inline-flex items-center gap-2 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 px-3 py-1.5 rounded text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer ${platform.hoverColor}`}
                      title={`${platform.name}'da Paylaş`}
                    >
                      {platform.icon}
                      <span>{platform.name}</span>
                    </button>
                  ))}

                  {/* Bağlantıyı Kopyala */}
                  <button
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-2 border px-3 py-1.5 rounded transition-all cursor-pointer ${
                      copied
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10"
                    }`}
                    title="Makale Bağlantısını Kopyala"
                  >
                    {copied ? (
                      <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.75v-6.75a1.125 1.125 0 00-1.125-1.125H16.5" />
                      </svg>
                    )}
                    <span>{copied ? "Kopyalandı! ✓" : "Bağlantıyı Kopyala"}</span>
                  </button>

                  {/* Mobil / Native Share */}
                  {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                    <button
                      onClick={handleNativeShare}
                      className="inline-flex items-center gap-2 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 hover:bg-purple-500/10 hover:border-purple-500/40 hover:text-purple-400 px-3 py-1.5 rounded text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer"
                      title="Sistem Paylaşım Menüsünü Aç"
                    >
                      <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                      </svg>
                      <span>Paylaş...</span>
                    </button>
                  )}
                </div>
              </div>

              <a
                href="/blog"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-accent transition-colors self-start md:self-end mt-2 md:mt-0 font-medium"
              >
                [ ← ARŞİVE GERİ DÖN ]
              </a>
            </div>
          </div>
        </article>
      </main>

      {/* Author Profile Popup Modal Window (Görsel 2'deki Yazar Kartının Birebir Kendisi Sayfa Ortasında Açılır) */}
      {authorModalOpen && author && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setAuthorModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/95 p-6 sm:p-8 text-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button 
              onClick={() => setAuthorModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm z-10"
              title="Kapat"
            >
              ✕
            </button>

            {/* Exact Replica of Image 2 Card Layout */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
              <div className="relative shrink-0">
                <img
                  src={formatBlogImageUrl(author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb')}
                  alt={author.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-cyan-400/50 shadow-xl shadow-cyan-500/10"
                />
                <span className="absolute -bottom-2 -right-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                  {author.badge || "Yazar"}
                </span>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{author.name || "Bilal Yılmaz"}</h3>
                    <p className="text-xs font-mono text-cyan-400">{author.title || "Founder & CEO of Oxypace"}</p>
                  </div>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed font-sans pt-1">
                  {author.bio || "Ben Bilal. Elektrik-Elektronik Mühendisliği 2. sınıf öğrencisiyim. Mühendislik eğitimimin yanı sıra modern web teknolojileri ve bulut altyapıları kullanarak full-stack yazılım projeleri geliştiriyorum. Teknoloji ve yazılımın ötesinde; astronomi, kozmoloji ve ekstrem sporlara derin bir ilgi duyuyor, bilimsel merakımı dijital içerik üretimiyle projelerime yansıtıyorum."}
                </p>

                {/* Social Links */}
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-3 font-mono text-xs text-zinc-400">
                  {author.github && (
                    <a href={author.github} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                      [ GitHub ]
                    </a>
                  )}
                  {author.twitter && (
                    <a href={author.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                      [ Twitter/X ]
                    </a>
                  )}
                  {author.website && (
                    <a href={author.website} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                      [ Web ]
                    </a>
                  )}
                  {author.linkedin && (
                    <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                      [ LinkedIn ]
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
}

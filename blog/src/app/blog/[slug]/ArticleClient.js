"use client";

import { useState, useEffect } from "react";
import ReadingProgressBar from "../components/ReadingProgressBar";
import CookieConsent from "../components/CookieConsent";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { formatBlogImageUrl } from "../utils/imageHelper";

const DEFAULT_AUTHOR = {
  name: "Oxypace",
  title: "Oxypace Kurucusu & Baş Yazarı",
  bio: "Teorik fizik, kozmoloji ve yüksek performanslı yazılım mimarileri üzerine araştırmalar yapıyor.",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  badge: "Baş Yazar"
};

export default function ArticleClient({ initialPost, slug }) {
  const [post, setPost] = useState(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [author, setAuthor] = useState(DEFAULT_AUTHOR);
  const [authorModalOpen, setAuthorModalOpen] = useState(false);

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
          if (data && data.name) setAuthor(data);
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

          {/* Author Header Meta (Clickable to open profile popup) */}
          {author && (
            <div 
              onClick={() => setAuthorModalOpen(true)}
              className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-200 dark:border-white/10 cursor-pointer group hover:opacity-90 transition-all w-fit"
              title="Yazar profilini görüntülemek için tıklayın"
            >
              <div className="relative">
                <img
                  src={formatBlogImageUrl(author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb')}
                  alt={author.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-cyan-400/50 shadow group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                  <span>{author.name || "Oxypace"}</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-normal">
                    {author.badge || "Yazar"}
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    (Profili Gör →)
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  {author.title || "Oxypace Kurucusu & Baş Yazarı"}
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
          <div className="mt-14 border-t border-zinc-200 dark:border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 uppercase tracking-widest">Paylaş:</span>
              <button 
                onClick={() => {
                  const url = window.location.href;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`, '_blank');
                }}
                className="border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 px-3 py-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-all cursor-pointer"
              >
                Twitter/X
              </button>
              <button 
                onClick={() => {
                  const url = window.location.href;
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                }}
                className="border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 px-3 py-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-all cursor-pointer"
              >
                LinkedIn
              </button>
            </div>
            
            <a
              href="/blog"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-accent transition-colors"
            >
              [ ← ARŞİVE GERİ DÖN ]
            </a>
          </div>
        </article>
      </main>

      {/* Author Profile Popup Modal Window */}
      {authorModalOpen && author && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setAuthorModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md rounded-3xl border border-white/15 bg-zinc-900/95 p-6 sm:p-8 text-white shadow-2xl space-y-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glows */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button 
              onClick={() => setAuthorModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center text-center space-y-3 relative">
              <img
                src={formatBlogImageUrl(author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb')}
                alt={author.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400 shadow-xl shadow-cyan-500/20"
              />
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-white">{author.name || "Oxypace"}</h3>
                  <span className="text-[10px] bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                    {author.badge || "Baş Yazar"}
                  </span>
                </div>
                <p className="text-xs font-mono text-cyan-400 font-medium">{author.title || "Oxypace Kurucusu & Baş Yazarı"}</p>
              </div>
            </div>

            {/* Bio */}
            <div className="border-t border-b border-white/10 py-4">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-2">Hakkında & Biyografi</h4>
              <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                {author.bio || "Teorik fizik, kozmoloji ve yüksek performanslı yazılım mimarileri üzerine araştırmalar yapıyor."}
              </p>
            </div>

            {/* Social Links */}
            {(author.github || author.twitter || author.website || author.linkedin) && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">Bağlantılar</h4>
                <div className="flex flex-wrap items-center justify-center gap-2.5 font-mono text-xs">
                  {author.github && (
                    <a href={author.github} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/50 text-zinc-300 hover:text-cyan-300 transition-all">
                      GitHub ↗
                    </a>
                  )}
                  {author.twitter && (
                    <a href={author.twitter} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/50 text-zinc-300 hover:text-cyan-300 transition-all">
                      Twitter/X ↗
                    </a>
                  )}
                  {author.website && (
                    <a href={author.website} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/50 text-zinc-300 hover:text-cyan-300 transition-all">
                      Web Sitesi ↗
                    </a>
                  )}
                  {author.linkedin && (
                    <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/50 text-zinc-300 hover:text-cyan-300 transition-all">
                      LinkedIn ↗
                    </a>
                  )}
                </div>
              </div>
            )}
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

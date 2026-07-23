"use client";

import { useState, useEffect } from "react";
import ReadingProgressBar from "../components/ReadingProgressBar";
import CookieConsent from "../components/CookieConsent";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { formatBlogImageUrl } from "../utils/imageHelper";

export default function ArticleClient({ initialPost, slug }) {
  const [post, setPost] = useState(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    // Fetch Author Profile
    const fetchAuthor = async () => {
      try {
        const authorUrl = typeof window !== 'undefined'
          ? (window.location.origin.includes('localhost') ? 'http://localhost:5000/api/blog/author' : '/api/blog/author')
          : '/api/blog/author';
        const res = await fetch(authorUrl);
        if (res.ok) {
          const data = await res.json();
          if (data) setAuthor(data);
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
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 mb-6">
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
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-8 leading-tight uppercase font-sans">
            {post.title}
          </h1>

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

          {/* Author Profile Box */}
          {author && (
            <div className="mt-14 p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden group">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700 pointer-events-none" />
              
              <div className="relative shrink-0">
                <img
                  src={formatBlogImageUrl(author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb')}
                  alt={author.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-cyan-400/50 shadow-xl shadow-cyan-500/10"
                />
                <span className="absolute -bottom-2 -right-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                  {author.badge || "Baş Yazar"}
                </span>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{author.name || "Oxypace"}</h3>
                    <p className="text-xs font-mono text-cyan-400/90">{author.title || "Oxypace Kurucusu & Baş Yazarı"}</p>
                  </div>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed font-sans pt-1">
                  {author.bio || "Teorik fizik, kozmoloji ve yüksek performanslı yazılım mimarileri üzerine araştırmalar yapıyor."}
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
          )}

          {/* Share Buttons / Footer */}
          <div className="mt-12 border-t border-zinc-200 dark:border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
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

      {/* Footer */}
      <Footer />

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
}

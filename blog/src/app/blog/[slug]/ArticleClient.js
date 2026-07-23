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

  useEffect(() => {
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

          {/* Share Buttons / Footer */}
          <div className="mt-16 border-t border-zinc-200 dark:border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
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

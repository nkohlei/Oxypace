"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ArticleClient from "../[slug]/ArticleClient";
import { posts as staticPosts } from "../data/posts";

function PostContent() {
  const searchParams = useSearchParams();
  let slug = searchParams.get("slug") || "";

  if (!slug && typeof window !== "undefined") {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length > 0 && parts[0] === "blog" && parts[parts.length - 1] !== "post") {
      slug = parts[parts.length - 1];
    }
  }

  const initialPost = staticPosts.find((p) => p.slug === slug) || null;

  return <ArticleClient initialPost={initialPost} slug={slug} />;
}

export default function DynamicPostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent text-foreground flex items-center justify-center p-6 font-mono text-sm text-zinc-400">
        Makale Yükleniyor...
      </div>
    }>
      <PostContent />
    </Suspense>
  );
}

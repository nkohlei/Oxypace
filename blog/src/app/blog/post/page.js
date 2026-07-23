"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ArticleClient from "../[slug]/ArticleClient";
import { posts as staticPosts } from "../data/posts";

function PostContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";

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

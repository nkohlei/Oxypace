import { posts as staticPosts } from "../data/posts";
import ArticleClient from "./ArticleClient";

export async function generateStaticParams() {
  return staticPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const initialPost = staticPosts.find((p) => p.slug === slug) || null;

  return <ArticleClient initialPost={initialPost} slug={slug} />;
}

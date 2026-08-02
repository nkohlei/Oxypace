import { posts as staticPosts } from "../data/posts";
import ArticleClient from "./ArticleClient";

export async function generateStaticParams() {
  return staticPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = staticPosts.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Makale Bulunamadı | Oxypace Blog",
    };
  }

  const cleanDescription = (post.excerpt || post.content || "")
    .replace(/<[^>]*>?/gm, "")
    .substring(0, 160)
    .trim();

  let imageUrl = "https://oxypace.com.tr/logo.png";
  if (post.image) {
    const rawImage = String(post.image).trim();
    if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
      imageUrl = rawImage;
    } else {
      const cleanPath = rawImage
        .replace(/^\/+/, "")
        .replace(/^(api\/media\/|r2-media\/)/, "")
        .replace(/^\/+/, "");
      imageUrl = `https://oxypace.com.tr/r2-media/${cleanPath}`;
    }
  }

  const url = `https://oxypace.com.tr/blog/${slug}`;

  return {
    title: `${post.title} | Oxypace Blog`,
    description: cleanDescription,
    openGraph: {
      title: post.title,
      description: cleanDescription,
      url: url,
      siteName: "Oxypace Blog",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: "article",
      publishedTime: post.date,
      authors: [post.author || "Oxypace"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: cleanDescription,
      images: [imageUrl],
      creator: "@oxypace",
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const initialPost = staticPosts.find((p) => p.slug === slug) || null;

  return <ArticleClient initialPost={initialPost} slug={slug} />;
}


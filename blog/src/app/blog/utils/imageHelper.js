export function formatBlogImageUrl(path) {
  if (!path) return 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80';

  let cleanPath = String(path).trim();

  // External images (e.g. Unsplash)
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    const r2Domain = 'pub-094a78010abf4ebf9726834268946cb8.r2.dev';
    if (cleanPath.includes(r2Domain)) {
      cleanPath = cleanPath.substring(cleanPath.indexOf(r2Domain) + r2Domain.length);
    } else {
      return cleanPath;
    }
  }

  if (cleanPath.startsWith('data:') || cleanPath.startsWith('blob:')) {
    return cleanPath;
  }

  // Strip leading slashes and prefixes
  cleanPath = cleanPath.replace(/^\/+/, '');
  cleanPath = cleanPath.replace(/^(api\/media\/|r2-media\/)/, '');
  cleanPath = cleanPath.replace(/^\/+/, '');

  // If path starts with 'post-' without folder prefix, prepend R2 folder 'posts/general/'
  if (cleanPath.startsWith('post-') && !cleanPath.startsWith('posts/')) {
    cleanPath = `posts/general/${cleanPath}`;
  }

  // Return full public Cloudflare R2 URL
  return `https://pub-094a78010abf4ebf9726834268946cb8.r2.dev/${cleanPath}`;
}

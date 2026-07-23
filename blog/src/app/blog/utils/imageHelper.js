export function formatBlogImageUrl(path) {
  if (!path) return 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80';

  let cleanPath = String(path).trim();

  // If path is external URL (e.g. Unsplash), return directly unless it's r2.dev
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    const r2Domain = 'r2.dev';
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

  // Prepend posts/general/ if path starts with post-
  if (cleanPath.startsWith('post-') && !cleanPath.startsWith('posts/')) {
    cleanPath = `posts/general/${cleanPath}`;
  }

  // Local development vs Production SSL Edge CDN URL
  if (typeof window !== 'undefined' && window.location.origin.includes('localhost')) {
    return `http://localhost:5000/api/media/${cleanPath}`;
  }

  // Production -> Fast Edge CDN proxy (/r2-media/)
  return `/r2-media/${cleanPath}`;
}

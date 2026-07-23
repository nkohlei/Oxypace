export function formatBlogImageUrl(path) {
  if (!path) return 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80';

  let cleanPath = String(path).trim();

  // Strip R2 dev domain if present
  const r2Domain = 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';
  if (cleanPath.includes(r2Domain)) {
    cleanPath = cleanPath.substring(cleanPath.indexOf(r2Domain) + r2Domain.length);
  }

  if (cleanPath.startsWith('/api/media/')) {
    cleanPath = cleanPath.substring(11);
  } else if (cleanPath.startsWith('api/media/')) {
    cleanPath = cleanPath.substring(10);
  } else if (cleanPath.startsWith('/r2-media/')) {
    cleanPath = cleanPath.substring(10);
  } else if (cleanPath.startsWith('r2-media/')) {
    cleanPath = cleanPath.substring(9);
  }

  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  // External images (e.g. Unsplash)
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  if (cleanPath.startsWith('data:') || cleanPath.startsWith('blob:')) {
    return cleanPath;
  }

  // Route through /api/media/ backend proxy to guarantee valid SSL certificate from oxypace.com.tr
  return `/api/media/${cleanPath}`;
}

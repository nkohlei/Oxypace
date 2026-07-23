export function formatBlogImageUrl(path) {
  if (!path) return 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:') || path.startsWith('blob:')) return path;

  let cleanPath = path.startsWith('/') ? path.substring(1) : path;
  if (cleanPath.startsWith('r2-media/')) {
    cleanPath = cleanPath.substring(9);
  }

  return `https://pub-094a78010abf4ebf9726834268946cb8.r2.dev/${cleanPath}`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Static export — tüm sayfalar statik HTML olarak dışa aktarılır
    // Netlify/CDN üzerinde sunulabilir, Next.js sunucusu GEREKMİYOR
    output: 'export',
    // Netlify'da /blog/ → /blog/index.html eşleşmesi için
    trailingSlash: true,
    // Blog kökten servis ediliyor, basePath gerekmez
    // (Portal SPA /portal altında olacak)
    images: {
        // Static export'ta Next.js Image optimization çalışmaz
        // unoptimized: true ile normal <img> tag'i gibi davranır
        unoptimized: true,
    },
};

export default nextConfig;


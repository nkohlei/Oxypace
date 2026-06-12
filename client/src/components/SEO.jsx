import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO bileşeni — Open Graph, Twitter Card ve standart meta etiketleri yönetir.
 *
 * Not: React SPA olduğu için bu meta etiketleri normal kullanıcılar için
 * çalışır (arama motorları, Google gibi JS çalıştırabilen botlar).
 * WhatsApp/Telegram gibi JS çalıştırmayan botlar için sunucu taraflı
 * OG injection (routes/og.js) kullanılmaktadır.
 *
 * @param {string}  title         - Sayfa başlığı
 * @param {string}  description   - Sayfa açıklaması (max ~160 karakter)
 * @param {string}  name          - Site adı
 * @param {string}  type          - OG tipi (website, article, video.other, profile)
 * @param {string}  image         - OG görsel URL'i (tam URL olmalı)
 * @param {string}  videoUrl      - Video URL'i (video gönderileri için)
 * @param {string}  videoType     - Video MIME tipi (default: video/mp4)
 * @param {string}  url           - Sayfanın kanonik URL'i
 * @param {object}  schema        - JSON-LD yapılandırılmış veri
 * @param {object}  article       - Makale bilgileri (publishedTime, author)
 * @param {boolean} noindex       - Arama motorları bu sayfayı indekslemesin mi?
 */
export default function SEO({
    title,
    description,
    name = 'Oxypace',
    type = 'website',
    image,
    videoUrl,
    videoType = 'video/mp4',
    url,
    schema,
    article,
    noindex = false
}) {
    const siteUrl = 'https://oxypace.netlify.app';
    const defaultImage = `${siteUrl}/logo.png`;
    const metaImage = image || defaultImage;
    const metaUrl = url || (typeof window !== 'undefined' ? window.location.href : siteUrl);
    const metaDescription = description || "Oxypace - Yeni Nesil Sosyal Medya Platformu. Topluluklara katılın, arkadaşlarınızla iletişim kurun.";
    const metaTitle = title ? `${title} | ${name}` : `${name} - Sosyal Medya Platformu`;

    // Video gönderisi için og:type'ı video.other olarak ayarla
    const ogType = videoUrl ? 'video.other' : type;

    return (
        <Helmet>
            {/* Standart Metadata */}
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={metaUrl} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Facebook / Open Graph */}
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={title || name} />
            <meta property="og:url" content={metaUrl} />
            <meta property="og:site_name" content={name} />
            <meta property="og:locale" content="tr_TR" />

            {/* Video OG Tags — WhatsApp ve diğer uygulamalarda video önizlemesi */}
            {videoUrl && <meta property="og:video" content={videoUrl} />}
            {videoUrl && <meta property="og:video:secure_url" content={videoUrl} />}
            {videoUrl && <meta property="og:video:type" content={videoType} />}
            {videoUrl && <meta property="og:video:width" content="1280" />}
            {videoUrl && <meta property="og:video:height" content="720" />}

            {/* Article specific */}
            {article && article.publishedTime && (
                <meta property="article:published_time" content={article.publishedTime} />
            )}
            {article && article.author && (
                <meta property="article:author" content={article.author} />
            )}

            {/* Twitter */}
            <meta name="twitter:card" content={videoUrl ? 'player' : 'summary_large_image'} />
            <meta name="twitter:site" content="@oxypace" />
            <meta name="twitter:creator" content={article?.author || name} />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />
            <meta name="twitter:image:alt" content={title || name} />

            {/* Schema.org JSON-LD */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}

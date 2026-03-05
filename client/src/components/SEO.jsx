import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({
    title,
    description,
    name = 'Oxypace',
    type = 'website',
    image,
    url,
    schema,
    article,
    noindex = false
}) {
    const siteUrl = 'https://oxypace.vercel.app';
    const defaultImage = `${siteUrl}/logo.png`;
    const metaImage = image || defaultImage;
    const metaUrl = url || (typeof window !== 'undefined' ? window.location.href : siteUrl);
    const metaDescription = description || "Oxypace - Yeni Nesil Sosyal Medya Platformu. Topluluklara katılın, arkadaşlarınızla iletişim kurun.";
    const metaTitle = title ? `${title} | ${name}` : `${name} - Sosyal Medya Platformu`;

    return (
        <Helmet>
            {/* Standart Metadata */}
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={metaUrl} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Facebook / Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:image:width" content="512" />
            <meta property="og:image:height" content="512" />
            <meta property="og:image:alt" content={title || name} />
            <meta property="og:url" content={metaUrl} />
            <meta property="og:site_name" content={name} />
            <meta property="og:locale" content="tr_TR" />

            {/* Article specific */}
            {article && article.publishedTime && (
                <meta property="article:published_time" content={article.publishedTime} />
            )}
            {article && article.author && (
                <meta property="article:author" content={article.author} />
            )}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
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

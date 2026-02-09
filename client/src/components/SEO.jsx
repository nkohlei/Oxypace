import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({
    title,
    description,
    name = 'Oxypace',
    type = 'website',
    image,
    url,
    schema
}) {
    const siteUrl = window.location.origin;
    const defaultImage = `${siteUrl}/logo.png`; // Varsayılan logo
    const metaImage = image || defaultImage;
    const metaUrl = url || window.location.href;
    const metaDescription = description || "Oxypace - Yeni Nesil Sosyal Medya Platformu. Topluluklara katılın, arkadaşlarınızla iletişim kurun.";
    const metaTitle = title ? `${title} | ${name}` : name;

    return (
        <Helmet>
            {/* Standart Metadata */}
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={metaUrl} />

            {/* Facebook / Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:url" content={metaUrl} />
            <meta property="og:site_name" content={name} />

            {/* Twitter */}
            <meta name="twitter:creator" content={name} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />

            {/* Schema.org JSON-LD */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}

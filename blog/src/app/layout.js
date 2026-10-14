import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Oxypace - Topluluk Kur ve Birlikte Film İzle",
  description: "Oxypace - Yeni nesil portal ve topluluk platformu. Kendi portalını oluştur, sesli odalarda arkadaşlarınla birlikte film izle, sohbet et ve dünyayla bağlantı kur.",
  applicationName: "Oxypace",
  metadataBase: new URL("https://oxypace.com.tr"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/logo192.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Oxypace - Topluluk Kur ve Birlikte Film İzle",
    description: "Oxypace - Yeni nesil portal ve topluluk platformu. Kendi portalını oluştur, sesli odalarda arkadaşlarınla birlikte film izle, sohbet et ve dünyayla bağlantı kur.",
    url: "https://oxypace.com.tr",
    siteName: "Oxypace",
    images: [
      {
        url: "https://oxypace.com.tr/logo.png",
        width: 512,
        height: 512,
        alt: "Oxypace Logo",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oxypace - Topluluk Kur ve Birlikte Film İzle",
    description: "Oxypace - Yeni nesil portal ve topluluk platformu. Kendi portalını oluştur, sesli odalarda arkadaşlarınla birlikte film izle, sohbet et ve dünyayla bağlantı kur.",
    images: ["https://oxypace.com.tr/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo192.png" />
        <meta name="google-site-verification" content="rwtbjVtSL--DZHB5gQfbwyj-x2CV8m6sBTakYbn78uc" />
        {/* Google Structured Data / Schema for Oxypace Logo & Sitelinks */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://oxypace.com.tr/#website",
                  "url": "https://oxypace.com.tr/",
                  "name": "Oxypace",
                  "alternateName": ["Oxypace Platformu", "Oxypace Portal"],
                  "description": "Topluluk Kur ve Birlikte Film İzle",
                  "publisher": {
                    "@id": "https://oxypace.com.tr/#organization"
                  },
                  "inLanguage": "tr-TR"
                },
                {
                  "@type": "Organization",
                  "@id": "https://oxypace.com.tr/#organization",
                  "name": "Oxypace",
                  "url": "https://oxypace.com.tr/",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://oxypace.com.tr/logo.png",
                    "caption": "Oxypace Logo"
                  },
                  "image": "https://oxypace.com.tr/logo.png"
                },
                {
                  "@type": "SiteNavigationElement",
                  "@id": "https://oxypace.com.tr/#navigation",
                  "name": "Portallara Giriş / Kayıt",
                  "description": "Oxypace topluluk portallarına giriş yapın veya yeni bir hesap oluşturun.",
                  "url": "https://oxypace.com.tr/login"
                }
              ]
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var isFirstVisitOfSession = !sessionStorage.getItem('hasVisitedThisSession');
                sessionStorage.setItem('hasVisitedThisSession', 'true');

                var pathname = window.location.pathname;
                var isBlogPath = pathname.indexOf('/blog') === 0;

                var t = localStorage.getItem('token');
                var isLoggedIn = t && t !== 'null' && t !== 'undefined' && t !== 'false' && typeof t === 'string' && t.trim().length > 20;

                // Yönlendirme SADECE ilk girişte ve SADECE ana URL ('/') adresindeyken yapılır.
                // Eğer girilen URL bir blog linki ise (/blog/...) ASLA yönlendirme yapılmaz.
                if (isFirstVisitOfSession && isLoggedIn && !isBlogPath && (pathname === '/' || pathname === '')) {
                  var topPortal = localStorage.getItem('oxypace_top_portal');
                  if (topPortal) {
                    try {
                      var parsedPortal = JSON.parse(topPortal);
                      if (parsedPortal && parsedPortal.id) {
                        window.location.replace('/portal/' + parsedPortal.id);
                        return;
                      }
                    } catch (_) {}
                  }
                  window.location.replace('/messages');
                }

                var th = localStorage.getItem('theme') || localStorage.getItem('theme_mode');
                if (th === 'dark' || (!th && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (_) {}
            `,
          }}
        />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4028999820111107" crossorigin="anonymous" />
        <script async type="application/javascript" src="https://news.google.com/swg/js/v1/swg-basic.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var lastShown = localStorage.getItem('swg_last_shown_time');
                var now = Date.now();
                var ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 saat

                if (!lastShown || (now - parseInt(lastShown, 10)) > ONE_DAY_MS) {
                  (self.SWG_BASIC = self.SWG_BASIC || []).push( function(basicSubscriptions) {
                    basicSubscriptions.init({
                      type: "NewsArticle",
                      isPartOfType: ["Product"],
                      isPartOfProductId: "CAowz_nMDA:openaccess",
                      clientOptions: { theme: "light", lang: "tr" },
                    });
                    localStorage.setItem('swg_last_shown_time', now.toString());
                  });
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}

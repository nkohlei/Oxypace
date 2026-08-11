import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WarpGridBackground from "./blog/components/WarpGridBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EVENT HORIZON - Popüler Bilim Arşivi",
  description: "Evrenin fizik sınırları ve ekstrem doğa koşulları üzerine bağımsız bilimsel arşiv.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
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
        <WarpGridBackground />
        {children}
      </body>
    </html>
  );
}

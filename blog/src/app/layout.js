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

                var t = localStorage.getItem('token');
                var isLoggedIn = t && t !== 'null' && t !== 'undefined' && t !== 'false' && typeof t === 'string' && t.trim().length > 20;

                if (isFirstVisitOfSession && isLoggedIn) {
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
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <WarpGridBackground />
        {children}
      </body>
    </html>
  );
}

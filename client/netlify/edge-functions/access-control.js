let isMaintenanceCached = null;
let lastFetched = 0;

const BACKEND_URL = "https://unlikely-rosamond-oxypace-e695aebb.koyeb.app";

async function getMaintenanceStatus() {
  const now = Date.now();
  // Son fetch işleminden beri 5 saniye geçmediyse önbellekteki değeri dön
  if (isMaintenanceCached !== null && (now - lastFetched < 5000)) {
    return isMaintenanceCached;
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/maintenance-status`);
    if (!res.ok) return false;
    const data = await res.json();
    isMaintenanceCached = !!data.active;
    lastFetched = now;
    return isMaintenanceCached;
  } catch (e) {
    console.error("Failed to fetch maintenance status in Edge Function:", e);
    return false; // Hata durumunda siteyi açık tut (fail-safe)
  }
}

/**
 * Bot User-Agent tespiti
 * WhatsApp, Telegram, Facebook, Twitter, Discord, Slack vb. botlar
 */
function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  const botPatterns = [
    "whatsapp",
    "facebookexternalhit",
    "facebot",
    "twitterbot",
    "telegrambot",
    "linkedinbot",
    "slackbot",
    "discordbot",
    "pinterest",
    "vkshare",
    "skype",
    "viber",
    "googlebot",
    "bingbot",
    "applebot",
    "duckduckbot",
    "baiduspider",
    "yandexbot",
    "semrushbot",
    "ahrefsbot",
    "curl/",
    "python-requests",
    "ia_archiver",
    "rogerbot",
    "ogpreviewfetcher",
  ];
  return botPatterns.some((pattern) => ua.includes(pattern));
}

/**
 * OG yönlendirme path'lerini eşleştir
 * /post/:id           → /og/post/:id
 * /profile/:username  → /og/profile/:username
 * /portal/:id         → /og/portal/:id
 */
const OG_PATTERNS = [
  { regex: /^\/post\/([a-f0-9]{24})$/i, path: (m) => `/og/post/${m[1]}` },
  { regex: /^\/profile\/([a-zA-Z0-9_.]{1,50})$/, path: (m) => `/og/profile/${m[1]}` },
  { regex: /^\/portal\/([a-f0-9]{24})$/i, path: (m) => `/og/portal/${m[1]}` },
];

async function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const binarySign = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify("HMAC", key, binarySign, data);
    
    return isValid ? payload : null;
  } catch (e) {
    return null;
  }
}

export default async (request, context) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userAgent = request.headers.get("user-agent") || "";

  // 1. Statik dosya isteklerini (js, css, resimler vb.) doğrudan geçir
  const isStaticAsset = pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|map|json|txt|webmanifest)$/i);
  if (isStaticAsset) {
    return context.next();
  }

  // 2. API, WebSocket, medya yolları ve hata sayfasının kendisini doğrudan geçir
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/og/") ||
    pathname.startsWith("/socket.io/") ||
    pathname.startsWith("/r2-media/") ||
    pathname === "/404.html"
  ) {
    return context.next();
  }

  // 4. ── BOT TESPİTİ & OG YÖNLENDİRME ──────────────────────────────────────
  if (isBot(userAgent)) {
    for (const { regex, path } of OG_PATTERNS) {
      const match = pathname.match(regex);
      if (match) {
        const ogUrl = `${BACKEND_URL}${path(match)}`;
        console.log(`[OG Edge] Bot (${userAgent.substring(0, 50)}) → ${ogUrl}`);
        try {
          const ogResponse = await fetch(ogUrl, {
            headers: {
              "User-Agent": userAgent,
              "Accept": "text/html",
            },
          });
          const html = await ogResponse.text();
          return new Response(html, {
            status: ogResponse.status,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=300",
              "X-OG-Served": "true",
            },
          });
        } catch (fetchErr) {
          console.error("[OG Edge] Fetch error:", fetchErr.message);
          return context.next();
        }
      }
    }
  }

  // 5. Bakım Modu aktif mi kontrol et
  const isMaintenance = await getMaintenanceStatus();
  if (!isMaintenance) {
    return context.next();
  }

  // 6. Bakım aktifse çerez kontrolü yap: Eğer token çerezi varsa ve admin ise siteye normal erişime izin ver
  const token = context.cookies.get("token");
  let hasAccess = false;
  if (token) {
    const secret = Deno.env.get("JWT_SECRET");
    if (secret) {
      const decoded = await verifyJwt(token, secret);
      if (decoded && decoded.isAdmin === true) {
        hasAccess = true;
      }
    }
  }

  if (hasAccess) {
    return context.next();
  }

  // 7. Çerez yoksa ve bakım aktifse sahte 404 sayfasına yönlendir (rewrite)
  return new URL("/404.html", request.url);
};

import sys
import re
import json
from curl_cffi import requests

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

def is_challenge(text):
    if not text or len(text) < 40:
        return True
    lower = text.lower()
    return (
        '<title>just a moment...</title>' in lower
        or '<title>attention required! | cloudflare</title>' in lower
        or 'cf-browser-verification' in lower
        or 'error code: 1005' in lower
        or 'error code: 444' in lower
    )

def is_takedown(text):
    if not text:
        return False
    return '451 - yasal nedenlerle' in text.lower() or 'yasal nedenlerle erisime kapali' in text.lower()

def fetch_url(url, referer=None, use_proxy=True, method="GET", data=None, extra_headers=None, timeout_sec=5):
    is_hdf_ajax = bool(re.search(r'hdfilmcehennemi\.[^/]+/(?:search/|video/\d+)', url, re.I))
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    if referer:
        headers['Referer'] = referer
    if '?do=' in url or 'getVideo' in url or 'source2.php' in url:
        headers['X-Requested-With'] = 'XMLHttpRequest'
    elif is_hdf_ajax:
        headers['x-requested-with'] = 'fetch'
        headers['Accept'] = 'application/json, text/plain, */*'
        if not headers.get('Referer'):
            headers['Referer'] = 'https://www.hdfilmcehennemi.nl/'
    if method.upper() == 'POST' and data:
        headers['Content-Type'] = 'application/json'
    if isinstance(extra_headers, dict):
        for k, v in extra_headers.items():
            if v is not None and v != '':
                headers[str(k)] = str(v)

    proxies = {
        'http': 'socks5h://127.0.0.1:9050',
        'https': 'socks5h://127.0.0.1:9050'
    } if use_proxy else None

    # Direct Chrome 124 TLS first (fast, ~0.4-1.5s); Tor fallback only if direct fails/is challenged
    attempts = [None] + ([proxies] if use_proxy else [])
    takedown_fallback = ""
    for px in attempts:
        try:
            kwargs = {
                'impersonate': 'chrome124',
                'headers': headers,
                'timeout': 6 if px else timeout_sec,
            }
            if px:
                kwargs['proxies'] = px
            if method.upper() == 'POST' or '?do=' in url:
                if data is not None:
                    kwargs['data'] = data
                r = requests.post(url, **kwargs)
            else:
                r = requests.get(url, **kwargs)
            if r.status_code == 200 and not is_challenge(r.text):
                if is_takedown(r.text):
                    if not takedown_fallback:
                        takedown_fallback = r.text
                    continue
                return r.text
            if r.status_code == 451 and r.text and not takedown_fallback:
                takedown_fallback = r.text
        except Exception:
            pass

    return takedown_fallback

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("")
        sys.exit(0)

    target = sys.argv[1]
    ref = sys.argv[2] if len(sys.argv) > 2 else ""
    method = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else ("POST" if "?do=" in target else "GET")
    post_data = sys.argv[4] if len(sys.argv) > 4 else None
    extra_hdrs = None
    use_tor = True
    if len(sys.argv) > 5 and sys.argv[5]:
        try:
            parsed = json.loads(sys.argv[5])
            if isinstance(parsed, dict):
                extra_hdrs = parsed
        except Exception:
            pass
    if len(sys.argv) > 6 and sys.argv[6] == "no_tor":
        use_tor = False
    content = fetch_url(target, ref, use_proxy=use_tor, method=method, data=post_data, extra_headers=extra_hdrs)
    sys.stdout.write(content)

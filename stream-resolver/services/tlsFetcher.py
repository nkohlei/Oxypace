import sys
import os
import re
import json
import socket
from urllib.parse import urlparse, urlunparse
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
    lower = text.lower()
    return '451 - yasal nedenlerle' in lower or 'yasal nedenlerle erisime kapali' in lower


def is_tor_open(host='127.0.0.1', port=9050):
    try:
        with socket.create_connection((host, port), timeout=0.25):
            return True
    except Exception:
        return False


def build_env_proxy():
    raw = (os.environ.get('PROXY_SERVER') or '').strip()
    if not raw:
        return None
    if '://' not in raw:
        raw = 'http://' + raw
    username = (os.environ.get('PROXY_USERNAME') or '').strip()
    password = (os.environ.get('PROXY_PASSWORD') or '').strip()
    try:
        parsed = urlparse(raw)
        if username and not parsed.username:
            auth = f"{username}:{password}@" if password else f"{username}@"
            netloc = f"{auth}{parsed.netloc}"
            raw = urlunparse((parsed.scheme, netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
    except Exception:
        pass
    if raw.startswith('socks5://'):
        raw = 'socks5h://' + raw[len('socks5://'):]
    return {'http': raw, 'https': raw}


def fetch_url(url, referer=None, use_proxy=True, method="GET", data=None, extra_headers=None, timeout_sec=5):
    is_hdf = bool(re.search(r'hdfilmcehennemi\.[^/]+', url, re.I))
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
            parsed_u = urlparse(url)
            headers['Referer'] = f"{parsed_u.scheme}://{parsed_u.netloc}/"
    if method.upper() == 'POST' and data:
        headers['Content-Type'] = 'application/json'
    if isinstance(extra_headers, dict):
        for k, v in extra_headers.items():
            if v is not None and v != '':
                headers[str(k)] = str(v)

    env_proxies = build_env_proxy() if use_proxy else None
    tor_proxies = ({
        'http': 'socks5h://127.0.0.1:9050',
        'https': 'socks5h://127.0.0.1:9050'
    } if (use_proxy and is_tor_open()) else None)

    attempts = []
    if env_proxies:
        attempts.append(('env_proxy', env_proxies, max(timeout_sec, 6)))
    if is_hdf:
        # HDF geo-blocks OCI Frankfurt with HTTP 451; prefer proxy/Tor first just like deb5aa8.
        if tor_proxies:
            attempts.append(('tor', tor_proxies, max(timeout_sec, 7)))
        attempts.append(('direct', None, timeout_sec))
    else:
        attempts.append(('direct', None, timeout_sec))
        if tor_proxies:
            attempts.append(('tor', tor_proxies, max(timeout_sec, 6)))

    proxy_takedown = ""
    for kind, px, tmo in attempts:
        for imp in ('chrome124', 'chrome120'):
            try:
                kwargs = {
                    'impersonate': imp,
                    'headers': headers,
                    'timeout': tmo,
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
                        if kind != 'direct' and not proxy_takedown:
                            proxy_takedown = r.text
                        break
                    return r.text
                if r.status_code == 451 and r.text:
                    if kind != 'direct' and not proxy_takedown:
                        proxy_takedown = r.text
                break
            except Exception as e:
                msg = str(e).lower()
                if 'impersonat' in msg and imp == 'chrome124':
                    continue
                break

    return proxy_takedown

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

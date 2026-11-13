import os
import socket
import sys
from urllib.parse import quote, urlparse, urlunparse
from curl_cffi import requests


def _is_tor_open(host="127.0.0.1", port=9050, timeout=0.25):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _build_env_proxy():
    raw = (os.environ.get("PROXY_SERVER") or "").strip()
    if not raw:
        return None
    if "://" not in raw:
        raw = f"http://{raw}"
    parsed = urlparse(raw)
    user = (os.environ.get("PROXY_USERNAME") or "").strip()
    pwd = (os.environ.get("PROXY_PASSWORD") or "").strip()
    if user and not parsed.username:
        auth = quote(user, safe="")
        if pwd:
            auth = f"{auth}:{quote(pwd, safe='')}"
        netloc = f"{auth}@{parsed.hostname}"
        if parsed.port:
            netloc = f"{netloc}:{parsed.port}"
        raw = urlunparse((parsed.scheme, netloc, parsed.path or "", "", "", ""))
    return {"http": raw, "https": raw}


def fetch_url(url, referer=None, use_proxy=True, method="GET", data=None):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    if referer:
        headers['Referer'] = referer
    if '?do=' in url or 'getVideo' in url:
        headers['X-Requested-With'] = 'XMLHttpRequest'
    elif 'hdfilmcehennemi' in url:
        headers['x-requested-with'] = 'fetch'
        headers['Accept'] = 'application/json, text/plain, */*'
        if not headers.get('Referer'):
            headers['Referer'] = 'https://www.hdfilmcehennemi.nl/'

    def _try_request(proxies, timeout_sec):
        try:
            if method == "POST" or '?do=' in url:
                r = requests.post(url, impersonate="chrome124", headers=headers, data=data, proxies=proxies, timeout=timeout_sec)
            else:
                r = requests.get(url, impersonate="chrome124", headers=headers, proxies=proxies, timeout=timeout_sec)
            if r.status_code == 200 and len(r.text) > 0:
                return r.text
        except Exception:
            pass
        return ""

    # 1. Configured PROXY_SERVER (residential/TR proxy if set in .env)
    env_proxies = _build_env_proxy() if use_proxy else None
    if env_proxies:
        res = _try_request(env_proxies, 12)
        if res:
            return res

    # 2. Tor SOCKS5 + TLS Impersonation (only if 127.0.0.1:9050 is open)
    if use_proxy and _is_tor_open():
        tor_proxies = {'http': 'socks5h://127.0.0.1:9050', 'https': 'socks5h://127.0.0.1:9050'}
        res = _try_request(tor_proxies, 12)
        if res:
            return res

    # 3. Direct TLS Impersonation (No Proxy)
    return _try_request(None, 10)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("")
        sys.exit(0)

    target = sys.argv[1]
    ref = sys.argv[2] if len(sys.argv) > 2 else ""
    method = sys.argv[3] if len(sys.argv) > 3 else ("POST" if "?do=" in target else "GET")
    content = fetch_url(target, ref, method=method)
    sys.stdout.write(content)

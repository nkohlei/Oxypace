import sys
import json
from curl_cffi import requests

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

    proxies = None
    if use_proxy:
        proxies = {
            'http': 'socks5h://127.0.0.1:9050',
            'https': 'socks5h://127.0.0.1:9050'
        }

    # 1. Tor + TLS Impersonation
    if use_proxy:
        try:
            if method == "POST" or '?do=' in url:
                r = requests.post(url, impersonate="chrome124", headers=headers, data=data, proxies=proxies, timeout=12)
            else:
                r = requests.get(url, impersonate="chrome124", headers=headers, proxies=proxies, timeout=12)
            if r.status_code == 200 and len(r.text) > 0:
                return r.text
        except Exception:
            pass

    # 2. Direct TLS Impersonation (No Proxy)
    try:
        if method == "POST" or '?do=' in url:
            r = requests.post(url, impersonate="chrome124", headers=headers, data=data, timeout=10)
        else:
            r = requests.get(url, impersonate="chrome124", headers=headers, timeout=10)
        if r.status_code == 200 and len(r.text) > 0:
            return r.text
    except Exception:
        pass

    return ""

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("")
        sys.exit(0)

    target = sys.argv[1]
    ref = sys.argv[2] if len(sys.argv) > 2 else ""
    method = sys.argv[3] if len(sys.argv) > 3 else ("POST" if "?do=" in target else "GET")
    content = fetch_url(target, ref, method=method)
    sys.stdout.write(content)

from curl_cffi import requests
import json

url = 'https://myplayersvideo.xyz/fireplayer/video/7de47452d56d59cf1b1e1542f9baeb13?do=getVideo'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': 'https://myplayersvideo.xyz/fireplayer/video/7de47452d56d59cf1b1e1542f9baeb13',
    'X-Requested-With': 'XMLHttpRequest'
}
proxies = {
    'http': 'socks5h://127.0.0.1:9050',
    'https': 'socks5h://127.0.0.1:9050'
}

r = requests.post(url, headers=headers, proxies=proxies, impersonate="chrome124", timeout=15)
print("STATUS:", r.status_code)
print("BODY:", r.text)

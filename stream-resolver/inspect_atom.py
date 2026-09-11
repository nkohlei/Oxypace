with open('/home/ubuntu/rapidvid.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

idx = html.find('function av(o)')
print("=== SCRIPT BEFORE AV ===")
print(html[max(0, idx - 1000):idx])

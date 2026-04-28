import re

file_path = 'client/src/components/ConferenceChannel.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if 'import { Crown' not in content:
    content = re.sub(
        r'(import .*? from \'lucide-react\';\n)?import \'\./ConferenceChannel\.css\';',
        'import { Crown, Shield, X, Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, Settings, Users, Maximize, MessageCircle } from \'lucide-react\';\nimport \'./ConferenceChannel.css\';',
        content
    )

# 1. Crown / Founder
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fbbf24\" strokeWidth=\"2\" width=\"14\" height=\"14\" title=\"Kurucu\">.*?</svg>',
    '<Crown size={14} color="#fbbf24" strokeWidth={2} title="Kurucu" />',
    content, flags=re.DOTALL
)

# 2. Shield / Admin
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#60a5fa\" strokeWidth=\"2\" width=\"14\" height=\"14\" title=\"Yönetici\">.*?</svg>',
    '<Shield size={14} color="#60a5fa" strokeWidth={2} title="Yönetici" />',
    content, flags=re.DOTALL
)

# 3. Settings in top header
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\.5\">.*?</svg>',
    '<Settings size={20} strokeWidth={2.5} />',
    content, flags=re.DOTALL
)

# 4. Settings icon width=14
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\">.*?</svg>',
    '<Settings size={14} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 5. Microphone icon (width=40 / width=20)
content = re.sub(
    r'<svg width=\"40\" height=\"40\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"1\.5\">.*?</svg>',
    '<Mic size={40} strokeWidth={1.5} />',
    content, flags=re.DOTALL
)

# Replace remaining MicOff icons
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" width=\"20\" height=\"20\">\s*<line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\" />\s*<path d=\"M9 9v3a3 3 0 0 0 5\.12 2\.12M15 9\.34V4a3 3 0 0 0-5\.94-\.6\" />.*?</svg>',
    '<MicOff size={20} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# Replace Mic icons
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" width=\"20\" height=\"20\">\s*<path d=\"M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z\" />.*?</svg>',
    '<Mic size={20} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# Replace VideoOff
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" width=\"24\" height=\"24\">\s*<path d=\"M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2\" />\s*<line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\" />\s*</svg>',
    '<VideoOff size={24} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# Replace Video
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" width=\"24\" height=\"24\">\s*<polygon points=\"23 7 16 12 23 17 23 7\" />\s*<rect x=\"1\" y=\"5\" width=\"15\" height=\"14\" rx=\"2\" ry=\"2\" />\s*</svg>',
    '<Video size={24} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# Replace ScreenShare
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" width=\"22\" height=\"22\">\s*<rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\" ry=\"2\" />\s*<line x1=\"8\" y1=\"21\" x2=\"16\" y2=\"21\" />.*?</svg>',
    '<ScreenShare size={22} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# Replace Maximize
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" width=\"20\" height=\"20\">\s*<polyline points=\"15 3 21 3 21 9\" />.*?</svg>',
    '<Maximize size={20} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# Replace Users
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" width=\"20\" height=\"20\">\s*<path d=\"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\" />.*?</svg>',
    '<Users size={20} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# Replace MessageCircle
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" width=\"20\" height=\"20\">\s*<path d=\"M21 11\.5a8\.38 8\.38 0 0 1-\.9 3\.8 8\.5 8\.5 0 0 1-7\.6 4\.7 8\.38 8\.38 0 0 1-3\.8-\.9L3 21l1\.9-5\.7a8\.38 8\.38 0 0 1-\.9-3\.8 8\.5 8\.5 0 0 1 4\.7-7\.6 8\.38 8\.38 0 0 1 3\.8-\.9h\.5a8\.48 8\.48 0 0 1 8 8v\.5z\" />\s*</svg>',
    '<MessageCircle size={20} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# Replace PhoneOff
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" width=\"24\" height=\"24\">\s*<path d=\"M10\.68 13\.31a16 16 0 0 0 3\.41 2\.6l1\.27-1\.27a2 2 0 0 1 2\.11-\.45 12\.84 12\.84 0 0 0 2\.81\.7 2 2 0 0 1 1\.72 2v3a2 2 0 0 1-2\.18 2 19\.79 19\.79 0 0 1-8\.63-3\.07 19\.42 19\.42 0 0 1-3\.33-2\.67m-2\.67-3\.34a19\.79 19\.79 0 0 1-3\.07-8\.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1\.72 12\.84 12\.84 0 0 0 \.7 2\.81 2 2 0 0 1-\.45 2\.11L8.09 9.91\" />\s*<line x1=\"22\" y1=\"2\" x2=\"2\" y2=\"22\" />\s*</svg>',
    '<PhoneOff size={24} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# Replace small X
content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" stroke=\"currentColor\" strokeWidth=\"2\" fill=\"none\">\s*<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line>\s*<line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line>\s*</svg>',
    '<X size={20} strokeWidth={2} />',
    content, flags=re.DOTALL
)

content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" stroke=\"currentColor\" strokeWidth=\"3\" fill=\"none\">\s*<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line>\s*<line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line>\s*</svg>',
    '<X size={14} strokeWidth={3} />',
    content, flags=re.DOTALL
)

content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" width=\"12\" height=\"12\">.*?</svg>',
    '<MicOff size={12} strokeWidth={2} />',
    content, flags=re.DOTALL
)

content = re.sub(
    r'<svg viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" stroke=\"currentColor\" strokeWidth=\"3\" fill=\"none\">\s*<polyline points=\"20 6 9 17 4 12\"></polyline>\s*</svg>',
    '<Check size={14} strokeWidth={3} />',
    content, flags=re.DOTALL
)

if 'Check' not in content and '{ Crown' in content:
    content = content.replace('import { Crown', 'import { Crown, Check')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

import re

file_path = 'client/src/components/PortalSettingsModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if 'import { Settings' not in content:
    content = re.sub(
        r'(import .*? from \'lucide-react\';\n)?import \'\./PortalSettingsModal\.css\';',
        'import { Settings, Lock, List, Users, Ban, MapPin, AlertTriangle, X, Globe, Search, Check, Pencil, Trash2, ArrowUp, ArrowDown, UserMinus } from \'lucide-react\';\nimport \'./PortalSettingsModal.css\';',
        content
    )

# 1. Overview Tab
content = re.sub(
    r'<svg[^>]*>\s*<circle cx="12" cy="12" r="3"></circle>\s*<path d="M19\.4 15.*?</svg>',
    '<Settings size={20} strokeWidth={2} style={{ minWidth: \'20px\' }} />',
    content, flags=re.DOTALL
)

# 2. Access Tab
content = re.sub(
    r'<svg[^>]*>\s*<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>\s*<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>\s*</svg>',
    '<Lock size={20} strokeWidth={2} style={{ minWidth: \'20px\' }} />',
    content, flags=re.DOTALL
)

# 3. Channels Tab
content = re.sub(
    r'<svg[^>]*>\s*<line x1="8" y1="6" x2="21" y2="6"></line>\s*<line x1="8" y1="12" x2="21" y2="12"></line>\s*<line x1="8" y1="18" x2="21" y2="18"></line>\s*<line x1="3" y1="6" x2="3\.01" y2="6"></line>\s*<line x1="3" y1="12" x2="3\.01" y2="12"></line>\s*<line x1="3" y1="18" x2="3\.01" y2="18"></line>\s*</svg>',
    '<List size={20} strokeWidth={2} style={{ minWidth: \'20px\' }} />',
    content, flags=re.DOTALL
)

# 4. Members Tab
content = re.sub(
    r'<svg[^>]*>\s*<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>\s*<circle cx="9" cy="7" r="4"></circle>\s*<path d="M23 21v-2a4 4 0 0 0-3-3\.87"></path>\s*<path d="M16 3\.13a4 4 0 0 1 0 7\.75"></path>\s*</svg>',
    '<Users size={20} strokeWidth={2} style={{ minWidth: \'20px\' }} />',
    content, flags=re.DOTALL
)

# 5. Banned Tab
content = re.sub(
    r'<svg[^>]*>\s*<circle cx="12" cy="12" r="10"></circle>\s*<line x1="4\.93" y1="4\.93" x2="19\.07" y2="19\.07"></line>\s*</svg>',
    '<Ban size={20} strokeWidth={2} style={{ minWidth: \'20px\' }} />',
    content, flags=re.DOTALL
)

# 6. Location Tab
content = re.sub(
    r'<svg[^>]*>\s*<circle cx="12" cy="10" r="3"></circle>\s*<path d="M12 2C8\.13 2 5 5\.13 5 9c0 5\.25 7 13 7 13s7-7\.75 7-13c0-3\.87-3\.13-7-7-7z"></path>\s*</svg>',
    '<MapPin size={20} strokeWidth={2} style={{ minWidth: \'20px\' }} />',
    content, flags=re.DOTALL
)

# 7. Advanced Tab
content = re.sub(
    r'<svg[^>]*>\s*<path d="M10\.29 3\.86L1\.82 18a2 2 0 0 0 1\.71 3h16\.94a2 2 0 0 0 1\.71-3L13\.71 3\.86a2 2 0 0 0-3\.42 0z"></path>\s*<line x1="12" y1="9" x2="12" y2="13"></line>\s*<line x1="12" y1="17" x2="12\.01" y2="17"></line>\s*</svg>',
    '<AlertTriangle size={20} strokeWidth={2} color="#ef4444" style={{ minWidth: \'20px\' }} />',
    content, flags=re.DOTALL
)

# 8. Close modal button
content = re.sub(
    r'<button className="close-settings-btn" onClick=\{onClose\}>\s*<svg[^>]*>\s*<line x1="18" y1="6" x2="6" y2="18"></line>\s*<line x1="6" y1="6" x2="18" y2="18"></line>\s*</svg>\s*</button>',
    '<button className="close-settings-btn" onClick={onClose}><X size={24} strokeWidth={2} /></button>',
    content, flags=re.DOTALL
)

# 9. Privacy Public
content = re.sub(
    r'<svg className="privacy-row-icon"[^>]*>\s*<circle cx="12" cy="12" r="10"></circle>\s*<line x1="2" y1="12" x2="22" y2="12"></line>\s*<path d="M12 2a15\.3 15\.3 0 0 1 4 10 15\.3 15\.3 0 0 1-4 10 15\.3 15\.3 0 0 1-4-10 15\.3 15\.3 0 0 1 4-10z"></path>\s*</svg>',
    '<Globe size={24} strokeWidth={2} className="privacy-row-icon" />',
    content, flags=re.DOTALL
)

# 10. Privacy Restricted
content = re.sub(
    r'<svg className="privacy-row-icon"[^>]*>\s*<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>\s*<circle cx="9" cy="7" r="4"></circle>\s*<path d="M23 21v-2a4 4 0 0 0-3-3\.87"></path>\s*<path d="M16 3\.13a4 4 0 0 1 0 7\.75"></path>\s*</svg>',
    '<Users size={24} strokeWidth={2} className="privacy-row-icon" />',
    content, flags=re.DOTALL
)

# 11. Privacy Private
content = re.sub(
    r'<svg className="privacy-row-icon"[^>]*>\s*<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>\s*<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>\s*</svg>',
    '<Lock size={24} strokeWidth={2} className="privacy-row-icon" />',
    content, flags=re.DOTALL
)

# 12. Search icons
content = re.sub(
    r'<svg className="search-icon"[^>]*>\s*<circle cx="11" cy="11" r="8"></circle>\s*<line x1="21" y1="21" x2="16\.65" y2="16\.65"></line>\s*</svg>',
    '<Search size={18} strokeWidth={2} className="search-icon" />',
    content, flags=re.DOTALL
)

# 13. Remove user icon (X)
content = re.sub(
    r'<svg width="18" height="18"[^>]*>\s*<line x1="18" y1="6" x2="6" y2="18"></line>\s*<line x1="6" y1="6" x2="18" y2="18"></line>\s*</svg>',
    '<X size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 14. Channel check / edit done
content = re.sub(
    r'<svg\s*width="18"\s*height="18"\s*viewBox="0 0 24 24"\s*fill="none"\s*stroke="currentColor"\s*strokeWidth="2"\s*>\s*<polyline points="20 6 9 17 4 12"></polyline>\s*</svg>',
    '<Check size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 15. Channel Edit icon
content = re.sub(
    r'<svg[^>]*>\s*<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>\s*<path d="M18\.5 2\.5a2\.121 2\.121 0 0 1 3 3L12 15l-4 1 1-4 9\.5-9\.5z"></path>\s*</svg>',
    '<Pencil size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 16. Channel Delete icon
content = re.sub(
    r'<svg[^>]*>\s*<polyline points="3 6 5 6 21 6"></polyline>\s*<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>\s*</svg>',
    '<Trash2 size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 17. Promote admin
content = re.sub(
    r'<svg[^>]*>\s*<path d="M12 2l3\.09 6\.26L22 9\.27l-5 4\.87 1\.18 6\.88L12 17\.77l-6\.18 3\.25L7 14\.14 2 9\.27l6\.91-1\.01L12 2z"></path>\s*</svg>',
    '<ArrowUp size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 18. Demote admin
content = re.sub(
    r'<svg[^>]*>\s*<circle\s*cx="12"\s*cy="12"\s*r="10"\s*></circle>\s*<line\s*x1="8"\s*y1="12"\s*x2="16"\s*y2="12"\s*></line>\s*</svg>',
    '<ArrowDown size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 19. Kick member
content = re.sub(
    r'<svg[^>]*>\s*<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>\s*<circle\s*cx="8\.5"\s*cy="7"\s*r="4"\s*></circle>\s*<line\s*x1="23"\s*y1="11"\s*x2="17"\s*y2="11"\s*></line>\s*</svg>',
    '<UserMinus size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 20. Block member
content = re.sub(
    r'<svg[^>]*>\s*<circle\s*cx="12"\s*cy="12"\s*r="10"\s*></circle>\s*<line\s*x1="4\.93"\s*y1="4\.93"\s*x2="19\.07"\s*y2="19\.07"\s*></line>\s*</svg>',
    '<Ban size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

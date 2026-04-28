import re

file_path = 'client/src/components/PortalNotifications.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if 'import { UserPlus' not in content:
    content = re.sub(
        r'(import .*? from \'lucide-react\';\n)?import \'\./PortalNotifications\.css\';',
        'import { UserPlus, Users, AlertTriangle, Check, X, CheckCircle } from \'lucide-react\';\nimport \'./PortalNotifications.css\';',
        content
    )

# 1. Requests tab icon
content = re.sub(
    r'<svg[^>]*>\s*<path d=\"M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"></path>\s*<circle cx=\"8\.5\" cy=\"7\" r=\"4\"></circle>\s*<line x1=\"20\" y1=\"8\" x2=\"20\" y2=\"14\"></line>\s*<line x1=\"23\" y1=\"11\" x2=\"17\" y2=\"11\"></line>\s*</svg>',
    '<UserPlus size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 2. Members tab icon
content = re.sub(
    r'<svg[^>]*>\s*<path d=\"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"></path>\s*<circle cx=\"9\" cy=\"7\" r=\"4\"></circle>\s*<path d=\"M23 21v-2a4 4 0 0 0-3-3\.87\"></path>\s*<path d=\"M16 3\.13a4 4 0 0 1 0 7\.75\"></path>\s*</svg>',
    '<Users size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 3. Alerts tab icon
content = re.sub(
    r'<svg[^>]*>\s*<path d=\"M10\.29 3\.86L1\.82 18a2 2 0 0 0 1\.71 3h16\.94a2 2 0 0 0 1\.71-3L13\.71 3\.86a2 2 0 0 0-3\.42 0z\"/>\s*<line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/>\s*<line x1=\"12\" y1=\"17\" x2=\"12\.01\" y2=\"17\"/>\s*</svg>',
    '<AlertTriangle size={18} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 4. Approve btn
content = re.sub(
    r'<svg[^>]*>\s*<polyline points=\"20 6 9 17 4 12\"></polyline>\s*</svg>',
    '<Check size={16} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 5. Reject btn
content = re.sub(
    r'<svg[^>]*>\s*<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line>\s*<line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line>\s*</svg>',
    '<X size={16} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 6. Member badge
content = re.sub(
    r'<svg[^>]*>\s*<path d=\"M22 11\.08V12a10 10 0 1 1-5\.93-9\.14\"></path>\s*<polyline points=\"22 4 12 14\.01 9 11\.01\"></polyline>\s*</svg>',
    '<CheckCircle size={16} strokeWidth={2} />',
    content, flags=re.DOTALL
)

# 7. Alert avatar
content = re.sub(
    r'<svg[^>]*>\s*<path d=\"M10\.29 3\.86L1\.82 18a2 2 0 0 0 1\.71 3h16\.94a2 2 0 0 0 1\.71-3L13\.71 3\.86a2 2 0 0 0-3\.42 0z\"/>\s*<line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/>\s*<line x1=\"12\" y1=\"17\" x2=\"12\.01\" y2=\"17\"/>\s*</svg>',
    '<AlertTriangle size={22} strokeWidth={2} />',
    content, flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

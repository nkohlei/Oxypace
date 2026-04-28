import sys

file_path = r'c:\Projects\globalmessage2\client\src\pages\Portal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_map = False
for line in lines:
    if '{Array.isArray(posts) && posts.map((post, index) => (' in line:
        in_map = True
    
    if in_map and '/>' in line and '</Fragment>' not in line:
        # Check if it's the end of PostCard
        new_lines.append(line)
        new_lines.append('                                                                                 {index < posts.length - 1 && <div className="post-separator" />}\n')
        new_lines.append('                                                                             </Fragment>\n')
        in_map = False
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

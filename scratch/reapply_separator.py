import sys
import os

files_to_fix = [
    r'c:\Projects\globalmessage2\client\src\pages\Portal.jsx',
    r'c:\Projects\globalmessage2\client\src\pages\Profile.jsx',
    r'c:\Projects\globalmessage2\client\src\pages\Saved.jsx'
]

def fix_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add Fragment import if missing
    if 'Fragment' not in content:
        content = content.replace(' Suspense } from \'react\'', ' Suspense, Fragment } from \'react\'')
        content = content.replace(' useCallback } from \'react\'', ' useCallback, Fragment } from \'react\'')
        content = content.replace(' useEffect } from \'react\'', ' useEffect, Fragment } from \'react\'')

    lines = content.splitlines()
    new_lines = []
    
    map_patterns = ['posts.map((post) => (', 'savedPosts.map((post) => (', 'userPosts.map((post) => (']
    
    in_map = False
    current_map_var = ""
    
    for line in lines:
        matched_pattern = False
        for pattern in map_patterns:
            if pattern in line:
                line = line.replace(pattern, pattern.replace('(post)', '(post, index)'))
                new_lines.append(line)
                new_lines.append(line[:line.find('{') + 1].replace('{', '') + '    <Fragment key={post._id}>')
                in_map = True
                current_map_var = pattern.split('.')[0]
                matched_pattern = True
                break
        
        if matched_pattern:
            continue
            
        if in_map and '/>' in line and '</Fragment>' not in line:
            new_lines.append(line)
            new_lines.append(line[:line.find('/')].replace('<PostCard', '').replace('<article', '') + f'    {{index < {current_map_var}.length - 1 && <div className="post-separator" />}}')
            new_lines.append(line[:line.find('/')].replace('<PostCard', '').replace('<article', '') + '</Fragment>')
            in_map = False
        else:
            new_lines.append(line)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines) + '\n')

for f in files_to_fix:
    fix_file(f)

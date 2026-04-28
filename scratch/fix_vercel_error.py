import os

def fix_file(file_path, map_var):
    print(f"Fixing {file_path} for {map_var}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add Fragment import
    if 'Fragment' not in content:
        content = content.replace(' Suspense } from \'react\'', ' Suspense, Fragment } from \'react\'')
        content = content.replace(' useCallback } from \'react\'', ' useCallback, Fragment } from \'react\'')
        content = content.replace(' useEffect } from \'react\'', ' useEffect, Fragment } from \'react\'')
        content = content.replace(' useState, useEffect } from \'react\'', ' useState, useEffect, Fragment } from \'react\'')

    lines = content.splitlines()
    new_lines = []
    in_map = False
    
    for i, line in enumerate(lines):
        # Match map signature
        if f'{map_var}.map((post) => (' in line:
            print(f"Found map for {map_var}")
            line = line.replace(f'{map_var}.map((post) => (', f'{map_var}.map((post, index) => (')
            new_lines.append(line)
            # Indent based on the start of the map line
            indent = " " * (len(line) - len(line.lstrip()))
            new_lines.append(indent + '    <Fragment key={post._id}>')
            in_map = True
            continue
        
        if in_map:
            # Look ahead for the end of the map: '))}' or ')}' or ']))'
            is_end_of_block = False
            if '/>' in line or '</article>' in line:
                # Check next 3 lines for end of map
                for j in range(i + 1, min(i + 4, len(lines))):
                    if '))}' in lines[j] or ')}' in lines[j]:
                        is_end_of_block = True
                        break
            
            if is_end_of_block:
                new_lines.append(line)
                indent = " " * (len(line) - len(line.lstrip()))
                new_lines.append(f'{indent}    {{index < {map_var}.length - 1 && <div className="post-separator" />}}')
                new_lines.append(f'{indent}</Fragment>')
                in_map = False
                continue
        
        new_lines.append(line)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines) + '\n')

fix_file(r'c:\Projects\globalmessage2\client\src\pages\Portal.jsx', 'posts')
fix_file(r'c:\Projects\globalmessage2\client\src\pages\Saved.jsx', 'posts')
fix_file(r'c:\Projects\globalmessage2\client\src\pages\Profile.jsx', 'savedPosts')
fix_file(r'c:\Projects\globalmessage2\client\src\pages\Profile.jsx', 'userPosts')

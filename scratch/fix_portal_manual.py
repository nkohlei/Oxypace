file_path = r'c:\Projects\globalmessage2\client\src\pages\Portal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# line 1083 is index 1082 (0-indexed)
# Wait, view_file showed:
# 1083:                                                                                 isAdmin={isAdmin}
# 1084:                                                                             />
# 1085:                                                                         ))}

# So lines[1083] is line 1084 (0-indexed)
lines[1083] = '                                                                             />\n'
lines.insert(1084, '                                                                             {index < posts.length - 1 && <div className="post-separator" />}\n')
lines.insert(1085, '                                                                         </Fragment>\n')

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

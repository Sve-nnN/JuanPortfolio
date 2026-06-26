import os
import re
import json

def extract_keyword(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple YAML frontmatter extractor using regex
    match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        frontmatter = match.group(1)
        # Try to find 'keyword: value'
        kw_match = re.search(r'^keyword:\s*(.*)$', frontmatter, re.MULTILINE)
        if kw_match:
            return kw_match.group(1).strip().strip("'" ).strip('"')
        
        # Try to find 'primary_keywords: value'
        pk_match = re.search(r'^primary_keywords:\s*(.*)$', frontmatter, re.MULTILINE)
        if pk_match:
            val = pk_match.group(1).strip().strip("'" ).strip('"')
            if val.startswith('['):
                # Handle list [val1, val2]
                val = val[1:-1].split(',')[0].strip().strip("'" ).strip('"')
            return val
    
    # Fallback: slug from filename or capitalized slug
    filename = os.path.basename(file_path)
    slug = filename.split('.')[0]
    return slug.replace('-', ' ').title()

posts_dir = 'posts'
keyword_map = {}

for root, dirs, files in os.walk(posts_dir):
    for file in files:
        if file.endswith('.md'):
            file_path = os.path.join(root, file)
            full_slug = file[:-3] # remove .md
            keyword = extract_keyword(file_path)
            # Ensure keyword has no dashes
            keyword = keyword.replace('-', ' ')
            keyword_map[full_slug] = keyword

print(json.dumps(keyword_map, indent=2))

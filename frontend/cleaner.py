import os
import re

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    orig = content
    
    # 1. Dashboard specific structural changes
    
    # statCards definitions
    content = re.sub(
        r"const statCards = \[\s*\{.*?bg:\s*'hsl\(24,100%,50%\)'.*?\},\s*\{.*?bg:\s*'#2563EB'.*?\},\s*\{.*?bg:\s*'#16A34A'.*?\}\s*\];",
        "const statCards = [\n    { label: 'Top ATS Score', value: latestScore, suffix: '/ 100', colorClass: 'text-primary' },\n    { label: 'Resumes Analyzed', value: analysisCount, suffix: 'iterations', colorClass: 'text-blue-500' },\n    { label: 'Active Tracker', value: 6, suffix: 'categories', colorClass: 'text-green-500' },\n  ];",
        content,
        flags=re.DOTALL
    )
    
    # statCards render
    content = re.sub(
        r"style=\{\{ background: card\.bg,\s*border:\s*'2px solid #000',\s*boxShadow:\s*card\.shadow,\s*color:\s*card\.color\s*\}\}",
        "className=\"glass-card\"",
        content
    )
    
    # actionCards render
    content = re.sub(
        r"className=\"p-5 flex flex-col gap-4 cursor-pointer transition-all hover:-translate-y-1\"\s*style=\{\{\s*background:\s*'#fff',\s*border:\s*'2px solid #000',\s*boxShadow:\s*'4px 4px 0 #000'\s*\}\}\s*onMouseEnter=\{.*?\}\s*onMouseLeave=\{.*?\}",
        "className=\"glass-card p-5 flex flex-col gap-4 cursor-pointer transition-all hover:-translate-y-1 group\"",
        content,
        flags=re.DOTALL
    )
    
    # Simple inline style strip for #fdfbf7
    content = content.replace("style={{ background: '#fdfbf7' }}", "")
    content = content.replace("style={{ background: '#fdfbf7', borderRight: '2px solid #1f1f1f' }}", "")
    
    # Other #fdfbf7 and #fff borders -> glass-card
    content = re.sub(r"style=\{\{\s*background:\s*'(#fdfbf7|#fff)',\s*border:\s*'2px solid (#000|#1f1f1f)'(,\s*boxShadow:\s*'.*?')?\s*\}\}", "className=\"glass-card\"", content)
    
    # And #fdfbf7 and #fff borders with other things
    content = re.sub(r"style=\{\{\s*background:\s*'(#fdfbf7|#fff)',\s*border:\s*'2px solid (#000|#1f1f1f)',\s*color:\s*'#444'\s*\}\}", "className=\"glass-card text-muted-foreground\"", content)

    content = re.sub(r"border:\s*'2px dashed #333'", "border: '2px dashed var(--border)'", content)
    
    # Some buttons
    content = re.sub(r"style=\{\{\s*background:\s*\(\!file \|\| isAnalyzing\)\s*\?\s*'#222'\s*:\s*'hsl\(24,100%,50%\)',\s*color:\s*\(\!file \|\| isAnalyzing\)\s*\?\s*'#444'\s*:\s*'#111',\s*border:\s*'2px solid #000',\s*cursor:\s*\(\!file \|\| isAnalyzing\)\s*\?\s*'not-allowed'\s*:\s*'pointer'\s*\}\}", "className=\"modern-btn-primary disabled:opacity-50\"", content)

    # Replace hard borders
    content = content.replace("border: '2px solid #000'", "border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)'")
    content = content.replace("border: '2px solid #1f1f1f'", "border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)'")
    content = content.replace("borderRight: '2px solid #1f1f1f'", "borderRight: '1px solid var(--border)'")
    content = content.replace("borderBottom: '2px solid #000'", "borderBottom: '1px solid var(--border)'")
    content = content.replace("borderTop: '2px solid #000'", "borderTop: '1px solid var(--border)'")
    
    # Fix the text colors
    content = content.replace("color: '#111'", "color: 'var(--foreground)'")
    content = content.replace("color: '#666'", "color: 'var(--muted-foreground)'")
    content = content.replace("color: '#aaa'", "color: 'var(--muted-foreground)'")
    content = content.replace("color: '#ccc'", "color: 'var(--muted-foreground)'")
    content = content.replace("color: '#333'", "color: 'var(--foreground)'")
    content = content.replace("background: '#1a1a1a'", "background: 'var(--secondary)'")

    # Replace specific hsl colors to primary
    content = content.replace("'hsl(24,100%,50%)'", "var(--primary)")
    content = content.replace("'rgba(255,102,0,0.1)'", "'rgba(0,119,255,0.1)'")
    content = content.replace("'rgba(255,102,0,0.12)'", "'rgba(0,119,255,0.12)'")
    content = content.replace("'rgba(255,102,0,0.06)'", "'rgba(0,119,255,0.06)'")

    if orig != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {path}")
    else:
        print(f"No changes in {path}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.js'):
            process_file(os.path.join(root, file))

print("Done cleaning inline styles!")

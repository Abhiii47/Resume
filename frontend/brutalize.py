import os
import re

def replace_in_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Class replacements
    replacements = {
        'glass-card': 'brutal-card',
        'modern-btn-primary': 'brutal-btn',
        'modern-btn-outline': 'brutal-btn-white',
        'modern-input': 'brutal-input',
        'shadow-soft': 'shadow-[4px_4px_0_#000]',
        'shadow-soft-lg': 'shadow-[6px_6px_0_#000]',
        'ocean-gradient': 'bg-[hsl(var(--accent-500))] text-white border-2 border-black',
        'var(--background)': '#fff',
        'var(--border)': '#000',
        'var(--card)': '#fff',
        'var(--primary)': 'hsl(var(--accent-500))',
        'borderRadius: "0.5rem"': 'borderRadius: "0px"',
        'borderRadius: "1rem"': 'borderRadius: "0px"',
        'border-b border-border': 'border-b-2 border-black',
        'border-t border-border': 'border-t-2 border-black',
        'border-r border-border': 'border-r-2 border-black',
    }

    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {path}")

def main():
    base_dir = 'src'
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.js'):
                replace_in_file(os.path.join(root, f))

if __name__ == "__main__":
    main()

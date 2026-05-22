import os

def replace_in_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    replacements = {
        'var(--shadow-[4px_4px_0_#000])': '4px 4px 0 #000',
        'var(--shadow-[4px_4px_0_#000]-lg)': '6px 6px 0 #000',
        'shadow-[4px_4px_0_#000]-sm': 'shadow-[2px_2px_0_#000]',
        'var(--shadow-[6px_6px_0_#000])': '6px 6px 0 #000',
    }

    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed shadows in {path}")

def main():
    base_dir = 'src'
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.js'):
                replace_in_file(os.path.join(root, f))

if __name__ == "__main__":
    main()

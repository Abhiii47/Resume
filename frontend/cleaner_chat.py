import re

path = 'src/components/AgentChat.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix tool_result refresh
content = content.replace('evt.data.success', 'evt.data.success !== false')

# Fix wrapper
content = re.sub(r'style=\{\{\s*backgroundColor:\s*"#fff",\s*backgroundImage:.*?\}\}', 'className="glass-card"', content, flags=re.DOTALL)

# Fix header
content = content.replace('padding: "16px 28px", borderBottom: "2px solid #000", background: "#fff", flexShrink: 0', 'padding: "16px 28px", borderBottom: "1px solid var(--border)", background: "var(--background)", flexShrink: 0')

# Fix brain icon
content = content.replace('background: "hsl(24,100%,50%)", border: "2px solid #000",', 'background: "var(--primary)", border: "none", borderRadius: "0.5rem",')
content = content.replace('fontSize: 22, boxShadow: "3px 3px 0 #000", flexShrink: 0,', 'fontSize: 22, boxShadow: "var(--shadow-soft)", flexShrink: 0,')

# Fix Quick Actions
content = re.sub(
    r'className="ac-action"\s*onClick=\{\(\) => send\(w.msg\)\}\s*style=\{\{.*?boxShadow:\s*"4px 4px 0 #000",\s*\}\}',
    'className="glass-card p-[18px] text-left cursor-pointer transition-all hover:-translate-y-1 group" onClick={() => send(w.msg)}',
    content, flags=re.DOTALL
)

# Fix Big brain icon
content = content.replace('background: "hsl(24,100%,50%)", border: "2px solid #000",\n              display: "flex", alignItems: "center", justifyContent: "center",\n              fontSize: 36, boxShadow: "6px 6px 0 #000",', 'background: "var(--primary)", border: "none", borderRadius: "1rem",\n              display: "flex", alignItems: "center", justifyContent: "center",\n              fontSize: 36, boxShadow: "var(--shadow-soft-lg)",')

# Fix agent badges in empty state
content = content.replace('background: a.color, color: a.color === "#f59e0b" || a.color === "#22c55e" ? "#000" : "#fff",\n                  border: "2px solid #000", boxShadow: "2px 2px 0 #000",', 'background: `${a.color}15`, color: a.color, border: `1px solid ${a.color}30`, borderRadius: "0.5rem",')

# Fix input area
content = content.replace('borderTop: "2px solid #1f1f1f", background: "#fff"', 'borderTop: "1px solid var(--border)", background: "var(--background)"')
content = content.replace('background: "#fdfbf7", border: "2px solid #000",', 'background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.5rem",')
content = content.replace('border: "2px solid #000",\n            cursor:', 'border: "none", borderRadius: "0.5rem",\n            cursor:')
content = content.replace('boxShadow: input.trim() && !streaming ? "3px 3px 0 #000" : "none"', 'boxShadow: input.trim() && !streaming ? "var(--shadow-soft)" : "none"')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated AgentChat.js')

import subprocess

def get_file_content_at_commit(commit, filepath):
    cmd = ["git", "show", f"{commit}:{filepath}"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.stdout

# Get DashboardPage.js at first commit
content = get_file_content_at_commit("64d8a4c", "frontend/src/pages/DashboardPage.js")
lines = content.splitlines()

# Find ResourceHub
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "function ResourceHub" in line:
        start_idx = i
        break

if start_idx != -1:
    # Find matching brace
    brace_count = 0
    started = False
    for i in range(start_idx, len(lines)):
        line = lines[i]
        if "{" in line:
            started = True
            brace_count += line.count("{")
        if "}" in line:
            brace_count -= line.count("}")
        if started and brace_count == 0:
            end_idx = i
            break

    print(f"ResourceHub found at lines {start_idx} to {end_idx}:")
    print("\n".join(lines[start_idx:end_idx+1]))
else:
    print("ResourceHub not found")

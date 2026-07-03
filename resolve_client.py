with open("frontend/src/lib/api/client.ts", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.startswith("<<<<<<< Updated upstream"):
        pass
    elif line.startswith("======="):
        skip = True
    elif line.startswith(">>>>>>> Stashed changes"):
        skip = False
    elif not skip:
        new_lines.append(line)

with open("frontend/src/lib/api/client.ts", "w") as f:
    f.writelines(new_lines)

with open("frontend/src/routes/login.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.startswith("<<<<<<< Updated upstream"):
        skip = True
    elif line.startswith("======="):
        skip = False
    elif line.startswith(">>>>>>> Stashed changes"):
        pass
    elif not skip:
        new_lines.append(line)

with open("frontend/src/routes/login.tsx", "w") as f:
    f.writelines(new_lines)

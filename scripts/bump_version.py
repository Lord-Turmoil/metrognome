import json
import sys

AFFECTED_FILES = [
    "package.json",
    "README.md",
    "src/scripts/models.ts"
]

# get new version
if len(sys.argv) != 2:
    print("Usage: bump_version.py VERSION")
    sys.exit(1)
NEW_VERSION = sys.argv[1]

# get old version
with open("package.json", "r") as f:
    data = json.load(f)
OLD_VERSION = data["version"]

# update files
for file in AFFECTED_FILES:
    with open(file, "r") as f:
        content = f.read()
    content = content.replace(OLD_VERSION, NEW_VERSION)
    with open(file, "w") as f:
        f.write(content)

"""
This script is used to generate the private JavaScript files in
GitHub actions.
"""

import os

secret_js = os.environ["SECRET_JS"]
assert secret_js is not None

print("Generating secret.js...")
with open("src/js/private.js", "w", encoding="utf-8") as f:
    f.write(secret_js)
print("Done.")

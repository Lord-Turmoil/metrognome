import datetime
import os
import json
import shutil

TIMESTAMP = datetime.datetime.now().strftime("%Y-%m-%d")

# extract version from package.json
NAME = None
VERSION = None
with open("package.json") as file:
    data = json.load(file)
    NAME = data["name"]
    VERSION = data["version"]
if NAME is None or VERSION is None:
    raise Exception("name or version not found in package.json")

# find the APK
APK_FOLDER = "android/app/release"
APK_PATH = None
for file in os.listdir(APK_FOLDER):
    if file.endswith(".apk"):
        APK_PATH = os.path.join(APK_FOLDER, file)
        break
if APK_PATH is None:
    raise Exception("APK not found in " + APK_FOLDER)

# prepare publish directory
PUBLISH_FOLDER = "publish"
RELEASE_FOLDER = os.path.join(PUBLISH_FOLDER, VERSION)
os.makedirs(RELEASE_FOLDER, exist_ok=True)

# copy APK to release directory
shutil.copy(APK_PATH, os.path.join(RELEASE_FOLDER, f"{NAME}-{VERSION}.apk"))

# create meta file
META = {
    "name": NAME,
    "version": VERSION,
    "date": TIMESTAMP,
    "changelog": "",
    "android": {
        "link": "",
        "mirror": "",
    },
    "ios": {
        "link": "",
        "mirror": "",
    },
}
with open(os.path.join(RELEASE_FOLDER, "meta.json"), "w") as file:
    json.dump(META, file, indent=4)

# update global meta file
META = {
    "name": NAME,
    "latest": VERSION,
}
with open(os.path.join(PUBLISH_FOLDER, "meta.json"), "w") as file:
    json.dump(META, file, indent=4)

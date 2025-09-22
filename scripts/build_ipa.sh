#!/bin/bash

xcodebuild                              \
    -workspace ios/App/App.xcworkspace  \
    -scheme App                         \
    -configuration release              \
    CODE_SIGNING_REQUIRED=NO            \
    CODE_SIGN_IDENTITY=""               \
    build

if [ $? -ne 0 ]; then
    echo "Build failed"
    exit 1
fi

echo "==============================="

echo "Go to Product > Show build folder in Finder"
echo "Find the .app file and copy it to ios/build"
echo "Then run 'scripts/package_ipa.sh'"

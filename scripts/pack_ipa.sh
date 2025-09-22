#!/bin/bash

# Check if ios/build/App.app exists
if [ ! -d "ios/build/App.app" ]; then
    echo "ios/build/App.app not found!"
    echo "Please run 'scripts/build_ipa.sh' and copy the .app file to ios/build"
    exit 1
fi

# Create Payload directory and ensure it's empty
rm -rf ios/build/Payload
mkdir -p ios/build/Payload

# Copy the .app file into the Payload directory
cp -r ios/build/App.app ios/build/Payload/

# Zip the Payload directory into an IPA file
cd ios/build
zip -r App.ipa Payload

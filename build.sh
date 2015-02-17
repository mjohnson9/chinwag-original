#!/bin/bash

set -e
shopt -s dotglob

DEST_DIR="/srv/www/xmpp-client"
BUILD_DIR="$(mktemp -d)"

echo "Build directory: ${BUILD_DIR}"
echo "Destination directory: ${DEST_DIR}"

function cleanup {
	echo "Cleaning build directory..."
	rm -rf "${BUILD_DIR}"
}
trap cleanup EXIT

cd "$( dirname "${BASH_SOURCE[0]}" )"

echo "Building Ember-CLI application..."
ember build --environment=production --output-path="${BUILD_DIR}"

echo "Compressing new live code..."
find "${BUILD_DIR}" -type f -not -iname '*.gz' -print0 | xargs -0 --max-procs="$(nproc)" -- gzip --best --keep --verbose --

echo "Removing old live code..."
find "${DEST_DIR}" -mindepth 1 -delete

echo "Copying in new live code..."
#find "${BUILD_DIR}" -mindepth 1 -maxdepth 1 -print0 | xargs -0 --max-procs="$(nproc)" -- mv -v -t "${DEST_DIR}" --
cp -a "${BUILD_DIR}/." "${DEST_DIR}/"

echo "Fixing permissions on live code..."
chmod u=rwx,go=rx "${DEST_DIR}"

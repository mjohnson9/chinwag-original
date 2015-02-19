#!/bin/bash

set -e
shopt -s dotglob

DEST_DIR="/srv/www/xmpp-client"

echo "Destination directory: ${DEST_DIR}"

cd "$( dirname "${BASH_SOURCE[0]}" )"

echo "Building Ember-CLI application..."
ember build --environment=production --output-path="${DEST_DIR}"

echo "Compressing new live code..."
find "${DEST_DIR}" -type f -not -iname '*.gz' -print0 | xargs -0 --max-procs="$(nproc)" --max-args=1 -- gzip --best --keep --verbose --

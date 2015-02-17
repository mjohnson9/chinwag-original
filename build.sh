#!/bin/bash

set -e
shopt -s dotglob

cd "$( dirname "${BASH_SOURCE[0]}" )"

echo "Clearing old dist..."
rm -rf dist

echo "Building Ember-CLI application..."
ember build --environment=production

echo "Removing old live code..."
rm -rfv /srv/www/xmpp-client/*

echo "Moving in new live code..."
mv -v dist/* /srv/www/xmpp-client/

echo "Compressing all live code..."
find /srv/www/xmpp-client/ -type f -exec bash -c 'PLAINFILE={};GZIPPEDFILE={}.gz;gzip --best -c "$PLAINFILE" > "$GZIPPEDFILE";' \;

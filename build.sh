#!/bin/bash

set -e
shopt -s dotglob

cd "$( dirname "${BASH_SOURCE[0]}" )"

rm -rf dist
ember build --environment=production
rm -rfv /srv/www/xmpp-client/*
mv -v dist/* /srv/www/xmpp-client/

find /srv/www/xmpp-client/ -type f -exec bash -c 'PLAINFILE={};GZIPPEDFILE={}.gz;gzip -c "$PLAINFILE" > "$GZIPPEDFILE";' \;

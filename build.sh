#!/bin/bash

set -e
shopt -s dotglob

cd "$( dirname "${BASH_SOURCE[0]}" )"

rm -rf dist
ember build --environment=production
rm -rfv /srv/www/xmpp-client/*
mv -v dist/* /srv/www/xmpp-client/

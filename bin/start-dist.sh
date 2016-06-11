#!/bin/bash

# Make sure it is executed from root path
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $(dirname $DIR)

/usr/bin/node /conspiracyos/conspiracyos/src/server/node/server.js "$@"

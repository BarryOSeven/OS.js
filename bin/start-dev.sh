#!/bin/bash

# Make sure it is executed from root path
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $(dirname $DIR)

if ! type "supervisor" > /dev/null 2>&1; then
  echo "Starting Node server without a supervisor..."
  /usr/bin/node /conspiracyos/conspiracyos/src/server/node/server.js dist-dev -p 8001 "$@"
  exit $?
fi

echo "Starting Node server with a supervisor..."
supervisor --watch /conspiracyos/src/server/node,src/server/settings.json -- /conspiracyos/src/server/node/server.js dist-dev -p 8001 "$@"

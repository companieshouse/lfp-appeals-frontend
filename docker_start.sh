#!/bin/bash
# Start script for lfp-appeals-frontend
PORT=3000
export NODE_PORT=${PORT}
exec node /opt/App.js -- ${PORT}

#!/bin/bash

# Exit on error
set -e

echo "Building n8n-nodes-ivanti..."
cd /home/ubuntu/n8n-nodes-ivanti
npm run build

echo "Starting n8n..."
export N8N_LISTEN_ADDRESS=127.0.0.1
n8n start

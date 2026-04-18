#!/usr/bin/env bash
set -euo pipefail

repositoryRoot="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
imageName="pokujs-coverage-snapshots:linux"

cd "$repositoryRoot"

docker build -f Dockerfile.snapshots -t "$imageName" .

docker run --rm \
  -v "$repositoryRoot":/app \
  -w /app \
  -e UPDATE_SNAPSHOTS=1 \
  "$imageName" \
  bash -c "npm ci && npm run build && npm test"

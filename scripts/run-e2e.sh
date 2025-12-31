#!/usr/bin/env bash
set -e

cleanup() {
  echo "Stopping DynamoDB Local..."
  podman compose down 2>/dev/null || true
}

trap cleanup EXIT

echo "Starting DynamoDB Local..."
podman compose up -d --wait 2>/dev/null || podman compose up -d

echo "Waiting for DynamoDB Local to be ready..."
sleep 2

echo "Seeding test data..."
DYNAMODB_ENDPOINT=http://localhost:8000 pnpm tsx src/tests/e2e/seed-local-db.ts

echo "Running e2e tests..."
DYNAMODB_ENDPOINT=http://localhost:8000 pnpm vitest run --config vitest.e2e.config.ts

echo "Done!"

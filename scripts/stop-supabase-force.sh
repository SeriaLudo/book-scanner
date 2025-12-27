#!/bin/bash
# Force stop Supabase containers if normal stop command hangs
# This script stops all Supabase-related Docker containers

set -e

echo "Force stopping Supabase containers..."

# Stop containers with the supabase project_id prefix
PROJECT_ID="book-scanner"
CONTAINER_PREFIX="supabase_${PROJECT_ID}"

# Find and stop all Supabase containers
CONTAINERS=$(docker ps -a --filter "name=${CONTAINER_PREFIX}" --format "{{.Names}}")

if [ -z "$CONTAINERS" ]; then
  echo "No Supabase containers found."
  exit 0
fi

echo "Found containers:"
echo "$CONTAINERS"
echo ""

# Stop containers
for container in $CONTAINERS; do
  echo "Stopping $container..."
  docker stop "$container" 2>/dev/null || true
done

# Remove containers
echo ""
echo "Removing containers..."
for container in $CONTAINERS; do
  echo "Removing $container..."
  docker rm "$container" 2>/dev/null || true
done

echo ""
echo "Supabase containers force stopped and removed."


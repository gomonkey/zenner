#!/usr/bin/env bash
# Local development run script for zenner-core
# Runs zenner-core service using Maven Spring Boot plugin

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CORE_DIR="$ROOT_DIR/zenner-core"
ENV_FILE="$CORE_DIR/.env.local"

# Check if zenner-core directory exists
if [ ! -d "$CORE_DIR" ]; then
    echo "Error: zenner-core directory not found at $CORE_DIR"
    exit 1
fi

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Warning: .env.local not found at $ENV_FILE"
    echo "Create one from .env.example or the service will use defaults"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if PostgreSQL is running
if ! docker ps | grep -q zenner-postgres-dev; then
    echo "Warning: PostgreSQL doesn't appear to be running"
    echo "Start it with: ./scripts/docker-local.sh up"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

cd "$CORE_DIR"

echo "Starting zenner-core..."
echo "Working directory: $CORE_DIR"

# Load .env.local if it exists
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment from .env.local"
    # Export all variables from .env.local
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

echo ""

# Check for Maven wrapper
if [ -f "./mvnw" ]; then
    ./mvnw spring-boot:run -DskipTests
else
    mvn spring-boot:run -DskipTests
fi

#!/usr/bin/env bash
# Local development run script for zenner-auth
# Runs zenner-auth service using Maven Spring Boot plugin

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
AUTH_DIR="$ROOT_DIR/zenner-auth"
ENV_FILE="$AUTH_DIR/.env.local"

# Check if zenner-auth directory exists
if [ ! -d "$AUTH_DIR" ]; then
    echo "Error: zenner-auth directory not found at $AUTH_DIR"
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

cd "$AUTH_DIR"

echo "Starting zenner-auth..."
echo "Working directory: $AUTH_DIR"

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

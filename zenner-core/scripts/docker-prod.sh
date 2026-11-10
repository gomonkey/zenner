#!/usr/bin/env bash
# Production Docker Compose helper script for zenner-core
# Manages the zenner-core service in standalone production mode

set -e

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not available in this WSL 2 distro."
    echo "Please enable WSL integration in Docker Desktop settings."
    echo "For details: https://docs.docker.com/go/wsl2/"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/.env.prod"

cd "$ROOT_DIR"

command="${1:-help}"

case "$command" in
  up|start)
    echo "Starting zenner-core service..."
    if [ ! -f "$ENV_FILE" ]; then
      echo "Error: .env.prod not found"
      echo "Please create .env.prod with required environment variables"
      exit 1
    fi
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    echo "✓ zenner-core started"
    echo ""
    echo "Service:"
    echo "  zenner-core:  localhost:${SERVER_PORT:-8081}"
    echo ""
    echo "Note: Ensure PostgreSQL is running with zenner_core schema"
    ;;
    
  down|stop)
    echo "Stopping zenner-core service..."
    docker compose -f "$COMPOSE_FILE" down
    echo "✓ zenner-core stopped"
    ;;
    
  restart)
    echo "Restarting zenner-core service..."
    docker compose -f "$COMPOSE_FILE" down
    if [ ! -f "$ENV_FILE" ]; then
      echo "Error: .env.prod not found"
      exit 1
    fi
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    echo "✓ zenner-core restarted"
    ;;
    
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f zenner-core
    ;;
    
  ps|status)
    docker compose -f "$COMPOSE_FILE" ps
    ;;
    
  health)
    echo "Checking zenner-core health..."
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "zenner-core health endpoint:"
    curl -sf http://localhost:${SERVER_PORT:-8081}/actuator/health >/dev/null && echo "  ✓ Healthy" || echo "  ✗ Unhealthy"
    ;;
    
  build)
    echo "Building zenner-core image..."
    docker compose -f "$COMPOSE_FILE" build zenner-core
    echo "✓ Build complete"
    ;;
    
  rebuild)
    echo "Rebuilding zenner-core image (no cache)..."
    docker compose -f "$COMPOSE_FILE" build --no-cache zenner-core
    echo "✓ Rebuild complete"
    ;;
    
  shell)
    echo "Opening shell in zenner-core container..."
    docker exec -it zenner-core /bin/sh
    ;;
    
  help|*)
    cat << EOF
zenner-core Production Docker Helper

Usage: $0 <command>

Commands:
  up, start       Start zenner-core service
  down, stop      Stop zenner-core service
  restart         Restart zenner-core service
  logs            Follow zenner-core logs
  ps, status      Show container status
  health          Check service health
  build           Build zenner-core image
  rebuild         Build zenner-core image (no cache)
  shell           Open shell in zenner-core container
  help            Show this help message

Examples:
  $0 up           # Start service
  $0 logs         # View logs
  $0 health       # Check health
  $0 rebuild      # Rebuild from scratch
  $0 shell        # Access container shell

Note: This runs zenner-core standalone. For full stack deployment,
      use the root docker scripts: ../../scripts/docker-prod.sh
EOF
    ;;
esac

#!/usr/bin/env bash
# Production Docker Compose helper script
# Manages the full zenner stack (PostgreSQL + zenner-auth + zenner-core)

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
    echo "Starting zenner production stack..."
    if [ ! -f "$ENV_FILE" ]; then
      echo "Error: .env.prod not found"
      echo "Please create .env.prod with required environment variables"
      exit 1
    fi
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    echo "✓ Zenner stack started"
    echo ""
    echo "Services:"
    echo "  PostgreSQL:   localhost:5432"
    echo "  zenner-auth:  localhost:8082"
    echo "  zenner-core:  localhost:8081"
    ;;
    
  down|stop)
    echo "Stopping zenner production stack..."
    if [ -f "$ENV_FILE" ]; then
      docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    else
      docker compose -f "$COMPOSE_FILE" down
    fi
    echo "✓ Zenner stack stopped"
    ;;
    
  restart)
    echo "Restarting zenner production stack..."
    if [ ! -f "$ENV_FILE" ]; then
      echo "Error: .env.prod not found"
      exit 1
    fi
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    echo "✓ Zenner stack restarted"
    ;;
    
  logs)
    if [ -f "$ENV_FILE" ]; then
      if [ -z "$2" ]; then
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
      else
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "${@:2}"
      fi
    else
      if [ -z "$2" ]; then
        docker compose -f "$COMPOSE_FILE" logs -f
      else
        docker compose -f "$COMPOSE_FILE" logs -f "${@:2}"
      fi
    fi
    ;;
    
  ps|status)
    if [ -f "$ENV_FILE" ]; then
      docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    else
      docker compose -f "$COMPOSE_FILE" ps
    fi
    ;;
    
  health)
    echo "Checking service health..."
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "PostgreSQL health:"
    docker exec zenner-postgres pg_isready -U "${POSTGRES_USER:-zenner}" || echo "  ✗ Not ready"
    echo ""
    echo "zenner-auth health:"
    curl -sf http://localhost:8082/actuator/health >/dev/null && echo "  ✓ Healthy" || echo "  ✗ Unhealthy"
    echo ""
    echo "zenner-core health:"
    curl -sf http://localhost:8081/actuator/health >/dev/null && echo "  ✓ Healthy" || echo "  ✗ Unhealthy"
    ;;
    
  build)
    echo "Building images..."
    if [ -f "$ENV_FILE" ]; then
      docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build "${@:2}"
    else
      docker compose -f "$COMPOSE_FILE" build "${@:2}"
    fi
    echo "✓ Build complete"
    ;;
    
  pull)
    echo "Pulling images..."
    if [ -f "$ENV_FILE" ]; then
      docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    else
      docker compose -f "$COMPOSE_FILE" pull
    fi
    echo "✓ Pull complete"
    ;;
    
  clean)
    echo "Stopping and removing zenner stack and volumes..."
    read -p "This will delete all production database data. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      if [ -f "$ENV_FILE" ]; then
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v
      else
        docker compose -f "$COMPOSE_FILE" down -v
      fi
      echo "✓ Zenner stack and volumes removed"
    else
      echo "Cancelled"
    fi
    ;;
    
  psql)
    docker exec -it zenner-postgres psql -U "${POSTGRES_USER:-zenner}" -d "${POSTGRES_DB:-zenner}"
    ;;
    
  help|*)
    cat << EOF
Production Docker Compose Helper

Usage: $0 <command> [options]

Commands:
  up, start       Start full zenner stack
  down, stop      Stop full zenner stack
  restart         Restart full zenner stack
  logs [service]  Follow logs (all services or specific service)
  ps, status      Show running containers
  health          Check health of all services
  build [service] Build images
  pull            Pull latest images
  clean           Stop and remove stack with volumes (destructive)
  psql            Connect to PostgreSQL via psql
  help            Show this help message

Examples:
  $0 up                    # Start all services
  $0 logs                  # View all logs
  $0 logs zenner-auth      # View zenner-auth logs only
  $0 health                # Check service health
  $0 build                 # Rebuild all images
  $0 psql                  # Connect to database
  $0 clean                 # Remove everything
EOF
    ;;
esac

#!/usr/bin/env bash
# Local development Docker Compose helper script
# Manages the shared PostgreSQL database for local development

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
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.local.yml"
ENV_FILE="$ROOT_DIR/.env.local"

cd "$ROOT_DIR"

command="${1:-help}"

case "$command" in
  up|start)
    echo "Starting local PostgreSQL and Redis services..."
    if [ -f "$ENV_FILE" ]; then
      docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    else
      echo "Warning: .env.local not found, using defaults"
      docker compose -f "$COMPOSE_FILE" up -d
    fi
    echo "✓ PostgreSQL started on port 5433"
    echo "✓ Redis started on port 6379"
    ;;
    
  down|stop)
    echo "Stopping local PostgreSQL and Redis services..."
    docker compose -f "$COMPOSE_FILE" down
    echo "✓ PostgreSQL and Redis stopped"
    ;;
    
  restart)
    echo "Restarting local PostgreSQL and Redis services..."
    docker compose -f "$COMPOSE_FILE" down
    if [ -f "$ENV_FILE" ]; then
      docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    else
      docker compose -f "$COMPOSE_FILE" up -d
    fi
    echo "✓ PostgreSQL and Redis restarted"
    ;;
    
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f "${@:2}"
    ;;
    
  ps|status)
    docker compose -f "$COMPOSE_FILE" ps
    ;;
    
  clean)
    echo "Stopping and removing local services and volumes..."
    read -p "This will delete all local database and cache data. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker compose -f "$COMPOSE_FILE" down -v
      echo "✓ Containers and volumes removed"
    else
      echo "Cancelled"
    fi
    ;;
    
  psql)
    docker exec -it zenner-postgres-dev psql -U zenner_dev -d zenner_dev
    ;;

  redis-cli)
    docker exec -it zenner-redis-dev redis-cli
    ;;
    
  help|*)
    cat << EOF
Local Development Docker Compose Helper

Usage: $0 <command>

Commands:
  up, start       Start PostgreSQL and Redis services
  down, stop      Stop PostgreSQL and Redis services
  restart         Restart PostgreSQL and Redis services
  logs            Follow service logs
  ps, status      Show running containers
  clean           Stop and remove services with volumes (destructive)
  psql            Connect to PostgreSQL via psql
  redis-cli       Connect to Redis via redis-cli
  help            Show this help message

Examples:
  $0 up           # Start services
  $0 logs         # View logs
  $0 psql         # Connect to database
  $0 redis-cli    # Connect to redis
  $0 clean        # Remove everything
EOF
    ;;
esac

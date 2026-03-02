.PHONY: up down logs build clean db-shell db-reset

# Start all services defined in docker-compose.yml (detached mode)
up:
	docker compose up -d

# Stop and remove all containers (retains volumes)
down:
	docker compose down

# Stream logs from all services (Ctrl+C to exit)
logs:
	docker compose logs -f

# Stream logs from the database service only
logs-db:
	docker compose logs -f db

# Stream logs from the backend service only
logs-server:
	docker compose logs -f server

# Force rebuild all Docker images then start
build:
	docker compose build --no-cache

# Remove all containers AND volumes (destroys DB data — use with caution)
clean:
	docker compose down -v

# Open a psql shell inside the running DB container
db-shell:
	docker exec -it jbrain-db psql -U jbrain_admin -d jbrain_db

# Drop and recreate the DB volume, then restart (full DB reset)
db-reset: clean up
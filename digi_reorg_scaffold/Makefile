.PHONY: build up down test lint migrate

build:
	docker-compose build

up:
	docker-compose up --remove-orphans

down:
	docker-compose down --volumes

test:
	# Placeholder: run basic tests for services
	echo "Run tests (implement per-service)"
	# e.g. (cd services/backend && npm test) && (cd services/frontend && npm test)

lint:
	# Placeholder lints
	echo "Run linters (implement per-service)"

migrate:
	# Example: run migrations from infra/migrate.sh
	bash infra/migrate.sh

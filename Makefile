.PHONY: help build up down restart logs logs-app logs-postgres logs-redis clean db-generate db-migrate db-studio test lint format

# Ajuda - mostra todos os comandos disponíveis
help:
	@echo "Comandos disponíveis:"
	@echo "  make build          - Builda as imagens Docker"
	@echo "  make up             - Sobe todos os containers"
	@echo "  make down           - Para todos os containers"
	@echo "  make restart        - Reinicia todos os containers"
	@echo "  make restart-app    - Reinicia apenas o container da aplicação"
	@echo "  make logs           - Mostra logs de todos os containers"
	@echo "  make logs-app       - Mostra logs da aplicação"
	@echo "  make logs-postgres  - Mostra logs do PostgreSQL"
	@echo "  make logs-redis     - Mostra logs do Redis"
	@echo "  make clean          - Remove todos os containers e volumes"
	@echo "  make db-generate    - Gera migration do Drizzle"
	@echo "  make db-migrate     - Aplica migrations no banco"
	@echo "  make db-studio      - Abre Drizzle Studio"
	@echo "  make redis-cli      - Abre CLI do Redis"
	@echo "  make redis-flush    - Limpa todos os dados do Redis"
	@echo "  make redis-keys     - Lista todas as chaves do Redis"
	@echo "  make shell-app      - Abre shell no container da app"
	@echo "  make shell-postgres - Abre shell no PostgreSQL"
	@echo "  make install        - Instala dependências npm"
	@echo "  make dev            - Roda em modo desenvolvimento (local)"

# Docker - Build
build:
	docker-compose build

# Docker - Up
up:
	docker-compose up -d

# Docker - Down
down:
	docker-compose down

# Docker - Restart
restart:
	docker-compose restart

restart-app:
	docker-compose restart app

# Docker - Rebuild e Up
rebuild:
	docker-compose up -d --build app

# Logs
logs:
	docker-compose logs -f

logs-app:
	docker logs -f residencial-app

logs-app-tail:
	docker logs --tail 50 residencial-app

logs-postgres:
	docker logs -f residencial-postgres

logs-redis:
	docker logs -f residencial-redis

# Clean
clean:
	docker-compose down -v
	docker system prune -f

# Database - Drizzle
db-generate:
	npm run db:generate

db-migrate:
	npx drizzle-kit push:pg

db-studio:
	npm run db:studio

# Redis
redis-cli:
	docker exec -it residencial-redis redis-cli

redis-flush:
	docker exec residencial-redis redis-cli FLUSHALL

redis-keys:
	docker exec residencial-redis redis-cli KEYS "*"

# Shell access
shell-app:
	docker exec -it residencial-app sh

shell-postgres:
	docker exec -it residencial-postgres psql -U postgres -d residencial

# NPM
install:
	npm install

# Desenvolvimento local (sem Docker)
dev:
	npm run dev

# Health check
health:
	@curl -s http://localhost:3000/health | jq .

# Status dos containers
status:
	docker-compose ps

# Setup inicial completo
setup: install db-generate db-migrate up
	@echo "✅ Setup completo! Acesse http://localhost:3000"

# Rebuild completo (para mudanças no código)
full-rebuild: down build up
	@echo "✅ Rebuild completo finalizado!"

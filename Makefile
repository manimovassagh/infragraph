.PHONY: help install dev dev-backend dev-frontend build \
       up down restart logs ps clean \
       test test-unit test-e2e lint typecheck check \
       docker-clean docker-nuke

# ── Defaults ──────────────────────────────────────────────────────────────────

SHELL := /bin/bash
DOCKER_COMPOSE := docker compose

# ── Help ──────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Local Development ─────────────────────────────────────────────────────────

install: ## Install all dependencies
	npm install
	npm run build --workspace=packages/shared

dev: ## Run backend + frontend concurrently
	npm run dev

dev-backend: ## Run backend only (port 3001)
	npm run dev --workspace=apps/backend

dev-frontend: ## Run frontend only (port 3000)
	npm run dev --workspace=apps/frontend

build: ## Build all workspaces for production
	npm run build

# ── Docker ────────────────────────────────────────────────────────────────────

up: ## Build and start all services (Docker)
	$(DOCKER_COMPOSE) up --build -d
	@echo ""
	@echo "  Waiting for services..."
	@sleep 3
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:3001"

down: ## Stop and remove containers
	$(DOCKER_COMPOSE) down

restart: down docker-clean up ## Full restart (down + clean images + rebuild)

logs: ## Tail container logs
	$(DOCKER_COMPOSE) logs -f

ps: ## Show container status
	$(DOCKER_COMPOSE) ps

docker-clean: ## Remove project images (keeps base images)
	$(DOCKER_COMPOSE) down --rmi local --volumes --remove-orphans 2>/dev/null || true

docker-nuke: ## Remove ALL project Docker artifacts (images, volumes, orphans)
	$(DOCKER_COMPOSE) down --rmi all --volumes --remove-orphans 2>/dev/null || true
	@echo "  Cleaned all Docker artifacts"

# ── Testing ───────────────────────────────────────────────────────────────────

test: test-unit ## Run all tests
	npm test

test-unit: ## Run Vitest unit tests with coverage
	npm run test:unit

test-e2e: ## Run Playwright end-to-end tests
	npm run test:e2e

# ── Code Quality ──────────────────────────────────────────────────────────────

lint: ## ESLint across all workspaces
	npm run lint

typecheck: ## TypeScript type checking
	npm run typecheck

check: lint typecheck test ## Run lint + typecheck + tests (CI equivalent)

# ── Utilities ─────────────────────────────────────────────────────────────────

clean: ## Remove all build artifacts and node_modules
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/backend/dist apps/frontend/.next packages/shared/dist
	@echo "  Cleaned all build artifacts"

health: ## Check backend health endpoint
	@curl -sf http://localhost:3001/health | jq . || echo "  Backend not running"

api-test: ## Quick API smoke test with sample tfstate
	@echo "Testing .tfstate parse..."
	@curl -sf -X POST http://localhost:3001/api/parse \
		-F "tfstate=@test/fixtures/tfstate/06-sample.tfstate" | \
		jq '{nodes: (.nodes | length), edges: (.edges | length), warnings: .warnings}'
	@echo ""
	@echo "Testing .tf HCL parse..."
	@curl -sf -X POST http://localhost:3001/api/parse/hcl \
		-F "files=@test/fixtures/projects/11-full-stack/compute.tf" \
		-F "files=@test/fixtures/projects/11-full-stack/networking.tf" \
		-F "files=@test/fixtures/projects/11-full-stack/serverless.tf" | \
		jq '{nodes: (.nodes | length), edges: (.edges | length), warnings: .warnings}'

fixtures-test: ## Parse all test fixtures via API and report results
	@echo "=== .tfstate fixtures ==="
	@for f in test/fixtures/tfstate/*.tfstate; do \
		name=$$(basename "$$f"); \
		count=$$(curl -sf -X POST http://localhost:3001/api/parse \
			-F "tfstate=@$$f" | jq '.nodes | length' 2>/dev/null); \
		printf "  %-35s %s resources\n" "$$name" "$$count"; \
	done
	@echo ""
	@echo "=== .tf projects ==="
	@for d in test/fixtures/projects/*/; do \
		name=$$(basename "$$d"); \
		count=$$(curl -sf -X POST http://localhost:3001/api/parse/hcl \
			$$(for f in "$$d"*.tf; do echo -n "-F files=@$$f "; done) | \
			jq '.nodes | length' 2>/dev/null); \
		printf "  %-35s %s resources\n" "$$name" "$$count"; \
	done

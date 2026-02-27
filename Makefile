.PHONY: install dev build-local start-local build run stop logs clean

# Variables
IMAGE_NAME := soroban-escrow-twitter-bot
CONTAINER_NAME := soroban-escrow-twitter-bot-container

# Install project dependencies with pnpm
install:
	pnpm install

# Run in development mode with auto-reload
dev:
	pnpm run dev

# Build in production mode locally
build-local:
	pnpm run build

# Build and start in production mode locally
start-local: build-local
	pnpm start

# Build Docker image from Dockerfile
build:
	docker build -t $(IMAGE_NAME) .

# Build and run in Docker container (detached mode)
run: build
	docker run -d --env-file .env --name $(CONTAINER_NAME) $(IMAGE_NAME)

# Stop and remove Docker container
stop:
	docker stop $(CONTAINER_NAME) && docker rm $(CONTAINER_NAME)

# View and follow Docker container logs
logs:
	docker logs -f $(CONTAINER_NAME)

# Clean up: stop container and remove Docker image
clean: stop
	docker rmi $(IMAGE_NAME)

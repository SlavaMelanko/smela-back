# Use latest Ubuntu as base image
FROM ubuntu:latest

# Set working directory
WORKDIR /app

# Install curl and unzip (required for Bun installation)
RUN apt-get update && \
    apt-get install -y curl unzip && \
    rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.com/install | bash

# Add Bun to PATH
ENV PATH="/root/.bun/bin:$PATH"

# Copy package.json and bun.lock first for better Docker layer caching
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Run linting
RUN bun run lint

# Run tests
CMD ["bun", "test"]

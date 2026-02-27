# Use the official Bun image
# https://bun.com/guides/ecosystem/docker
FROM oven/bun:1.2.16 AS base

WORKDIR /app

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/test
COPY package.json bun.lock /temp/test/
WORKDIR /temp/test
RUN bun install --frozen-lockfile

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS test
COPY --from=install /temp/test/node_modules ./node_modules
COPY . .

CMD ["bun", "run", "test"]

# Build production bundle
FROM base AS build
COPY --from=install /temp/test/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image — minimal, no source or devDeps
FROM oven/bun:1.2.16-slim AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV NODE_ENV=production
CMD ["bun", "dist/app.js"]

# BER Core Module Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy BER module
COPY packages/ber-core ./packages/ber-core
COPY packages/shared-kernel ./packages/shared-kernel

# Build
RUN npm run build --workspace=ber-core

# Expose diagnostic port
EXPOSE 3001

# Start BER module
CMD ["node", "packages/ber-core/dist/index.js"]

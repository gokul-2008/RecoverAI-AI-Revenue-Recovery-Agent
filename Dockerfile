# Multi-stage production build for RecoverAI
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run postinstall

# Copy full application source code
COPY . .

# Build frontend production bundle
RUN npm run build

# Production Runner stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root package and node_modules
COPY package.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Copy installed node modules and build artifacts from builder stage
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend ./backend

EXPOSE 5000

# Seed database and start production server
CMD ["sh", "-c", "npm run seed && npm run start"]

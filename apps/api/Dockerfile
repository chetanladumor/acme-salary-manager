FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace and api package definitions
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm install --workspace=@acme/api

# Copy source code and build
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src

RUN npm run build --workspace=@acme/api

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm install --omit=dev --workspace=@acme/api

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 5001

CMD ["node", "apps/api/dist/server.js"]

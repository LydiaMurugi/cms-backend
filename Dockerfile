# ── Stage 1: builder (install all deps + generate Prisma client) ──────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate --schema prisma/schema.prisma

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# node_modules from builder already contains prod deps + generated Prisma client + CLI
COPY --from=builder /app/node_modules ./node_modules

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY package.json ./

EXPOSE 4000

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node prisma/seed.js && node src/server.js"]

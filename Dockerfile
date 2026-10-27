# ONYQ website — production image (Node 22 LTS, non-root, read-only app files).
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_MODE=production
ARG NEXT_PUBLIC_SITE_URL=https://onyq.am
ENV NEXT_PUBLIC_SITE_MODE=$NEXT_PUBLIC_SITE_MODE NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 ONYQ_DATA_DIR=/data PORT=3000 ONYQ_TRUST_PROXY=1 \
    NODE_OPTIONS=--disable-warning=ExperimentalWarning
COPY --from=build --chown=root:root /app/package.json ./
COPY --from=build --chown=root:root /app/node_modules ./node_modules
COPY --from=build --chown=root:root /app/.next ./.next
COPY --from=build --chown=root:root /app/public ./public
COPY --from=build --chown=root:root /app/next.config.ts ./
COPY --from=build --chown=root:root /app/scripts/admin.mjs ./scripts/admin.mjs
COPY --from=build --chown=root:root /app/lib/server/migrations.mjs ./lib/server/migrations.mjs
RUN mkdir -p /data && chown node:node /data && chmod 700 /data
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node_modules/.bin/next", "start", "-p", "3000"]

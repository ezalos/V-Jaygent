# syntax=docker/dockerfile:1.7
# ABOUTME: Studio runtime image — minimal node:alpine, npm-ci'd prod deps,
# ABOUTME: tini for proper SIGTERM forwarding so stats.flush() runs on shutdown.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
RUN apk add --no-cache tini wget
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY studio ./studio
COPY lib    ./lib
COPY layers ./layers
COPY brainstorming/critiques ./brainstorming/critiques

# pieces/, layers/, lib/, data/, and brainstorming/critiques/ are bind-mounted
# at runtime (compose.yaml). COPY above gives the image a sane default in case
# the bind mount is missing.
RUN mkdir -p /app/pieces /app/layers /app/data /app/brainstorming/critiques && chown -R node:node /app
USER node

ENV NODE_ENV=production \
    STUDIO_HOST=0.0.0.0 \
    STUDIO_PORT=7777 \
    STATS_FILE=/app/data/stats.json

EXPOSE 7777

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:7777/api/catalog || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "studio/server.mjs"]

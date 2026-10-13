# syntax=docker/dockerfile:1
# The browser only talks to this server; the server calls the API. Tell it where the API is at RUN time:
#   docker run -e API_URL=https://api.example.com -p 3001:3001 storekeeper-web
# Only NEXT_PUBLIC_SITE_URL (used for the sitemap) is a build argument:
#   docker build --build-arg NEXT_PUBLIC_SITE_URL=https://example.com -t storekeeper-web .
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3001
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1 API_URL=http://localhost:3000
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1:3001/ >/dev/null || exit 1
CMD ["node", "server.js"]

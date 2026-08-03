FROM node:22-bookworm-slim

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && pip3 install --no-cache-dir --break-system-packages youtube-transcript-api \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY server.js ./
COPY scripts/ ./scripts/
COPY context/ ./context/
COPY skills/ ./skills/
COPY agents/ ./agents/
COPY public/ ./public/

ENV NODE_ENV=production
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1

CMD ["node", "server.js"]

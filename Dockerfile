FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY README.md /usr/share/nginx/html/README.md

RUN printf '%s\n' \
  '<!doctype html>' \
  '<html lang="en">' \
  '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Funnel Agent</title></head>' \
  '<body><main style="font-family: system-ui, sans-serif; max-width: 720px; margin: 4rem auto; padding: 0 1rem;">' \
  '<h1>Funnel Agent</h1>' \
  '<p>Container deployment is configured. Add the application source and update the Dockerfile build steps when ready.</p>' \
  '</main></body></html>' \
  > /usr/share/nginx/html/index.html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

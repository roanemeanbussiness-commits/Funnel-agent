# Funnel Agent

Marketing and funnel dashboard for Sun Stoppers Texas.

This first version ships as a static dashboard in Docker. It includes:

- Sun Stoppers client command center
- Social setup and content planning panels
- Local funnel pipeline overview
- Chat-style agent workspace ready for API integration

## Docker

Build and run locally:

```sh
docker build -t funnel-agent .
docker run --rm -p 8080:8080 funnel-agent
```

Open `http://localhost:8080`.

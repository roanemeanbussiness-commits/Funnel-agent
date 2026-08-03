# Funnel Agent

Marketing and funnel dashboard for Sun Stoppers Texas.

This first version ships as a Dockerized dashboard with a server-side OpenAI chat endpoint. It includes:

- Sun Stoppers client command center
- Social setup and content planning panels
- Local funnel pipeline overview
- Live OpenAI-powered agent workspace

## Docker

Build and run locally:

```sh
docker build -t funnel-agent .
docker run --rm -p 8080:8080 funnel-agent
```

To enable the live agent, pass the secret at runtime:

```sh
docker run --rm -p 8080:8080 -e OPENAI_API_KEY=your_key_here funnel-agent
```

For Fly.io, set it as a secret rather than committing it:

```sh
fly secrets set OPENAI_API_KEY=your_key_here
```

Open `http://localhost:8080`.

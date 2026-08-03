# Funnel Agent

Marketing and funnel dashboard for Sun Stoppers Texas.

This version ships as a Dockerized dashboard with a server-side OpenAI chat endpoint and a marketing knowledge layer. It includes:

- Sun Stoppers client command center
- Social setup and content planning panels
- Local funnel pipeline overview
- Live OpenAI-powered agent workspace
- Sun Stoppers business, voice, offer, and funnel context files
- Modular CRO, ad creative, and email funnel skills
- YouTube transcript learning endpoint backed by `youtube-transcript-api`
- Elite funnel orchestration with research, offers, copy, social, revops, experiments, and marketing loops

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

## Automatic deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys every push to `main` to Fly.io. Add a repository secret named `FLY_API_TOKEN` before relying on it. Create a scoped deploy token with `fly tokens create deploy -a funnel-agent`, then add the returned value in GitHub under **Settings → Secrets and variables → Actions**.

The existing `open_ai` secret name is also supported. To import a transcript into the running agent, send a POST request with a YouTube URL or video ID:

```sh
curl -X POST http://localhost:8080/api/learn/youtube \
  -H "Content-Type: application/json" \
  -d '{"videoId":"https://www.youtube.com/watch?v=VIDEO_ID"}'
```

Imported transcript context is kept in the running app's memory and is available to later agent conversations. Add durable lessons to the Markdown files under `context/` or `skills/` when they should survive restarts.

Open `http://localhost:8080`.

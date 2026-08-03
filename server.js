const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const port = Number(process.env.PORT || 8080);
const publicDir = path.join(__dirname, "public");
const model = process.env.OPENAI_MODEL || "gpt-5-mini";
const apiKey = process.env.OPENAI_API_KEY || process.env.open_ai || process.env.OPEN_AI_API_KEY;
let learnedTranscript = "";

function readKnowledge() {
  const folders = ["context", "skills", "agents"];
  return folders.flatMap((folder) => {
    const directory = path.join(__dirname, folder);
    return fs.readdirSync(directory).filter((file) => file.endsWith(".md")).map((file) => {
      return `## ${folder}/${file}\n${fs.readFileSync(path.join(directory, file), "utf8")}`;
    });
  }).join("\n\n");
}

const instructions = `You are the conversational senior growth strategist for Gum Cars Window Tinting, a Texas window tinting company. You are speaking with the agency operator, not directly with a customer. The primary growth goal is commercial and small-business window tinting: offices, storefronts, restaurants, retail locations, medical offices, gyms, apartments, property managers, dealerships, and local operators with customer-facing buildings. Vehicle tinting is a secondary offer unless the operator specifically asks about it. Sound like a sharp, warm human collaborator: acknowledge what they said, answer the actual question, and keep the conversation moving. Do not repeat a generic business summary or fallback answer. Use the prior messages to remember context. Be practical, decisive, and specific about local B2B lead generation, account-based outreach, commercial property pain points, quote conversion, fast follow-up, and measurable experiments. When a request is broad, make a sensible recommendation first, then ask one useful follow-up question. When suggesting copy, make it ready to use. Never invent business details, pricing, testimonials, legal claims, or performance data; clearly label assumptions and ask for missing details when they matter. For large requests, use the Elite Funnel Orchestrator: connect audience, offer, channel, conversion event, owner, metric, approval gate, and review date. Prefer a seven-day testable next step over a vague long-term plan.\n\nBusiness playbook:\n${readKnowledge()}`;

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) reject(new Error("Request too large"));
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function extractResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

async function askOpenAI(input, maxOutputTokens = 900) {
  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: `${instructions}\n\nRecently learned transcript context:\n${learnedTranscript.slice(-30_000)}`,
      input,
      max_output_tokens: maxOutputTokens,
    }),
  });
  const data = await openaiResponse.json();
  if (!openaiResponse.ok) {
    console.error("OpenAI API error", openaiResponse.status, data);
    throw new Error("The agent could not reach OpenAI right now.");
  }
  const message = extractResponseText(data);
  if (!message) throw new Error("OpenAI returned an empty response. Please try again.");
  return { message, responseId: data.id };
}

async function handleChat(request, response) {
  if (!apiKey) {
    return sendJson(response, 503, { error: "OPENAI_API_KEY is not configured on the server." });
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(request));
  } catch {
    return sendJson(response, 400, { error: "Invalid JSON request." });
  }

  const messages = Array.isArray(payload.messages)
    ? payload.messages
        .filter((message) => message && ["user", "assistant"].includes(message.role))
        .slice(-20)
        .map((message) => ({ role: message.role, content: String(message.content).slice(0, 4_000) }))
    : [];

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return sendJson(response, 400, { error: "A user message is required." });
  }

  try {
    return sendJson(response, 200, await askOpenAI(messages));
  } catch (error) {
    console.error("Chat request failed", error);
    return sendJson(response, 502, { error: "The agent is temporarily unavailable." });
  }
}

function decodeXml(value) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

async function listChannelVideos(channelId) {
  const feedResponse = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`);
  if (!feedResponse.ok) throw new Error("YouTube channel feed unavailable.");
  const xml = await feedResponse.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
    const entry = match[1];
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "Untitled video";
    return { videoId, title: decodeXml(title) };
  }).filter((video) => video.videoId);
}

async function handleChannelTranscript(request, response) {
  let payload;
  try { payload = JSON.parse(await readBody(request)); } catch { return sendJson(response, 400, { error: "Invalid JSON request." }); }
  const channelId = String(payload.channelId || "").trim();
  const limit = Math.min(Math.max(Number(payload.limit) || 3, 1), 5);
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(channelId)) {
    return sendJson(response, 400, { error: "Provide a valid YouTube channel ID." });
  }
  try {
    const videos = (await listChannelVideos(channelId)).slice(0, limit);
    if (!videos.length) return sendJson(response, 404, { error: "No videos were found for that channel." });
    const results = [];
    for (const video of videos) {
      try {
        const transcript = await fetchTranscript(video.videoId);
        learnedTranscript += `\n[YouTube channel ${channelId}, video ${video.videoId}, title ${video.title}, language ${transcript.language}]\n${transcript.text}`;
        results.push({ ...video, status: "learned", charactersLearned: transcript.text.length });
      } catch (error) {
        console.error("Channel transcript failed", video.videoId, error.message);
        results.push({ ...video, status: "unavailable" });
      }
    }
    return sendJson(response, 200, { channelId, requested: videos.length, learned: results.filter((video) => video.status === "learned").length, videos: results });
  } catch (error) {
    console.error("Channel import failed", error.message);
    return sendJson(response, 502, { error: "Could not load videos from that YouTube channel." });
  }
}

async function handleStrategy(request, response) {
  if (!apiKey) return sendJson(response, 503, { error: "OpenAI is not configured on the server." });
  let payload;
  try { payload = JSON.parse(await readBody(request)); } catch { return sendJson(response, 400, { error: "Invalid JSON request." }); }
  const type = payload.type === "offer" ? "offer" : "funnel";
  const input = type === "offer"
    ? "Refresh Gum Cars Window Tinting's commercial offer. Create 3 differentiated offers for Texas small businesses and commercial properties. For each, include target account, problem, promise, deliverables, proof needed, CTA, operational risk, and the fastest seven-day test. Recommend one winner and label any missing business facts."
    : "Create a fresh funnel map for Gum Cars Window Tinting focused on commercial and small-business accounts. Give 3 new funnel concepts, each with audience, trigger, message, channel, capture mechanism, qualification, proposal step, follow-up, metric, and seven-day experiment. Recommend the strongest next test. Avoid invented pricing or proof.";
  try { return sendJson(response, 200, { type, ...(await askOpenAI(input, 1400)) }); }
  catch (error) { return sendJson(response, 502, { error: error.message }); }
}

function fetchTranscript(videoId) {
  return new Promise((resolve, reject) => {
    const process = spawn("python3", [path.join(__dirname, "scripts", "fetch_transcript.py"), videoId]);
    let output = "";
    let error = "";
    process.stdout.on("data", (chunk) => { output += chunk; });
    process.stderr.on("data", (chunk) => { error += chunk; });
    process.on("close", (code) => code === 0 ? resolve(JSON.parse(output)) : reject(new Error(error || "Transcript unavailable")));
  });
}

async function handleTranscript(request, response) {
  let payload;
  try { payload = JSON.parse(await readBody(request)); } catch { return sendJson(response, 400, { error: "Invalid JSON request." }); }
  const videoId = String(payload.videoId || "").match(/[A-Za-z0-9_-]{11}/)?.[0];
  if (!videoId) return sendJson(response, 400, { error: "Provide a valid YouTube URL or 11-character video ID." });
  try {
    const transcript = await fetchTranscript(videoId);
    learnedTranscript += `\n[YouTube ${videoId}, language ${transcript.language}]\n${transcript.text}`;
    return sendJson(response, 200, { videoId, language: transcript.language, charactersLearned: transcript.text.length });
  } catch (error) {
    console.error("Transcript import failed", error.message);
    return sendJson(response, 502, { error: "Could not retrieve a transcript for that video." });
  }
}

function serveStatic(request, response) {
  const requested = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  const filePath = path.resolve(publicDir, `.${requested}`);
  if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return sendJson(response, 404, { error: "Not found" });
  }
  const contentTypes = { ".css": "text/css", ".js": "text/javascript", ".html": "text/html" };
  response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
}

http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") return sendJson(response, 200, { ok: true });
  if (request.method === "GET" && request.url === "/api/status") return sendJson(response, 200, { configured: Boolean(apiKey) });
  if (request.method === "POST" && request.url === "/api/chat") return handleChat(request, response);
  if (request.method === "POST" && request.url === "/api/learn/youtube") return handleTranscript(request, response);
  if (request.method === "POST" && request.url === "/api/learn/youtube-channel") return handleChannelTranscript(request, response);
  if (request.method === "POST" && request.url === "/api/strategy") return handleStrategy(request, response);
  if (request.method === "GET") return serveStatic(request, response);
  return sendJson(response, 405, { error: "Method not allowed" });
}).listen(port, () => console.log(`Funnel Agent listening on ${port}`));

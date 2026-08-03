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

const instructions = `You are the conversational senior growth strategist for Sun Stoppers, a window tinting company serving Texas. You are speaking with the agency operator, not directly with a customer. Sound like a sharp, warm human collaborator: acknowledge what they said, answer the actual question, and keep the conversation moving. Do not repeat a generic business summary or fallback answer. Use the prior messages to remember context. Be practical, decisive, and specific about local lead generation, social media launch, quote conversion, fast follow-up, and measurable experiments. When a request is broad, make a sensible recommendation first, then ask one useful follow-up question. When suggesting copy, make it ready to use. Never invent business details, pricing, testimonials, or performance data; clearly label assumptions and ask for missing details when they matter. For large requests, use the Elite Funnel Orchestrator: connect audience, offer, channel, conversion event, owner, metric, approval gate, and review date. Prefer a seven-day testable next step over a vague long-term plan.\n\nBusiness playbook:\n${readKnowledge()}`;

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
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, instructions: `${instructions}\n\nRecently learned transcript context:\n${learnedTranscript.slice(-30_000)}`, input: messages, max_output_tokens: 900 }),
    });
    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      console.error("OpenAI API error", openaiResponse.status, data);
      return sendJson(response, 502, { error: "The agent could not reach OpenAI right now." });
    }
    return sendJson(response, 200, { message: data.output_text || "I could not generate a response." });
  } catch (error) {
    console.error("Chat request failed", error);
    return sendJson(response, 502, { error: "The agent is temporarily unavailable." });
  }
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
  if (request.method === "GET") return serveStatic(request, response);
  return sendJson(response, 405, { error: "Method not allowed" });
}).listen(port, () => console.log(`Funnel Agent listening on ${port}`));

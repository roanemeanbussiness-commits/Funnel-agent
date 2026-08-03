const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT || 8080);
const publicDir = path.join(__dirname, "public");
const model = process.env.OPENAI_MODEL || "gpt-5-mini";

const instructions = `You are the senior growth, marketing, and funnel agent for Sun Stoppers, a window tinting company serving Texas. Be practical, decisive, and specific. Prioritize local lead generation, social media launch, quote conversion, fast follow-up, and measurable experiments. Ask one concise clarifying question only when essential. Never invent business details, pricing, testimonials, or performance data. When suggesting copy, make it ready to use and keep it compliant and honest.`;

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
  if (!process.env.OPENAI_API_KEY) {
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
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, instructions, input: messages, max_output_tokens: 900 }),
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
  if (request.method === "POST" && request.url === "/api/chat") return handleChat(request, response);
  if (request.method === "GET") return serveStatic(request, response);
  return sendJson(response, 405, { error: "Method not allowed" });
}).listen(port, () => console.log(`Funnel Agent listening on ${port}`));

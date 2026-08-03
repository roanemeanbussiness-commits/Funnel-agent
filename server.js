const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const port = Number(process.env.PORT || 8080);
const publicDir = path.join(__dirname, "public");
const model = process.env.OPENAI_MODEL || "gpt-5-mini";
const apiKey = process.env.OPENAI_API_KEY || process.env.open_ai || process.env.OPEN_AI_API_KEY;
const transcriptMemory = {
  sunStoppers: "",
  general: "",
};

function normalizeAgentMode(value) {
  return value === "general" ? "general" : "sunStoppers";
}

function cleanText(value, limit = 900) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, limit);
}

function sanitizeBusinessProfile(profile = {}) {
  return {
    businessName: cleanText(profile.businessName, 120),
    industry: cleanText(profile.industry, 160),
    location: cleanText(profile.location, 160),
    idealCustomer: cleanText(profile.idealCustomer, 500),
    coreOffer: cleanText(profile.coreOffer, 500),
    brandVoice: cleanText(profile.brandVoice, 300),
    mainGoal: cleanText(profile.mainGoal, 500),
    notes: cleanText(profile.notes, 1_200),
  };
}

function businessProfileBrief(profile) {
  const details = [
    ["Business name", profile.businessName],
    ["Industry", profile.industry],
    ["Location or service area", profile.location],
    ["Ideal customer", profile.idealCustomer],
    ["Core offer", profile.coreOffer],
    ["Brand voice", profile.brandVoice],
    ["Main goal", profile.mainGoal],
    ["Extra notes", profile.notes],
  ].filter(([, value]) => value);

  if (!details.length) {
    return "No general business profile has been supplied yet. Ask the operator for business name, industry, location, ideal customer, offer, goal, and constraints before making specific recommendations.";
  }

  return details.map(([label, value]) => `- ${label}: ${value}`).join("\n");
}

function readKnowledge(folders = ["context", "skills", "agents"]) {
  return folders.flatMap((folder) => {
    const directory = path.join(__dirname, folder);
    return fs.readdirSync(directory).filter((file) => file.endsWith(".md")).map((file) => {
      return `## ${folder}/${file}\n${fs.readFileSync(path.join(directory, file), "utf8")}`;
    });
  }).join("\n\n");
}

const sunStoppersKnowledge = readKnowledge();
const sharedPromptLibrary = `## skills/prompt-library-marketing.md
${fs.readFileSync(path.join(__dirname, "skills", "prompt-library-marketing.md"), "utf8")}`;

const sharedAgentBehavior = "You are speaking with the agency operator, not directly with a customer. Sound like a sharp, warm human collaborator: acknowledge what they said, answer the actual question, and keep the conversation moving. Do not repeat a generic business summary or fallback answer. Use the prior messages to remember context. Be practical, decisive, and specific. When a request is broad, make a sensible recommendation first, then ask one useful follow-up question. When suggesting copy, make it ready to use. Never invent business details, pricing, testimonials, legal claims, or performance data; clearly label assumptions and ask for missing details when they matter. For large requests, connect audience, offer, channel, conversion event, owner, metric, approval gate, and review date. Prefer a seven-day testable next step over a vague long-term plan.";

const generalMarketingFramework = `Use this general marketing operating system:
1. Clarify the business model, target customer, offer, location, constraints, and success metric.
2. Diagnose the funnel from awareness to lead capture, qualification, follow-up, sale, review, referral, and retention.
3. Recommend the smallest useful test before proposing a complex system.
4. Separate assumptions from known facts.
5. Create usable outputs: offers, hooks, scripts, content calendars, landing-page sections, follow-up flows, outreach lists, and measurement plans.
6. Do not carry over Sun Stoppers or window-tinting facts unless the operator explicitly chooses that business.`;

function buildInstructions(agentMode, businessProfile) {
  if (agentMode === "general") {
    return `You are the General Use Funnel Agent: a flexible senior growth strategist for any business the operator inputs. ${sharedAgentBehavior}

Business profile supplied by the operator:
${businessProfileBrief(businessProfile)}

${generalMarketingFramework}

Shared prompt-library skill:
${sharedPromptLibrary}`;
  }

  return `You are the conversational senior growth strategist for Sun Stoppers, a Texas window tinting company. The primary growth goal is commercial and small-business window tinting: offices, storefronts, restaurants, retail locations, medical offices, gyms, apartments, property managers, dealerships, and local operators with customer-facing buildings. Vehicle tinting is a secondary offer unless the operator specifically asks about it. ${sharedAgentBehavior}

Business playbook:
${sunStoppersKnowledge}`;
}

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

async function askOpenAI(input, maxOutputTokens = 900, options = {}) {
  const agentMode = normalizeAgentMode(options.agentMode);
  const businessProfile = options.profileSharingConsent === true
    ? sanitizeBusinessProfile(options.businessProfile)
    : sanitizeBusinessProfile({});
  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: `${buildInstructions(agentMode, businessProfile)}\n\nRecently learned transcript context for this agent mode:\n${transcriptMemory[agentMode].slice(-30_000)}`,
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
    return sendJson(response, 200, await askOpenAI(messages, 900, {
      agentMode: payload.agentMode,
      businessProfile: payload.businessProfile,
      profileSharingConsent: payload.profileSharingConsent,
    }));
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
  const agentMode = normalizeAgentMode(payload.agentMode);
  const channelId = String(payload.channelId || "").trim();
  const limit = Math.min(Math.max(Number(payload.limit) || 3, 1), 25);
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
        transcriptMemory[agentMode] += `\n[YouTube channel ${channelId}, video ${video.videoId}, title ${video.title}, language ${transcript.language}]\n${transcript.text}`;
        results.push({ ...video, status: "learned", charactersLearned: transcript.text.length });
      } catch (error) {
        console.error("Channel transcript failed", video.videoId, error.message);
        results.push({ ...video, status: "unavailable" });
      }
    }
    return sendJson(response, 200, { agentMode, channelId, requested: videos.length, learned: results.filter((video) => video.status === "learned").length, videos: results });
  } catch (error) {
    console.error("Channel import failed", error.message);
    return sendJson(response, 502, { error: "Could not load videos from that YouTube channel." });
  }
}

async function handleStrategy(request, response) {
  if (!apiKey) return sendJson(response, 503, { error: "OpenAI is not configured on the server." });
  let payload;
  try { payload = JSON.parse(await readBody(request)); } catch { return sendJson(response, 400, { error: "Invalid JSON request." }); }
  const agentMode = normalizeAgentMode(payload.agentMode);
  const businessProfile = payload.profileSharingConsent === true
    ? sanitizeBusinessProfile(payload.businessProfile)
    : sanitizeBusinessProfile({});
  const type = payload.type === "offer" ? "offer" : "funnel";
  const input = buildStrategyPrompt(type, agentMode, businessProfile);
  try { return sendJson(response, 200, { type, agentMode, ...(await askOpenAI(input, 1400, { agentMode, businessProfile, profileSharingConsent: payload.profileSharingConsent })) }); }
  catch (error) { return sendJson(response, 502, { error: error.message }); }
}

function buildStrategyPrompt(type, agentMode, businessProfile) {
  if (agentMode === "general") {
    const profileBrief = businessProfileBrief(businessProfile);
    return type === "offer"
      ? `Refresh the offer for the general business profile below. Create 3 differentiated offers. For each, include target customer, problem, promise, deliverables, proof needed, CTA, operational risk, and fastest seven-day test. Recommend one winner and label missing business facts.\n\nBusiness profile:\n${profileBrief}`
      : `Create a fresh funnel map for the general business profile below. Give 3 funnel concepts, each with audience, trigger, message, channel, capture mechanism, qualification, proposal or sales step, follow-up, metric, and seven-day experiment. Recommend the strongest next test. Avoid invented pricing or proof.\n\nBusiness profile:\n${profileBrief}`;
  }

  return type === "offer"
    ? "Refresh Sun Stoppers' commercial window-tinting offer. Create 3 differentiated offers for Texas small businesses and commercial properties. For each, include target account, problem, promise, deliverables, proof needed, CTA, operational risk, and the fastest seven-day test. Recommend one winner and label any missing business facts."
    : "Create a fresh funnel map for Sun Stoppers focused on commercial and small-business window-tinting accounts. Give 3 new funnel concepts, each with audience, trigger, message, channel, capture mechanism, qualification, proposal step, follow-up, metric, and seven-day experiment. Recommend the strongest next test. Avoid invented pricing or proof.";
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
  const agentMode = normalizeAgentMode(payload.agentMode);
  const videoId = String(payload.videoId || "").match(/[A-Za-z0-9_-]{11}/)?.[0];
  if (!videoId) return sendJson(response, 400, { error: "Provide a valid YouTube URL or 11-character video ID." });
  try {
    const transcript = await fetchTranscript(videoId);
    transcriptMemory[agentMode] += `\n[YouTube ${videoId}, language ${transcript.language}]\n${transcript.text}`;
    return sendJson(response, 200, { agentMode, videoId, language: transcript.language, charactersLearned: transcript.text.length });
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
  if (request.method === "GET" && request.url === "/api/status") return sendJson(response, 200, { configured: Boolean(apiKey), modes: ["sunStoppers", "general"] });
  if (request.method === "POST" && request.url === "/api/chat") return handleChat(request, response);
  if (request.method === "POST" && request.url === "/api/learn/youtube") return handleTranscript(request, response);
  if (request.method === "POST" && request.url === "/api/learn/youtube-channel") return handleChannelTranscript(request, response);
  if (request.method === "POST" && request.url === "/api/strategy") return handleStrategy(request, response);
  if (request.method === "GET") return serveStatic(request, response);
  return sendJson(response, 405, { error: "Method not allowed" });
}).listen(port, () => console.log(`Funnel Agent listening on ${port}`));

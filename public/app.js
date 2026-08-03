const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatWindow = document.querySelector("#chatWindow");
const learningForm = document.querySelector("#learningForm");
const youtubeUrl = document.querySelector("#youtubeUrl");
const learningStatus = document.querySelector("#learningStatus");
const learningResult = document.querySelector("#learningResult");

const history = [];

const agentStatus = document.querySelector("#agentStatus");
fetch("/api/status")
  .then((response) => response.json())
  .then(({ configured }) => {
    agentStatus.textContent = configured ? "OpenAI connected" : "API key missing";
  })
  .catch(() => {
    agentStatus.textContent = "Agent offline";
  });

function addMessage(role, text) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.innerHTML = `<span>${role === "user" ? "You" : "Agent"}</span><p></p>`;
  message.querySelector("p").textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();

  if (!value) {
    return;
  }

  addMessage("user", value);
  history.push({ role: "user", content: value });
  chatInput.value = "";
  const button = chatForm.querySelector("button");
  button.disabled = true;
  button.textContent = "Thinking...";
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Agent request failed (${response.status})`);
    history.push({ role: "assistant", content: data.message });
    addMessage("agent", data.message);
  } catch (error) {
    addMessage("agent", `The live agent hit an error: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "Send";
    chatInput.focus();
  }
});

learningForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = learningForm.querySelector("button");
  const url = youtubeUrl.value.trim();
  if (!url) return;

  button.disabled = true;
  button.textContent = "Importing...";
  learningStatus.textContent = "Learning...";
  learningResult.textContent = "Fetching transcript and adding it to the agent's working context.";
  try {
    const response = await fetch("/api/learn/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: url }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Transcript import failed");
    learningStatus.textContent = "Learned";
    learningResult.textContent = `Imported ${data.charactersLearned.toLocaleString()} characters from video ${data.videoId}. Ask the agent about it in the chat.`;
    youtubeUrl.value = "";
  } catch (error) {
    learningStatus.textContent = "Needs attention";
    learningResult.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Import transcript";
  }
});

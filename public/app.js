const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatWindow = document.querySelector("#chatWindow");

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

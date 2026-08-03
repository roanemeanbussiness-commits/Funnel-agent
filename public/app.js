const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatWindow = document.querySelector("#chatWindow");

const responses = [
  {
    match: ["post", "content", "reel", "social"],
    text:
      "Start with proof-heavy local content: a heat lamp demo, a before/after walkaround, an installer POV clip, and a customer handoff. Keep every caption pointed at a free quote.",
  },
  {
    match: ["ad", "campaign", "offer"],
    text:
      "Run one simple offer first: 'Beat the Texas heat with premium window tint. Message us for a free quote.' Pair it with a 15-second demo and send clicks to one quote form.",
  },
  {
    match: ["funnel", "lead", "booking"],
    text:
      "The first funnel should be lean: social post or ad, quote landing page, phone/message CTA, fast follow-up script, booking reminder, then review request after install.",
  },
  {
    match: ["script", "sms", "follow"],
    text:
      "Try this: 'Hey, this is Sun Stoppers. Thanks for asking about tint. What vehicle are you tinting, and are you more focused on heat rejection, privacy, or looks?'",
  },
];

function addMessage(role, text) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.innerHTML = `<span>${role === "user" ? "You" : "Agent"}</span><p></p>`;
  message.querySelector("p").textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function getAgentReply(input) {
  const normalized = input.toLowerCase();
  const found = responses.find((response) =>
    response.match.some((word) => normalized.includes(word)),
  );

  if (found) {
    return found.text;
  }

  return "I would frame this around Sun Stoppers' launch priorities: build trust fast, show real tint outcomes, make the quote path obvious, and follow up within five minutes.";
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();

  if (!value) {
    return;
  }

  addMessage("user", value);
  chatInput.value = "";

  window.setTimeout(() => {
    addMessage("agent", getAgentReply(value));
  }, 350);
});

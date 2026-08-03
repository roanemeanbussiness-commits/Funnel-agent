const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatWindow = document.querySelector("#chatWindow");
const learningForm = document.querySelector("#learningForm");
const youtubeUrl = document.querySelector("#youtubeUrl");
const learningStatus = document.querySelector("#learningStatus");
const learningResult = document.querySelector("#learningResult");
const channelLearningForm = document.querySelector("#channelLearningForm");
const youtubeChannelId = document.querySelector("#youtubeChannelId");
const channelVideoLimit = document.querySelector("#channelVideoLimit");
const channelLearningResult = document.querySelector("#channelLearningResult");
const refreshOfferButton = document.querySelector("#refreshOfferButton");
const refreshFunnelButton = document.querySelector("#refreshFunnelButton");
const offerResult = document.querySelector("#offerResult");
const funnelResult = document.querySelector("#funnelResult");
const agentStatus = document.querySelector("#agentStatus");
const businessProfilePanel = document.querySelector("#businessProfile");
const businessProfileForm = document.querySelector("#businessProfileForm");
const businessProfileStatus = document.querySelector("#businessProfileStatus");
const clearBusinessProfileButton = document.querySelector("#clearBusinessProfileButton");
const profileSharingConsent = document.querySelector("#profileSharingConsent");
const generalNavLink = document.querySelector(".general-nav-link");
const funnelBoard = document.querySelector("#funnelBoard");
const socialChecklist = document.querySelector("#socialChecklist");
const contentStack = document.querySelector("#contentStack");
const operatingBrief = document.querySelector("#operatingBrief");

const profileFields = {
  businessName: document.querySelector("#profileBusinessName"),
  industry: document.querySelector("#profileIndustry"),
  location: document.querySelector("#profileLocation"),
  idealCustomer: document.querySelector("#profileIdealCustomer"),
  coreOffer: document.querySelector("#profileCoreOffer"),
  brandVoice: document.querySelector("#profileBrandVoice"),
  mainGoal: document.querySelector("#profileMainGoal"),
  notes: document.querySelector("#profileNotes"),
};

const profileStorageKey = "funnelAgent.generalBusinessProfile";
const profileConsentStorageKey = "funnelAgent.generalProfileSharingConsent";
const modeStorageKey = "funnelAgent.activeMode";
let activeAgentMode = localStorage.getItem(modeStorageKey) === "general" ? "general" : "sunStoppers";

const histories = {
  sunStoppers: [],
  general: [],
};

const strategyResults = {
  sunStoppers: {
    offer: "Your next offer refresh will appear here.",
    funnel: "",
  },
  general: {
    offer: "Your general business offer refresh will appear here.",
    funnel: "",
  },
};

const modeContent = {
  sunStoppers: {
    subtitle: "Sun Stoppers TX",
    clientName: "Sun Stoppers",
    clientSummary: "Commercial and small-business window tinting growth system for Texas.",
    hero: {
      eyebrow: "Marketing beast mode",
      title: "Growth command center for Sun Stoppers Texas.",
      copy: "Build the social foundation, capture local tinting demand, and turn every inquiry into a booked estimate.",
      panelLabel: "This Week",
      panelTitle: "Launch Sprint",
      panelCopy: "Profiles, offer, landing path, first 14 posts, review request flow.",
    },
    metrics: [
      ["Lead Goal", "40", "qualified estimate requests / month"],
      ["Primary Offer", "Free Quote", "heat rejection, privacy, UV protection"],
      ["Local Radius", "25 mi", "Texas shop service area"],
      ["Launch Assets", "18%", "profiles and creative kit in progress"],
    ],
    funnelHeading: "From local attention to booked tint jobs",
    funnel: [
      ["Awareness", "Short-form proof", "Before/after tint reels, heat rejection demos, customer walkarounds."],
      ["Capture", "Quote request", "Simple landing page, click-to-call, message intake, offer tracking."],
      ["Convert", "Booking follow-up", "SMS/email reminders, objections handled, install appointment scheduled."],
      ["Amplify", "Reviews and referrals", "Post-install review asks, referral incentive, photo permission workflow."],
    ],
    socialHeading: "Account launch checklist",
    checklist: [
      "Claim Instagram, Facebook, TikTok, YouTube handles",
      "Add shop logo, hours, service radius, quote CTA",
      "Create review link and Google Business profile flow",
      "Load first two weeks of posts",
    ],
    contentHeading: "Next content moves",
    content: [
      ["Reel", "Texas heat test: cabin temp before and after ceramic tint."],
      ["Carousel", "5 reasons drivers choose window tint beyond looks."],
      ["Short", "Installer POV: clean edge reveal on a truck side window."],
    ],
    learningHeading: "Teach the agent from YouTube",
    learningCopy: "Paste a video link and the agent will transcribe it into working marketing context for this session.",
    offerHeading: "Refresh the commercial offer",
    offerCopy: "Generate new commercial offers using the latest Sun Stoppers context and learned material.",
    chatHeading: "Talk to the Sun Stoppers agent",
    chatPlaceholder: "Ask for a Sun Stoppers campaign, post, script, or funnel idea...",
    chatIntro: "I am loaded with Sun Stoppers commercial window-tinting growth context. Ask for content ideas, funnel steps, launch priorities, ad angles, or lead follow-up scripts.",
    brief: [
      ["Client", "Sun Stoppers, Texas commercial window tinting"],
      ["Need", "Commercial outreach, local awareness, quote capture"],
      ["Voice", "Expert, local, practical, confident"],
      ["Primary CTA", "Book a free tint quote"],
    ],
  },
  general: {
    subtitle: "General Use",
    clientName: "General Business Agent",
    clientSummary: "Reusable marketing and funnel agent for the business you enter.",
    hero: {
      eyebrow: "General growth mode",
      title: "Growth command center for any business.",
      copy: "Input the current business details, then use the same funnel, offer, content, learning, and chat workflow.",
      panelLabel: "Current Focus",
      panelTitle: "Profile First",
      panelCopy: "Business model, offer, audience, location, proof, channels, and next growth test.",
    },
    metrics: [
      ["Business", "Set", "add the current company profile"],
      ["Offer", "Define", "load the service, package, or CTA"],
      ["Audience", "Choose", "name the customer and trigger"],
      ["Next Test", "7 days", "turn strategy into a short experiment"],
    ],
    funnelHeading: "From attention to booked revenue",
    funnel: [
      ["Audience", "Who should care", "Define the buyer, problem, trigger, urgency, and buying situation."],
      ["Capture", "Low-friction action", "Pick one clear conversion step: call, form, DM, quote, booking, or consultation."],
      ["Convert", "Follow-up system", "Build scripts, reminders, objections, proposal steps, and owner approval gates."],
      ["Compound", "Proof and retention", "Collect reviews, case studies, referrals, upsells, and learnings from every sale."],
    ],
    socialHeading: "General launch checklist",
    checklist: [
      "Define ICP, offer, proof, objections, and buying triggers",
      "Audit website, Google profile, social profiles, and lead capture",
      "Create the first two weeks of content around customer pain",
      "Build follow-up scripts and one measurable growth test",
    ],
    contentHeading: "Reusable content moves",
    content: [
      ["Proof", "Show a result, walkthrough, transformation, or customer moment."],
      ["Education", "Answer the buyer's most common pre-sale question."],
      ["Offer", "Make one clear next step feel easy and worth taking."],
    ],
    learningHeading: "Teach the general agent from YouTube",
    learningCopy: "Imported transcripts stay attached to the General Use agent for this running session.",
    offerHeading: "Refresh the business offer",
    offerCopy: "Generate offer ideas from the current business profile and learned material.",
    chatHeading: "Talk to the general agent",
    chatPlaceholder: "Ask for a campaign, post, script, offer, or funnel idea for this business...",
    chatIntro: "I am in General Use mode. Add the business profile, choose whether to share it with the live AI brain, then ask me to build offers, content, funnels, scripts, outreach, or experiments for that specific company.",
    brief: [
      ["Mode", "General marketing and funnel strategist"],
      ["Input", "Business profile supplied in this tab"],
      ["Voice", "Adapts to the brand voice you enter"],
      ["Primary CTA", "Depends on the current business offer"],
    ],
  },
};

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

function getBusinessProfile() {
  return Object.fromEntries(
    Object.entries(profileFields).map(([key, field]) => [key, field.value.trim()])
  );
}

function getShareableBusinessProfile() {
  if (!isProfileSharingEnabled()) {
    return {};
  }
  return getBusinessProfile();
}

function isProfileSharingEnabled() {
  return activeAgentMode === "general" && profileSharingConsent.checked;
}

function fillBusinessProfile(profile) {
  Object.entries(profileFields).forEach(([key, field]) => {
    field.value = profile[key] || "";
  });
}

function loadBusinessProfile() {
  try {
    return JSON.parse(localStorage.getItem(profileStorageKey)) || {};
  } catch {
    return {};
  }
}

function updateProfileStatus(status) {
  const sharing = profileSharingConsent.checked ? "sharing enabled" : "local only";
  businessProfileStatus.textContent = `${status} - ${sharing}`;
}

function saveBusinessProfile() {
  localStorage.setItem(profileStorageKey, JSON.stringify(getBusinessProfile()));
  localStorage.setItem(profileConsentStorageKey, String(profileSharingConsent.checked));
  updateProfileStatus("Saved");
  renderMode();
}

function clearBusinessProfile() {
  localStorage.removeItem(profileStorageKey);
  localStorage.removeItem(profileConsentStorageKey);
  fillBusinessProfile({});
  profileSharingConsent.checked = false;
  updateProfileStatus("Cleared");
  renderMode();
}

function getRenderedContent(mode) {
  const content = modeContent[mode];
  if (mode !== "general") return content;

  const profile = getBusinessProfile();
  const businessName = profile.businessName || "any business";
  const industry = profile.industry || "the current industry";
  const location = profile.location || "the current market";
  const mainGoal = profile.mainGoal || "Build the business profile, then generate the next growth test.";
  const coreOffer = profile.coreOffer || "Define the core offer";
  const idealCustomer = profile.idealCustomer || "Choose the ideal customer";

  return {
    ...content,
    clientName: profile.businessName || content.clientName,
    clientSummary: profile.industry
      ? `${profile.industry}${profile.location ? ` in ${profile.location}` : ""}.`
      : content.clientSummary,
    hero: {
      ...content.hero,
      title: `Growth command center for ${businessName}.`,
      copy: mainGoal,
      panelCopy: `${industry} in ${location}.`,
    },
    metrics: [
      ["Business", profile.businessName ? "Loaded" : "Set", profile.businessName || "add the current company profile"],
      ["Offer", profile.coreOffer ? "Loaded" : "Define", coreOffer],
      ["Audience", profile.idealCustomer ? "Loaded" : "Choose", idealCustomer],
      ["Next Test", "7 days", profile.mainGoal || "turn strategy into a short experiment"],
    ],
    brief: [
      ["Mode", "General marketing and funnel strategist"],
      ["Business", profile.businessName || "Not set yet"],
      ["Industry", profile.industry || "Not set yet"],
      ["Market", profile.location || "Not set yet"],
      ["Profile sharing", profileSharingConsent.checked ? "Enabled for live AI requests" : "Local only"],
      ["Goal", profile.mainGoal || "Not set yet"],
    ],
  };
}

function renderCards(container, rows) {
  container.replaceChildren();
  rows.forEach(([label, title, copy]) => {
    const card = document.createElement("div");
    const labelEl = document.createElement("span");
    const titleEl = document.createElement("strong");
    const copyEl = document.createElement("p");
    labelEl.textContent = label;
    titleEl.textContent = title;
    copyEl.textContent = copy;
    card.append(labelEl, titleEl, copyEl);
    container.appendChild(card);
  });
}

function renderChecklist(items) {
  socialChecklist.replaceChildren();
  items.forEach((item) => {
    const li = document.createElement("li");
    const marker = document.createElement("span");
    li.append(marker, document.createTextNode(item));
    socialChecklist.appendChild(li);
  });
}

function renderContentStack(items) {
  contentStack.replaceChildren();
  items.forEach(([title, copy]) => {
    const card = document.createElement("div");
    const titleEl = document.createElement("strong");
    const copyEl = document.createElement("p");
    titleEl.textContent = title;
    copyEl.textContent = copy;
    card.append(titleEl, copyEl);
    contentStack.appendChild(card);
  });
}

function renderOperatingBrief(items) {
  operatingBrief.replaceChildren();
  items.forEach(([term, description]) => {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = description;
    row.append(dt, dd);
    operatingBrief.appendChild(row);
  });
}

function appendMessage(role, text) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.innerHTML = `<span>${role === "user" ? "You" : "Agent"}</span><p></p>`;
  message.querySelector("p").textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderChat() {
  const content = getRenderedContent(activeAgentMode);
  chatWindow.replaceChildren();
  appendMessage("agent", content.chatIntro);
  histories[activeAgentMode].forEach((message) => {
    appendMessage(message.role === "user" ? "user" : "agent", message.content);
  });
}

function renderMode() {
  const content = getRenderedContent(activeAgentMode);
  document.querySelectorAll("[data-agent-mode]").forEach((button) => {
    const isActive = button.dataset.agentMode === activeAgentMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  businessProfilePanel.hidden = activeAgentMode !== "general";
  generalNavLink.hidden = activeAgentMode !== "general";

  setText("#modeSubtitle", content.subtitle);
  setText("#clientName", content.clientName);
  setText("#clientSummary", content.clientSummary);
  setText("#heroEyebrow", content.hero.eyebrow);
  setText("#heroTitle", content.hero.title);
  setText("#heroCopy", content.hero.copy);
  setText("#heroPanelLabel", content.hero.panelLabel);
  setText("#heroPanelTitle", content.hero.panelTitle);
  setText("#heroPanelCopy", content.hero.panelCopy);

  ["One", "Two", "Three", "Four"].forEach((slot, index) => {
    const [label, value, copy] = content.metrics[index];
    setText(`#metric${slot}Label`, label);
    setText(`#metric${slot}Value`, value);
    setText(`#metric${slot}Copy`, copy);
  });

  setText("#funnelHeading", content.funnelHeading);
  renderCards(funnelBoard, content.funnel);
  setText("#socialHeading", content.socialHeading);
  renderChecklist(content.checklist);
  setText("#contentHeading", content.contentHeading);
  renderContentStack(content.content);
  setText("#learningHeading", content.learningHeading);
  setText("#learningCopy", content.learningCopy);
  setText("#offerHeading", content.offerHeading);
  setText("#offerCopy", content.offerCopy);
  setText("#chatHeading", content.chatHeading);
  chatInput.placeholder = content.chatPlaceholder;
  renderOperatingBrief(content.brief);
  offerResult.textContent = strategyResults[activeAgentMode].offer;
  funnelResult.textContent = strategyResults[activeAgentMode].funnel;
  learningStatus.textContent = "Ready";
}

function setAgentMode(mode) {
  activeAgentMode = mode === "general" ? "general" : "sunStoppers";
  localStorage.setItem(modeStorageKey, activeAgentMode);
  renderMode();
  renderChat();
}

fetch("/api/status")
  .then((response) => response.json())
  .then(({ configured }) => {
    agentStatus.textContent = configured ? "OpenAI connected" : "API key missing";
  })
  .catch(() => {
    agentStatus.textContent = "Agent offline";
  });

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();

  if (!value) return;

  const mode = activeAgentMode;
  histories[mode].push({ role: "user", content: value });
  appendMessage("user", value);
  chatInput.value = "";

  const button = chatForm.querySelector("button");
  button.disabled = true;
  button.textContent = "Thinking...";
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentMode: mode,
        businessProfile: getShareableBusinessProfile(),
        profileSharingConsent: isProfileSharingEnabled(),
        messages: histories[mode],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Agent request failed (${response.status})`);
    histories[mode].push({ role: "assistant", content: data.message });
    if (mode === activeAgentMode) appendMessage("agent", data.message);
  } catch (error) {
    if (mode === activeAgentMode) appendMessage("agent", `The live agent hit an error: ${error.message}`);
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
  learningResult.textContent = "Fetching transcript and adding it to this agent's working context.";
  try {
    const response = await fetch("/api/learn/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentMode: activeAgentMode,
        videoId: url,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Transcript import failed");
    learningStatus.textContent = "Learned";
    learningResult.textContent = `Imported ${data.charactersLearned.toLocaleString()} characters from video ${data.videoId}. Ask this agent about it in the chat.`;
    youtubeUrl.value = "";
  } catch (error) {
    learningStatus.textContent = "Needs attention";
    learningResult.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Import transcript";
  }
});

channelLearningForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = channelLearningForm.querySelector("button");
  button.disabled = true;
  button.textContent = "Learning...";
  channelLearningResult.textContent = "Finding recent videos and transcribing them one at a time.";
  try {
    const response = await fetch("/api/learn/youtube-channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentMode: activeAgentMode,
        channelId: youtubeChannelId.value.trim(),
        limit: channelVideoLimit.value,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Channel learning failed");
    const learnedTitles = data.videos
      .filter((video) => video.status === "learned")
      .map((video) => video.title)
      .join("; ");
    channelLearningResult.textContent = `Analyzed the latest ${data.requested} videos and learned from ${data.learned}. ${learnedTitles || "No transcripts were available."}`;
  } catch (error) {
    channelLearningResult.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Learn channel";
  }
});

async function refreshStrategy(type, button, output) {
  const mode = activeAgentMode;
  button.disabled = true;
  button.textContent = type === "offer" ? "Refreshing..." : "Mapping...";
  output.textContent = "The agent is researching the current context and building a new recommendation.";
  try {
    const response = await fetch("/api/strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentMode: mode,
        businessProfile: getShareableBusinessProfile(),
        profileSharingConsent: isProfileSharingEnabled(),
        type,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Strategy refresh failed");
    strategyResults[mode][type] = data.message;
    if (mode === activeAgentMode) output.textContent = data.message;
  } catch (error) {
    strategyResults[mode][type] = error.message;
    if (mode === activeAgentMode) output.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = type === "offer" ? "Refresh offer" : "Refresh funnel map";
  }
}

refreshOfferButton.addEventListener("click", () => refreshStrategy("offer", refreshOfferButton, offerResult));
refreshFunnelButton.addEventListener("click", () => refreshStrategy("funnel", refreshFunnelButton, funnelResult));

document.querySelectorAll("[data-agent-mode]").forEach((button) => {
  button.addEventListener("click", () => setAgentMode(button.dataset.agentMode));
});

document.querySelectorAll(".nav-list a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-list a").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

businessProfileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveBusinessProfile();
});

businessProfileForm.addEventListener("input", () => {
  updateProfileStatus("Unsaved");
  if (activeAgentMode === "general") renderMode();
});

profileSharingConsent.addEventListener("change", () => {
  localStorage.setItem(profileConsentStorageKey, String(profileSharingConsent.checked));
  updateProfileStatus("Saved");
  renderMode();
});

clearBusinessProfileButton.addEventListener("click", clearBusinessProfile);

fillBusinessProfile(loadBusinessProfile());
profileSharingConsent.checked = localStorage.getItem(profileConsentStorageKey) === "true";
updateProfileStatus(localStorage.getItem(profileStorageKey) ? "Saved" : "Not saved");
renderMode();
renderChat();

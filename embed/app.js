const state = { interests: new Set(), styles: new Set(), availability: "", commitment: "", campus: "", remote: false, search: "", visible: 12 };
let roles = [];

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const unique = (field) => [...new Set(roles.flatMap((role) => Array.isArray(role[field]) ? role[field] : [role[field]]).filter(Boolean))].sort();

const interestMarks = ["✦", "♡", "↗", "⌁", "✺", "✓", "◇", "+", "◎", "→", "△", "●"];

function toggleSet(set, value) { set.has(value) ? set.delete(value) : set.add(value); state.visible = 12; render(); }
function makeButton(label, className, set, mark = "") {
  const button = document.createElement("button");
  button.type = "button"; button.className = className; button.textContent = label; button.dataset.mark = mark;
  button.setAttribute("aria-pressed", set.has(label));
  button.addEventListener("click", () => toggleSet(set, label));
  return button;
}
function fillSelect(id, values) { const select = $(id); values.forEach((value) => select.add(new Option(value, value))); }

function matches(role) {
  const haystack = [role.role, role.summary, role.portfolio, ...role.interests, ...role.styles].join(" ").toLowerCase();
  return (!state.interests.size || [...state.interests].every((value) => role.interests.includes(value)))
    && (!state.styles.size || [...state.styles].every((value) => role.styles.includes(value)))
    && (!state.availability || role.availability === state.availability)
    && (!state.commitment || role.commitment === state.commitment)
    && (!state.campus || role.campus === state.campus || role.campus === "All" || role.campus === "Either")
    && (!state.remote || ["yes", "partly"].includes(role.remote.toLowerCase()))
    && (!state.search || haystack.includes(state.search));
}

function card(role) {
  const article = document.createElement("article"); article.className = "role-card";
  const tags = [role.availability, role.commitment, role.remote === "Yes" ? "From home" : ""].filter(Boolean).slice(0, 3);
  article.innerHTML = `<div class="card-topline"><span>${escapeHtml(role.portfolio)}</span><span>${escapeHtml(role.campus)}</span></div><h3>${escapeHtml(role.role)}</h3><p>${escapeHtml(role.summary)}</p><div class="card-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div><button class="view-role" type="button">View role</button>`;
  article.querySelector("button").addEventListener("click", () => openRole(role));
  return article;
}

function openRole(role) {
  const subject = encodeURIComponent(`Volunteer interest: ${role.role}`);
  const body = encodeURIComponent(`Hi Catalyst team,\n\nI'm interested in learning more about the ${role.role} volunteer role.\n\nMy name:\nMy preferred campus:\nMy phone number:\n\nThanks!`);
  $("#dialog-content").innerHTML = `<p class="dialog-kicker">${escapeHtml(role.portfolio)} · ${escapeHtml(role.campus)}</p><h2 id="dialog-title">${escapeHtml(role.role)}</h2><p class="dialog-summary">${escapeHtml(role.summary)}</p><dl class="detail-grid"><div><dt>When</dt><dd>${escapeHtml(role.availability || "Flexible")}</dd></div><div><dt>Time</dt><dd>${escapeHtml(role.commitment || "Ask the team")}</dd></div><div><dt>Frequency</dt><dd>${escapeHtml(role.frequency || "Ask the team")}</dd></div><div><dt>From home</dt><dd>${escapeHtml(role.remote || "Ask the team")}</dd></div><div><dt>What suits this role</dt><dd>${escapeHtml(role.styles.join(", "))}</dd></div><div><dt>Training</dt><dd>${escapeHtml(role.requirements || "Ask the team")}</dd></div></dl><div class="dialog-actions"><a href="mailto:office@catalystbaptist.org.au?subject=${subject}&body=${body}">I'm interested</a><span class="dialog-note">Opens an email with this role already included.</span></div>`;
  $("#role-dialog").showModal();
}

function activeFilterEntries() {
  return [...state.interests].map((v) => [v, () => state.interests.delete(v)]).concat([...state.styles].map((v) => [v, () => state.styles.delete(v)]), [[state.availability, () => state.availability = ""], [state.commitment, () => state.commitment = ""], [state.campus, () => state.campus = ""], [state.remote ? "From home" : "", () => state.remote = false]]).filter(([label]) => label);
}

function reset() { state.interests.clear(); state.styles.clear(); state.availability = state.commitment = state.campus = state.search = ""; state.remote = false; state.visible = 12; $("#search").value = ""; render(); }

function render() {
  document.querySelectorAll(".choice, .chip").forEach((button) => button.setAttribute("aria-pressed", state.interests.has(button.textContent) || state.styles.has(button.textContent)));
  $("#availability-filter").value = state.availability; $("#commitment-filter").value = state.commitment; $("#campus-filter").value = state.campus; $("#remote-filter").checked = state.remote;
  const filtered = roles.filter(matches); $("#match-count").textContent = filtered.length;
  const grid = $("#role-grid"); grid.replaceChildren(...filtered.slice(0, state.visible).map(card));
  $("#empty-state").hidden = filtered.length > 0; $("#show-more").hidden = filtered.length <= state.visible;
  const active = $("#active-filters"); active.replaceChildren(...activeFilterEntries().map(([label, remove]) => { const button = document.createElement("button"); button.className = "active-pill"; button.type = "button"; button.textContent = label; button.addEventListener("click", () => { remove(); state.visible = 12; render(); }); return button; }));
  $("#clear-all").hidden = activeFilterEntries().length === 0 && !state.search;
  window.parent.postMessage({ type: "catalyst-find-your-fit:resize", height: document.documentElement.scrollHeight }, "*");
}

async function init() {
  roles = await fetch("roles.json?v=20260814-1").then((response) => { if (!response.ok) throw new Error("Could not load roles"); return response.json(); });
  unique("interests").forEach((value, index) => $("#interest-filters").append(makeButton(value, "choice", state.interests, interestMarks[index % interestMarks.length])));
  unique("styles").forEach((value) => $("#style-filters").append(makeButton(value, "chip", state.styles)));
  fillSelect("#availability-filter", unique("availability")); fillSelect("#commitment-filter", unique("commitment")); fillSelect("#campus-filter", unique("campus").filter((value) => !["All", "Either"].includes(value)));
  [["#availability-filter", "availability"], ["#commitment-filter", "commitment"], ["#campus-filter", "campus"]].forEach(([id, key]) => $(id).addEventListener("change", (event) => { state[key] = event.target.value; state.visible = 12; render(); }));
  $("#remote-filter").addEventListener("change", (event) => { state.remote = event.target.checked; state.visible = 12; render(); });
  $("#search").addEventListener("input", (event) => { state.search = event.target.value.trim().toLowerCase(); state.visible = 12; render(); });
  $("#clear-all").addEventListener("click", reset); $("#empty-clear").addEventListener("click", reset);
  $("#show-more").addEventListener("click", () => { state.visible += 12; render(); });
  $(".dialog-close").addEventListener("click", () => $("#role-dialog").close());
  $("#role-dialog").addEventListener("click", (event) => { if (event.target === $("#role-dialog")) $("#role-dialog").close(); });
  render();
}

init().catch(() => { $("#role-grid").innerHTML = '<p>We couldn’t load the opportunities just now. Please refresh the page or email office@catalystbaptist.org.au.</p>'; });

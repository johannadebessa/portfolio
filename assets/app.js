const $ = (sel) => document.querySelector(sel);

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const btn = $("#themeToggle");
  if (btn) btn.textContent = theme === "light" ? "☼" : "☾";
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) return setTheme(saved);
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  setTheme(prefersLight ? "light" : "dark");
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}

function getAllTags(projects) {
  const set = new Set();
  projects.forEach(p => (p.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort((a,b) => a.localeCompare(b, "fr"));
}

function renderFilters(tags, active, onPick) {
  const wrap = $("#filters");
  if (!wrap) return;

  const all = ["Tous", ...tags];
  wrap.innerHTML = all.map(tag => {
    const pressed = tag === active ? "true" : "false";
    return `<button class="filterbtn" type="button" aria-pressed="${pressed}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;
  }).join("");

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tag]");
    if (!btn) return;
    onPick(btn.getAttribute("data-tag"));
  }, { once: true });
}

function projectCard(p) {
  const tags = (p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  const kpis = (p.kpis || []).map(k => `<span class="kpi">${escapeHtml(k)}</span>`).join("");
  const actions = (p.actions || []).slice(0, 4).map(a => `<li>${escapeHtml(a)}</li>`).join("");

  return `
    <article class="card project">
      <div class="card__content">
        <h3 class="project__title">${escapeHtml(p.title)}</h3>
        <div class="project__meta">${escapeHtml(p.period || "")} • ${escapeHtml(p.context || "")}</div>

        <ul class="bullets" style="margin-top:12px">${actions}</ul>

        ${kpis ? `<div class="project__kpis">${kpis}</div>` : ``}
        <div class="tagrow">${tags}</div>
      </div>
    </article>
  `;
}

async function loadProjects() {
  const grid = $("#projectsGrid");
  if (!grid) return;

  const res = await fetch("assets/projects.json", { cache: "no-store" });
  const projects = await res.json();

  let active = "Tous";
  const tags = getAllTags(projects);

  const draw = () => {
    const filtered = active === "Tous"
      ? projects
      : projects.filter(p => (p.tags || []).includes(active));

    grid.innerHTML = filtered.map(projectCard).join("");

    // Re-render filters (so aria-pressed is accurate) + re-bind click handler
    renderFilters(tags, active, (next) => { active = next; draw(); });
  };

  draw();
}

function initFooterYear() {
  const el = $("#year");
  if (el) el.textContent = new Date().getFullYear();
}

function initThemeToggle() {
  const btn = $("#themeToggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current === "dark" ? "light" : "dark");
  });
}

initTheme();
initThemeToggle();
initFooterYear();
loadProjects().catch(() => {
  const grid = $("#projectsGrid");
  if (grid) grid.innerHTML = `<div class="card"><div class="card__content">Erreur : vérifie <code>assets/projects.json</code>.</div></div>`;
});

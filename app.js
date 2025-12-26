// app.js

/***********************
 * CONFIG
 ***********************/
const SUPABASE_URL = "https://kypkibudjjdnqlfdlkz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IxMUlcAIP0yGlp-JDHxI-Q_lozJCUrG";

// Search provider: pick ONE.
// DuckDuckGo (default): "https://duckduckgo.com/?q="
// Google: "https://www.google.com/search?q="
// Wikipedia: "https://en.wikipedia.org/wiki/Special:Search?search="
const SEARCH_BASE = "https://duckduckgo.com/?q=";

/***********************
 * STORAGE KEYS
 ***********************/
const LOCAL_KEY = "mySheet.localDraft.v1";
const CUSTOM_KEY = "mySheet.customTemplate.v1";

/***********************
 * SUPABASE
 ***********************/
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/***********************
 * HELPERS
 ***********************/
const el = (id) => document.getElementById(id);

function setStatus(msg) {
  el("status").textContent = msg || "";
}

function nowIso() {
  return new Date().toISOString();
}

function safeId(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function makeSearchUrl(query) {
  const q = encodeURIComponent(query);
  return `${SEARCH_BASE}${q}`;
}

// rating values
const RATINGS = ["fav", "like", "int", "no", "unset"];

/***********************
 * TEMPLATE (base + customization)
 ***********************/
function loadCustomization() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "null") || {
      hiddenBaseSectionIds: [],
      customSections: [],
    };
  } catch {
    return { hiddenBaseSectionIds: [], customSections: [] };
  }
}

function saveCustomization(custom) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
}

function resetCustomization() {
  localStorage.removeItem(CUSTOM_KEY);
}

function getTemplate() {
  const base = window.SHEET_BASE || [];
  const custom = loadCustomization();

  const baseVisible = base.filter((s) => !custom.hiddenBaseSectionIds.includes(s.id));

  // Custom sections are very simple in v1: General mode only
  const customSections = (custom.customSections || []).map((cs) => ({
    id: cs.id,
    title: cs.title,
    desc: cs.desc || "Your custom category.",
    search: cs.search || cs.title,
    modes: ["General"],
    items: (cs.items || []).map((label) => ({
      id: `${cs.id}__${safeId(label)}`,
      label: label,
      search: label,
    })),
    _isCustom: true,
  }));

  return [...baseVisible, ...customSections];
}

/***********************
 * ANSWERS MODEL
 * answers[itemId][mode] = "fav"|"like"|"int"|"no"|"unset"
 ***********************/
function emptyAnswersForTemplate(template) {
  const answers = {};
  for (const section of template) {
    for (const item of section.items) {
      answers[item.id] = {};
      for (const mode of section.modes) {
        answers[item.id][mode] = "unset";
      }
    }
  }
  return answers;
}

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null");
  } catch {
    return null;
  }
}

function saveLocal(payload) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
}

function loadLocalOrInit(template) {
  const saved = loadLocal();
  const fresh = emptyAnswersForTemplate(template);

  if (!saved || !saved.answers) {
    return { answers: fresh, updated_at: nowIso() };
  }

  // Merge saved answers into fresh template (keeps new items safe)
  for (const itemId of Object.keys(saved.answers)) {
    if (!fresh[itemId]) continue;
    const modes = saved.answers[itemId] || {};
    for (const mode of Object.keys(modes)) {
      if (fresh[itemId][mode] !== undefined) {
        fresh[itemId][mode] = modes[mode];
      }
    }
  }

  return { answers: fresh, updated_at: nowIso() };
}

/***********************
 * RENDER
 ***********************/
function render(template, state, readOnly = false) {
  const root = el("sheet");
  root.innerHTML = "";

  for (const section of template) {
    const sec = document.createElement("section");
    sec.className = "section";

    // header
    const head = document.createElement("div");
    head.className = "section-head";

    const left = document.createElement("div");
    const title = document.createElement("div");
    title.className = "section-title";
    title.textContent = section.title;

    const desc = document.createElement("div");
    desc.className = "section-desc";
    desc.textContent = section.desc || "";

    left.appendChild(title);
    if (section.desc) left.appendChild(desc);

    const meta = document.createElement("div");
    meta.className = "section-meta";

    const info = document.createElement("a");
    info.className = "info-link";
    info.target = "_blank";
    info.rel = "noreferrer";
    info.title = "Search what this category means";
    info.textContent = "?";
    info.href = makeSearchUrl(section.search || section.title);

    meta.appendChild(info);

    head.appendChild(left);
    head.appendChild(meta);

    // subhead (modes)
    const sub = document.createElement("div");
    sub.className = "section-subhead";
    sub.innerHTML = `<div>${section.modes.join(" / ")}</div><div></div>`;

    // rows
    const rows = document.createElement("div");
    rows.className = "rows";

    for (const item of section.items) {
      const row = document.createElement("div");
      row.className = "rowItem";

      const label = document.createElement("div");
      label.className = "label";
      label.textContent = item.label;

      // Optional: click label to search the term
      label.style.cursor = "pointer";
      label.title = "Search this term";
      label.onclick = () => window.open(makeSearchUrl(item.search || item.label), "_blank", "noreferrer");

      const modes = document.createElement("div");
      modes.className = "modes";

      for (const mode of section.modes) {
        const group = document.createElement("div");
        group.className = "modeGroup";

        // Only show mode name if there are multiple modes
        if (section.modes.length > 1) {
          const modeName = document.createElement("div");
          modeName.className = "modeName";
          modeName.textContent = mode;
          group.appendChild(modeName);
        }

        const picks = document.createElement("div");
        picks.className = "picks";

        for (const val of RATINGS) {
          const btn = document.createElement("button");
          btn.className = "pick";
          btn.type = "button";
          btn.dataset.val = val;
          btn.title = val;

          const cur = state.answers?.[item.id]?.[mode] ?? "unset";
          if (cur === val) btn.classList.add("selected");

          if (readOnly) {
            btn.disabled = true;
          } else {
            btn.onclick = () => {
              state.answers[item.id][mode] = val;
              state.updated_at = nowIso();
              saveLocal(state);
              render(template, state, readOnly);
            };
          }

          picks.appendChild(btn);
        }

        group.appendChild(picks);
        modes.appendChild(group);
      }

      row.appendChild(label);
      row.appendChild(modes);
      rows.appendChild(row);
    }

    sec.appendChild(head);
    sec.appendChild(sub);
    sec.appendChild(rows);
    root.appendChild(sec);
  }
}

/***********************
 * SHARE ID / URL
 ***********************/
function getShareId() {
  const url = new URL(location.href);
  return url.searchParams.get("s");
}

function makeId() {
  // short-ish id: base36 time + random
  const a = Date.now().toString(36);
  const b = Math.random().toString(36).slice(2, 8);
  return `${a}${b}`;
}

/***********************
 * SUPABASE IO
 ***********************/
async function saveSheet(id, data) {
  // Upsert by id
  const payload = {
    id,
    data,
    created_at: nowIso(),
  };

  // If row exists, we keep the original created_at (not essential, but nicer)
  // So we attempt insert first, fallback to update.
  const { error: insertErr } = await sb.from("sheets").insert(payload);

  if (insertErr) {
    // Try update (if it already exists)
    const { error: updateErr } = await sb.from("sheets").update({ data }).eq("id", id);
    if (updateErr) throw updateErr;
  }
}

async function loadSheet(id) {
  const { data, error } = await sb.from("sheets").select("data").eq("id", id).single();
  if (error) throw error;
  return data?.data;
}

/***********************
 * EXPORTS
 ***********************/
async function exportPng() {
  setStatus("Exporting PNG...");
  const node = el("sheet");
  const canvas = await window.html2canvas(node, { scale: 2, useCORS: true });
  const url = canvas.toDataURL("image/png");

  const a = document.createElement("a");
  a.href = url;
  a.download = "my-sheet.png";
  a.click();

  setStatus("PNG exported.");
}

function exportPdf() {
  setStatus("Opening print dialog...");
  window.print();
}

/***********************
 * CUSTOMIZE UI
 ***********************/
function openCustomize() {
  el("modalBackdrop").classList.remove("hidden");
  el("customizeModal").classList.remove("hidden");
  buildCustomizeUI();
}

function closeCustomize() {
  el("modalBackdrop").classList.add("hidden");
  el("customizeModal").classList.add("hidden");
}

function buildCustomizeUI() {
  const custom = loadCustomization();
  const base = window.SHEET_BASE || [];

  // Base toggles
  const toggles = el("baseToggles");
  toggles.innerHTML = "";
  for (const sec of base) {
    const div = document.createElement("label");
    div.className = "toggle";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !custom.hiddenBaseSectionIds.includes(sec.id);
    cb.onchange = () => {
      if (cb.checked) {
        custom.hiddenBaseSectionIds = custom.hiddenBaseSectionIds.filter((x) => x !== sec.id);
      } else {
        if (!custom.hiddenBaseSectionIds.includes(sec.id)) custom.hiddenBaseSectionIds.push(sec.id);
      }
    };

    const txt = document.createElement("div");
    txt.innerHTML = `<b>${sec.title}</b><div style="font-size:12px;color:#555;margin-top:2px">${sec.desc || ""}</div>`;

    div.appendChild(cb);
    div.appendChild(txt);
    toggles.appendChild(div);
  }

  // Custom categories
  renderCustomCats(custom);
}

function renderCustomCats(custom) {
  const wrap = el("customCats");
  wrap.innerHTML = "";

  if (!custom.customSections || custom.customSections.length === 0) {
    wrap.innerHTML = `<p class="hint">No custom categories yet.</p>`;
    return;
  }

  for (const cs of custom.customSections) {
    const box = document.createElement("div");
    box.className = "custom-cat";

    const head = document.createElement("div");
    head.className = "custom-cat-head";

    const title = document.createElement("div");
    title.className = "custom-cat-title";
    title.textContent = cs.title;

    const del = document.createElement("button");
    del.className = "secondary";
    del.textContent = "Delete";
    del.onclick = () => {
      custom.customSections = custom.customSections.filter((x) => x.id !== cs.id);
      renderCustomCats(custom);
    };

    head.appendChild(title);
    head.appendChild(del);

    const area = document.createElement("textarea");
    area.placeholder = "One item per line";
    area.value = (cs.items || []).join("\n");
    area.oninput = () => {
      const lines = area.value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      cs.items = lines;
    };

    box.appendChild(head);
    box.appendChild(area);
    wrap.appendChild(box);
  }
}

/***********************
 * MAIN
 ***********************/
async function main() {
  const shareId = getShareId();
  const template = getTemplate();
  const localState = loadLocalOrInit(template);

  // Wire buttons
  el("exportPng").onclick = exportPng;
  el("exportPdf").onclick = exportPdf;

  el("clearLocal").onclick = () => {
    localStorage.removeItem(LOCAL_KEY);
    const fresh = loadLocalOrInit(getTemplate());
    render(getTemplate(), fresh, false);
    el("shareUrl").value = "";
    setStatus("Local draft cleared.");
  };

  // Customize modal events
  el("customizeBtn").onclick = openCustomize;
  el("closeCustomize").onclick = closeCustomize;
  el("modalBackdrop").onclick = closeCustomize;

  el("addCat").onclick = () => {
    const name = el("newCatName").value.trim();
    if (!name) return;

    const custom = loadCustomization();
    const id = `custom_${safeId(name)}_${Math.random().toString(36).slice(2, 6)}`;

    custom.customSections = custom.customSections || [];
    custom.customSections.push({
      id,
      title: name,
      desc: "Custom category you added.",
      search: name,
      items: [],
    });

    el("newCatName").value = "";
    saveCustomization(custom);
    buildCustomizeUI();
  };

  el("resetCustomize").onclick = () => {
    resetCustomization();
    buildCustomizeUI();
  };

  el("saveCustomize").onclick = () => {
    // save current edits in UI (already mutating custom object via handlers)
    // easiest: rebuild from current storage state + UI changes already applied
    const custom = loadCustomization();
    saveCustomization(custom);

    // refresh template + state
    const tpl = getTemplate();
    const st = loadLocalOrInit(tpl);
    saveLocal(st);
    render(tpl, st, false);

    closeCustomize();
    setStatus("Customization saved.");
  };

  // Shared view (read-only)
  if (shareId) {
    setStatus("Loading shared sheet...");
    try {
      const data = await loadSheet(shareId);

      // We only apply answers we understand (ignore unknown ids)
      const tpl = getTemplate();
      const st = loadLocalOrInit(tpl);
      if (data && data.answers) {
        for (const itemId of Object.keys(data.answers)) {
          if (!st.answers[itemId]) continue;
          for (const mode of Object.keys(data.answers[itemId])) {
            if (st.answers[itemId][mode] !== undefined) {
              st.answers[itemId][mode] = data.answers[itemId][mode];
            }
          }
        }
      }

      // Read-only render
      render(tpl, st, true);
      el("getLink").disabled = true;
      setStatus("Shared sheet loaded (read-only).");
    } catch (e) {
      console.error(e);
      setStatus("Failed to load shared sheet.");
      render(template, localState, false);
    }
    return;
  }

  // Normal (editable) render
  render(template, localState, false);

  // GET LINK
  el("getLink").onclick = async () => {
    setStatus("Saving...");
    el("getLink").disabled = true;

    try {
      const id = makeId();
      await saveSheet(id, loadLocalOrInit(getTemplate()));
      const url = `${location.origin}${location.pathname}?s=${id}`;
      el("shareUrl").value = url;
      el("shareUrl").select();
      setStatus("Saved. Share the link.");
    } catch (e) {
      console.error(e);
      setStatus("Save failed: " + (e?.message || "Unknown error"));
    } finally {
      el("getLink").disabled = false;
    }
  };
}

main();

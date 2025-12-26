/* global window, document, location, html2canvas */

/////////////////////////
// CONFIG
/////////////////////////

const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";

// Search provider (pick ONE)
const SEARCH_BASE = "https://duckduckgo.com/?q=";
// const SEARCH_BASE = "https://www.google.com/search?q=";
// const SEARCH_BASE = "https://en.wikipedia.org/wiki/Special:Search?search=";

/////////////////////////
// STORAGE KEYS
/////////////////////////

const LOCAL_KEY = "mySheet.localDraft.v1";

/////////////////////////
// SUPABASE CLIENT
/////////////////////////

// IMPORTANT: using CDN => window.supabase exists
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/////////////////////////
// HELPERS
/////////////////////////

const el = (id) => document.getElementById(id);

function setStatus(msg) {
  el("status").textContent = msg || "";
}

function openSearch(query) {
  const q = encodeURIComponent(String(query || "").trim());
  if (!q) return;
  window.open(`${SEARCH_BASE}${q}`, "_blank", "noopener,noreferrer");
}

function getShareId() {
  const p = new URLSearchParams(location.search);
  return p.get("id") || "";
}

function makeId() {
  // short, url-safe
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

/////////////////////////
// DATA MODEL
/////////////////////////

/**
 * State shape:
 * {
 *   meta: { customizedCategories?: ... },
 *   values: {
 *     [itemKey]: { [colKey]: "fav"|"like"|"int"|"no"|"" }
 *   }
 * }
 */

function blankStateFromData(data) {
  const s = { meta: {}, values: {} };

  for (const cat of data) {
    for (const sec of cat.sections) {
      for (const itemLabel of sec.items) {
        const itemKey = makeItemKey(cat.id, sec.title, itemLabel);
        s.values[itemKey] = {};
        for (const col of sec.columns) {
          s.values[itemKey][col] = "";
        }
      }
    }
  }
  return s;
}

function makeItemKey(catId, secTitle, itemLabel) {
  // stable-ish key
  return `${catId}__${secTitle}__${itemLabel}`.replace(/\s+/g, " ").trim();
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocal(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

/////////////////////////
// RENDER
/////////////////////////

const OPTIONS = [
  { key: "fav", cls: "fav", label: "Favorite" },
  { key: "like", cls: "like", label: "Like" },
  { key: "int", cls: "int", label: "Interested" },
  { key: "no", cls: "no", label: "No" },
  { key: "", cls: "empty", label: "Unset" }
];

function makeItemLabelNode(labelText) {
  const wrap = document.createElement("div");
  wrap.className = "itemLabelWrap";

  const label = document.createElement("span");
  label.className = "itemLabel";
  label.textContent = labelText;

  const help = document.createElement("button");
  help.className = "helpBtn";
  help.type = "button";
  help.textContent = "?";
  help.title = `Search: ${labelText}`;
  help.onclick = () => openSearch(labelText);

  wrap.appendChild(label);
  wrap.appendChild(help);
  return wrap;
}

function makePills(currentValue, onSet) {
  const wrap = document.createElement("div");
  wrap.className = "pills";

  for (const opt of OPTIONS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `pill ${opt.cls} ${currentValue === opt.key ? "selected" : ""}`;
    b.title = opt.label;
    b.onclick = () => onSet(opt.key);
    wrap.appendChild(b);
  }
  return wrap;
}

function render(state, data) {
  const root = el("sheet");
  root.innerHTML = "";

  for (const cat of data) {
    const card = document.createElement("section");
    card.className = "card";

    // Header
    const header = document.createElement("div");
    header.className = "cardHeader";

    const left = document.createElement("div");
    left.className = "cardHeaderLeft";

    const h2 = document.createElement("h2");
    h2.textContent = cat.title;

    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = cat.description || "";

    left.appendChild(h2);
    if (cat.description) left.appendChild(desc);

    const helpBtn = document.createElement("button");
    helpBtn.className = "helpBtn";
    helpBtn.type = "button";
    helpBtn.textContent = "?";
    helpBtn.title = `Search: ${cat.title}`;
    helpBtn.onclick = () => openSearch(cat.title);

    header.appendChild(left);
    header.appendChild(helpBtn);

    card.appendChild(header);

    // Sections
    for (const sec of cat.sections) {
      const secTitle = document.createElement("div");
      secTitle.className = "sectionTitle";
      secTitle.textContent = sec.title;
      card.appendChild(secTitle);

      const table = document.createElement("table");
      table.className = "table";

      // header row
      const thead = document.createElement("thead");
      const trh = document.createElement("tr");

      const thItem = document.createElement("th");
      thItem.textContent = "";
      trh.appendChild(thItem);

      for (const col of sec.columns) {
        const th = document.createElement("th");
        th.textContent = col;
        trh.appendChild(th);
      }

      thead.appendChild(trh);
      table.appendChild(thead);

      // body rows
      const tbody = document.createElement("tbody");

      for (const itemLabel of sec.items) {
        const tr = document.createElement("tr");

        const itemKey = makeItemKey(cat.id, sec.title, itemLabel);

        const tdLabel = document.createElement("td");
        tdLabel.appendChild(makeItemLabelNode(itemLabel));
        tr.appendChild(tdLabel);

        for (const col of sec.columns) {
          const td = document.createElement("td");
          td.style.whiteSpace = "nowrap";

          const v = (state.values[itemKey] && state.values[itemKey][col]) || "";

          td.appendChild(
            makePills(v, (newVal) => {
              if (!state.values[itemKey]) state.values[itemKey] = {};
              state.values[itemKey][col] = newVal;
              saveLocal(state);
              render(state, data);
            })
          );

          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      }

      table.appendChild(tbody);
      card.appendChild(table);
    }

    root.appendChild(card);
  }
}

/////////////////////////
// SUPABASE SAVE/LOAD
/////////////////////////

async function saveSheet(id, payload) {
  // table: public.sheets
  // columns: id (text pk), data (jsonb), created_at (timestamp default now)
  const { error } = await db.from("sheets").insert({ id, data: payload });
  if (error) throw error;
}

async function loadSheet(id) {
  const { data, error } = await db.from("sheets").select("data").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

/////////////////////////
// EXPORTS
/////////////////////////

async function exportPng() {
  setStatus("Exporting PNG…");
  const target = el("sheet");
  try {
    const canvas = await html2canvas(target, { backgroundColor: "#ffffff", scale: 2 });
    const a = document.createElement("a");
    a.download = "my-sheet.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    setStatus("PNG exported.");
  } catch (e) {
    console.error(e);
    setStatus("PNG export failed.");
  }
}

function exportPdf() {
  setStatus("Opening print dialog…");
  // Use browser print => user can "Save as PDF"
  window.print();
}

/////////////////////////
// MAIN
/////////////////////////

async function main() {
  const data = window.SHEET_DATA;
  if (!Array.isArray(data) || data.length === 0) {
    setStatus("No sheet data found. Check sheetData.js.");
    return;
  }

  const shareId = getShareId();

  // Shared view
  if (shareId) {
    setStatus("Loading shared sheet…");
    try {
      const payload = await loadSheet(shareId);
      if (!payload) {
        setStatus("Shared link not found.");
        return;
      }
      // shared view read-only
      el("getLink").disabled = true;
      el("customize").disabled = true;
      el("clearLocal").disabled = true;
      el("shareUrl").value = location.href;
      const state = payload;
      render(state, data);
      setStatus("Shared sheet loaded (read-only).");
    } catch (e) {
      console.error(e);
      setStatus("Failed to load shared sheet.");
    }
    return;
  }

  // Local editable view
  let state = loadLocal();
  if (!state) state = blankStateFromData(data);

  render(state, data);
  setStatus("Ready.");

  el("exportPng").onclick = exportPng;
  el("exportPdf").onclick = exportPdf;

  el("clearLocal").onclick = () => {
    localStorage.removeItem(LOCAL_KEY);
    state = blankStateFromData(data);
    render(state, data);
    setStatus("Local draft cleared.");
  };

  el("getLink").onclick = async () => {
    setStatus("Saving…");
    el("getLink").disabled = true;

    try {
      const id = makeId();
      await saveSheet(id, deepClone(state));
      const url = `${location.origin}${location.pathname}?id=${id}`;
      el("shareUrl").value = url;
      el("shareUrl").select();
      setStatus("Saved. Share the link.");
    } catch (e) {
      console.error(e);
      setStatus("Save failed. Check Supabase policies and URL/key.");
    } finally {
      el("getLink").disabled = false;
    }
  };

  // Customize button (v1 placeholder)
  el("customize").onclick = () => {
    setStatus("Customize UI is not implemented yet (v1).");
  };
}

main();

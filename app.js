/********************************
 * CONFIG
 ********************************/
const SUPABASE_URL = "https://kypkibudjijdnqlfdlkz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IxMUlcAIP0yGlp-JDHxI-Q_lozJCUrG";

/**
 * Search provider: pick ONE.
 * DuckDuckGo: https://duckduckgo.com/?q=
 * Wikipedia: https://en.wikipedia.org/wiki/Special:Search?search=
 */
const SEARCH_BASE = "www.pornhub.com/video/search?search=";

/********************************
 * STORAGE KEYS
 ********************************/
const LOCAL_KEY = "mySheet.localDraft.v1";

/********************************
 * SUPABASE CLIENT
 * IMPORTANT: do NOT redeclare `supabase`.
 * The CDN exposes `window.supabase`.
 ********************************/
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/********************************
 * HELPERS
 ********************************/
const el = (id) => document.getElementById(id);

function setStatus(msg) {
  el("status").textContent = msg || "";
}

function safeJsonParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

function makeId() {
  // short-ish random id
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

function getShareIdFromUrl() {
  // supports: /?id=XXXX or /XXXX
  const u = new URL(window.location.href);
  const q = u.searchParams.get("id");
  if (q) return q;

  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length === 1) return parts[0];
  return null;
}

function openSearch(term) {
  const q = encodeURIComponent(term);
  window.open(SEARCH_BASE + q, "_blank", "noopener,noreferrer");
}

/********************************
 * DATA
 *
 * sheetData.js must define:
 *   window.SHEET_DATA = [
 *     { title, description, columns, groups:[ { title, items:[{ label, key }] } ] }
 *   ]
 *
 * columns:
 *   - if omitted => single column (General)
 *   - can be ["General"] or ["Self","Partner"] or ["Giving","Receiving"] etc
 ********************************/
const SHEET_DATA = window.SHEET_DATA || [];

/********************************
 * STATE
 *
 * We store selections as:
 * selections[itemKey][colName] = one of: "fav" | "like" | "int" | "no" | "" (unset)
 ********************************/
function loadLocal() {
  const raw = localStorage.getItem(LOCAL_KEY);
  return safeJsonParse(raw, {});
}

function saveLocal(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

let selections = loadLocal();

/********************************
 * RENDERING
 ********************************/
const VALUE_ORDER = ["fav", "like", "int", "no", ""]; // "" is unset
const VALUE_LABELS = {
  fav: "Favorite",
  like: "Like",
  int: "Interested",
  no: "No",
  "": "Unset",
};

function ensureItemState(itemKey, columns) {
  if (!selections[itemKey]) selections[itemKey] = {};
  for (const c of columns) {
    if (typeof selections[itemKey][c] !== "string") selections[itemKey][c] = "";
  }
}

function setValue(itemKey, col, value) {
  ensureItemState(itemKey, [col]);
  selections[itemKey][col] = value;
  saveLocal(selections);
}

function getValue(itemKey, col) {
  return (selections[itemKey] && selections[itemKey][col]) || "";
}

function buildDots(itemKey, col) {
  const wrap = document.createElement("div");
  wrap.className = "dots";

  for (const v of VALUE_ORDER) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dotbtn " + (v === "" ? "empty" : v);
    b.title = VALUE_LABELS[v];
    b.setAttribute("aria-label", VALUE_LABELS[v]);

    const cur = getValue(itemKey, col);
    if (cur === v) b.classList.add("active");

    b.onclick = () => {
      // toggle: clicking the active option sets it back to unset
      const current = getValue(itemKey, col);
      const next = (current === v) ? "" : v;
      setValue(itemKey, col, next);
      // rerender only this row-cell group (fastest = rerender all for now)
      renderSheet();
    };

    wrap.appendChild(b);
  }

  return wrap;
}

function renderSheet() {
  const root = el("sheet");
  root.innerHTML = "";

  for (const cat of SHEET_DATA) {
    const columns = (cat.columns && cat.columns.length) ? cat.columns : ["General"];

    // Card
    const card = document.createElement("section");
    card.className = "card";

    // Header
    const head = document.createElement("div");
    head.className = "cardHead";

    const h2 = document.createElement("h2");
    h2.textContent = cat.title || "Untitled";

    const desc = document.createElement("div");
    desc.className = "cardDesc";
    desc.textContent = cat.description || "";

    head.appendChild(h2);
    head.appendChild(desc);

    card.appendChild(head);

    // Table
    const table = document.createElement("div");
    table.className = "table";

    // Column header row (if more than 1 column)
    const headerRow = document.createElement("div");
    headerRow.className = "row headerRow";

    const left = document.createElement("div");
    left.className = "cell labelCell headerLabel";
    left.textContent = columns.length === 1 ? "General" : "";
    headerRow.appendChild(left);

    const right = document.createElement("div");
    right.className = "cell valueCell headerCols";

    if (columns.length > 1) {
      for (const c of columns) {
        const hc = document.createElement("div");
        hc.className = "colHeader";
        hc.textContent = c;
        right.appendChild(hc);
      }
    } else {
      // single column header
      const hc = document.createElement("div");
      hc.className = "colHeader";
      hc.textContent = columns[0];
      right.appendChild(hc);
    }

    headerRow.appendChild(right);
    table.appendChild(headerRow);

    // Groups + items
    for (const g of (cat.groups || [])) {
      // group title row
      const gr = document.createElement("div");
      gr.className = "row groupRow";

      const gl = document.createElement("div");
      gl.className = "cell labelCell groupTitle";
      gl.textContent = g.title || "";

      const gv = document.createElement("div");
      gv.className = "cell valueCell";

      gr.appendChild(gl);
      gr.appendChild(gv);
      table.appendChild(gr);

      for (const item of (g.items || [])) {
        const itemKey = item.key || item.label;
        ensureItemState(itemKey, columns);

        const r = document.createElement("div");
        r.className = "row itemRow";

        const l = document.createElement("div");
        l.className = "cell labelCell itemLabel";

        // label + per-item ?
        const labelSpan = document.createElement("span");
        labelSpan.className = "labelText";
        labelSpan.textContent = item.label;

        const helpBtn = document.createElement("button");
        helpBtn.type = "button";
        helpBtn.className = "helpBtn";
        helpBtn.title = "Search this term";
        helpBtn.textContent = "?";
        helpBtn.onclick = () => openSearch(item.label);

        l.appendChild(labelSpan);
        l.appendChild(helpBtn);

        const vcell = document.createElement("div");
        vcell.className = "cell valueCell";

        // columns of dots
        for (const c of columns) {
          const colWrap = document.createElement("div");
          colWrap.className = "col";
          colWrap.appendChild(buildDots(itemKey, c));
          vcell.appendChild(colWrap);
        }

        r.appendChild(l);
        r.appendChild(vcell);

        table.appendChild(r);
      }
    }

    card.appendChild(table);
    root.appendChild(card);
  }
}

/********************************
 * SUPABASE SAVE/LOAD
 *
 * Table: public.sheets
 * columns:
 *   id text primary key
 *   data jsonb not null
 *   created_at timestamp default now()
 ********************************/
async function saveSheet(id, dataObj) {
  // upsert: insert or update
  const payload = { id, data: dataObj };
  const { error } = await sb.from("sheets").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

async function loadSheet(id) {
  const { data, error } = await sb.from("sheets").select("data").eq("id", id).single();
  if (error) throw error;
  return data?.data || {};
}

/********************************
 * EXPORTS (these MUST reflect current UI state)
 ********************************/
async function exportPng() {
  setStatus("Rendering PNG...");
  const sheetEl = el("sheet");

  // Force a render so DOM matches current selections
  renderSheet();

  try {
    const canvas = await window.html2canvas(sheetEl, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-sheet.png";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setStatus("PNG downloaded.");
  } catch (e) {
    console.error(e);
    setStatus("PNG export failed. Check console.");
  }
}

function exportPdf() {
  setStatus("Opening print dialog...");
  // Ensure UI is current
  renderSheet();
  window.print();
}

/********************************
 * CUSTOMIZE (placeholder for now)
 ********************************/
function openCustomize() {
  alert("Customize UI is not implemented yet. Next step: edit sheetData.js or build an editor.");
}

/********************************
 * MAIN
 ********************************/
async function main() {
  // Wire buttons
  el("customizeBtn").onclick = openCustomize;
  el("exportPng").onclick = exportPng;
  el("exportPdf").onclick = exportPdf;

  el("clearLocal").onclick = () => {
    localStorage.removeItem(LOCAL_KEY);
    selections = {};
    el("shareUrl").value = "";
    setStatus("Local draft cleared.");
    renderSheet();
  };

  el("getLink").onclick = async () => {
    setStatus("Saving...");
    el("getLink").disabled = true;

    try {
      const id = makeId();
      await saveSheet(id, selections);

      const url = `${location.origin}/${id}`;
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

  // Shared view?
  const shareId = getShareIdFromUrl();
  if (shareId) {
    setStatus("Loading shared sheet...");
    try {
      selections = await loadSheet(shareId);
      saveLocal(selections); // optional: cache it locally
      setStatus("Loaded shared sheet.");
    } catch (e) {
      console.error(e);
      setStatus("Load failed: " + (e?.message || "Unknown error"));
    }
  } else {
    setStatus("");
  }

  renderSheet();
}

main();

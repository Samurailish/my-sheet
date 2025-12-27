/* global window, html2canvas, jspdf */

/***********************
 * CONFIG
 ***********************/
const SUPABASE_URL = "https://kypkibudjijdnqlfdlkz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IxMUlcAIP0yGlp-JDHxI-Q_lozJCUrG";

// Search provider base (not Google)
const SEARCH_BASE = "www.pornhub.com/video/search?search=";

// Storage keys
const LOCAL_KEY = "mySheet.localDraft.v1";

// Ratings in order
const RATINGS = [
  { key: "fav", css: "fav", label: "Favorite" },
  { key: "like", css: "like", label: "Like" },
  { key: "int", css: "int", label: "Interested" },
  { key: "no", css: "no", label: "No" },
  { key: "unset", css: "empty", label: "Unset" }
];

/***********************
 * SUPABASE CLIENT
 ***********************/
function getSupabaseClient() {
  if (!window.supabase) return null;
  // Use a unique name so we never “redeclare supabase”
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/***********************
 * HELPERS
 ***********************/
const el = (id) => document.getElementById(id);

function setStatus(msg) {
  el("status").textContent = msg || "";
}

function openSearch(query) {
  const q = encodeURIComponent(query);
  window.open(`${SEARCH_BASE}${q}`, "_blank", "noopener,noreferrer");
}

function safeId(str) {
  return String(str)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function getShareIdFromUrl() {
  const u = new URL(window.location.href);
  return u.searchParams.get("id");
}

function makeId() {
  // short-ish id, URL safe
  const a = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

/***********************
 * DATA MODEL
 ***********************/
function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function saveLocal(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

function clearLocal() {
  localStorage.removeItem(LOCAL_KEY);
}

/***********************
 * RENDER
 ***********************/
function renderSheet(sections, state) {
  const root = el("sheet");
  root.innerHTML = "";

  for (const section of sections) {
    const card = document.createElement("section");
    card.className = "card";

    // Header
    const head = document.createElement("div");
    head.className = "cardHead";

    const left = document.createElement("div");

    const h = document.createElement("h2");
    h.className = "cardTitle";
    h.textContent = section.title || section.id;

    const d = document.createElement("p");
    d.className = "cardDesc";
    d.textContent = section.desc || "";

    left.appendChild(h);
    left.appendChild(d);

    const help = document.createElement("button");
    help.className = "helpBtn";
    help.type = "button";
    help.title = "Search this category";
    help.textContent = "?";
    help.onclick = () => openSearch(`${section.title} kink list`);

    head.appendChild(left);
    head.appendChild(help);
    card.appendChild(head);

    // Groups
    for (const group of section.groups || []) {
      const wrap = document.createElement("div");
      wrap.className = "group";

      const gt = document.createElement("div");
      gt.className = "groupTitle";
      gt.textContent = group.title || "";
      wrap.appendChild(gt);

      const table = document.createElement("table");
      table.className = "table";

      const thead = document.createElement("thead");
      const hr = document.createElement("tr");

      const th0 = document.createElement("th");
      th0.textContent = "";
      hr.appendChild(th0);

      const cols = group.columns && group.columns.length ? group.columns : [{ key: "general", label: "" }];
      for (const c of cols) {
        const th = document.createElement("th");
        th.className = "colHead";
        th.textContent = c.label || "";
        hr.appendChild(th);
      }

      thead.appendChild(hr);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");

      for (const item of group.items || []) {
        const label = typeof item === "string" ? item : item.label;
        const query = typeof item === "string" ? label : (item.q || label);

        const itemId = `${safeId(section.id)}__${safeId(group.id || group.title || "g")}__${safeId(label)}`;

        const tr = document.createElement("tr");

        const tdLabel = document.createElement("td");
        const labWrap = document.createElement("div");
        labWrap.className = "itemLabel";

        const span = document.createElement("span");
        span.textContent = label;

        const helpBtn = document.createElement("button");
        helpBtn.className = "itemHelpInline";
        helpBtn.type = "button";
        helpBtn.title = "Search this item";
        helpBtn.textContent = "?";
        helpBtn.onclick = () => openSearch(query);

        labWrap.appendChild(span);
        labWrap.appendChild(helpBtn);
        tdLabel.appendChild(labWrap);

        tr.appendChild(tdLabel);

        for (const c of cols) {
          const td = document.createElement("td");
          const dots = document.createElement("div");
          dots.className = "dots";

          const current = state[itemId]?.[c.key] ?? "unset";

          for (const r of RATINGS) {
            const b = document.createElement("button");
            b.type = "button";
            b.className = `dotPick ${r.css}` + (current === r.key ? " active" : "");
            b.title = r.label;

            b.onclick = () => {
              if (!state[itemId]) state[itemId] = {};
              state[itemId][c.key] = r.key;
              saveLocal(state);
              renderSheet(window.SHEET_DATA, state);
            };

            dots.appendChild(b);
          }

          td.appendChild(dots);
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      }

      table.appendChild(tbody);
      wrap.appendChild(table);
      card.appendChild(wrap);
    }

    root.appendChild(card);
  }
}

/***********************
 * EXPORTS
 ***********************/
async function exportPng() {
  setStatus("Exporting PNG...");
  const target = el("sheet");

  const canvas = await html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0
  });

  const a = document.createElement("a");
  a.download = "my-sheet.png";
  a.href = canvas.toDataURL("image/png");
  a.click();

  setStatus("PNG exported.");
}

async function exportPdf() {
  setStatus("Exporting PDF...");
  const target = el("sheet");

  const canvas = await html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);

  const { jsPDF } = jspdf;
  const pdf = new jsPDF("p", "pt", "a4");

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Fit width to page
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  // If it fits, single page
  if (imgH <= pageH) {
    pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
    pdf.save("my-sheet.pdf");
    setStatus("PDF exported.");
    return;
  }

  // Multi-page: slice by page height
  let y = 0;
  let remaining = imgH;

  while (remaining > 0) {
    pdf.addImage(imgData, "JPEG", 0, -y, imgW, imgH);
    remaining -= pageH;
    y += pageH;

    if (remaining > 0) pdf.addPage();
  }

  pdf.save("my-sheet.pdf");
  setStatus("PDF exported.");
}

/***********************
 * SUPABASE SAVE/LOAD
 ***********************/
async function loadShared(id) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase library not loaded.");
  const { data, error } = await sb.from("sheets").select("data").eq("id", id).single();
  if (error) throw error;
  return data?.data || {};
}

async function saveShared(id, payload) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase library not loaded.");
  const { error } = await sb.from("sheets").upsert([{ id, data: payload }], { onConflict: "id" });
  if (error) throw error;
}

/***********************
 * MAIN
 ***********************/
async function main() {
  const state = loadLocal();
  renderSheet(window.SHEET_DATA, state);

  // wire buttons
  el("exportPng").onclick = exportPng;
  el("exportPdf").onclick = exportPdf;

  el("clearLocal").onclick = () => {
    clearLocal();
    el("shareUrl").value = "";
    setStatus("Local draft cleared.");
    renderSheet(window.SHEET_DATA, loadLocal());
  };

  el("customize").onclick = () => {
    setStatus("Customize UI is not in v1 yet. Edit sheetData.js to add/remove items.");
  };

  // shared view
  const shareId = getShareIdFromUrl();
  if (shareId) {
    try {
      setStatus("Loading shared sheet...");
      const shared = await loadShared(shareId);

      // overwrite local state for viewing
      saveLocal(shared);
      el("shareUrl").value = window.location.href;
      setStatus("Loaded shared sheet.");
      renderSheet(window.SHEET_DATA, loadLocal());
    } catch (e) {
      console.error(e);
      setStatus("Failed to load shared sheet: " + (e?.message || "Unknown error"));
    }
  }

  // get link => save then show url
  el("getLink").onclick = async () => {
    el("getLink").disabled = true;
    setStatus("Saving...");
    try {
      const id = makeId();
      const payload = loadLocal();
      await saveShared(id, payload);
      const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
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

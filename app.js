/***********************
 * CONFIG
 ***********************/
const SUPABASE_URL = "https://kypkibudjijdnqlfdlkz.supabase.co";
const SUPABASE_ANON_KEY = sb_publishable_IxMUlcAIP0yGlp-JDHxI-Q_lozJCUrG";

/*
  Search provider base URL. Must end with the query param part.
  Example:
    DuckDuckGo: "https://duckduckgo.com/?q="
    Wikipedia: "https://en.wikipedia.org/w/index.php?search="
    Kinkly: "https://www.kinkly.com/search?q="
*/
const SEARCH_BASE = "www.pornhub.com/video/search?search=";

/***********************
 * STORAGE KEYS
 ***********************/
const LOCAL_KEY = "mySheet.localDraft.v2";

/***********************
 * SUPABASE
 * (CDN exposes global window.supabase)
 ***********************/
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/***********************
 * HELPERS
 ***********************/
const el = (id) => document.getElementById(id);

function setStatus(msg) {
  el("status").textContent = msg || "";
}

function safeJsonParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

function loadLocal() {
  return safeJsonParse(localStorage.getItem(LOCAL_KEY), {});
}

function saveLocal(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

function makeId(len = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[(Math.random() * chars.length) | 0];
  return out;
}

function getShareId() {
  // Support:
  // 1) https://site.com/<id>
  // 2) https://site.com/?s=<id>
  const p = location.pathname.replace(/^\/+|\/+$/g, "");
  if (p && p !== "index.html") return p;
  const s = new URLSearchParams(location.search).get("s");
  return s || "";
}

function clampToViewport(x, y, w = 360, h = 220) {
  const pad = 10;
  const maxX = window.innerWidth - w - pad;
  const maxY = window.innerHeight - h - pad;
  return {
    x: Math.max(pad, Math.min(x, maxX)),
    y: Math.max(pad, Math.min(y, maxY)),
  };
}

/***********************
 * TOOLTIP
 ***********************/
let tipState = { open: false, itemName: "", desc: "" };

function openTip(anchorEl, itemName, desc) {
  tipState = { open: true, itemName, desc };
  const tip = el("tip");
  el("tipTitle").textContent = itemName;
  el("tipBody").textContent = desc;

  const r = anchorEl.getBoundingClientRect();
  const target = clampToViewport(r.left, r.bottom + 8);
  tip.style.left = `${target.x}px`;
  tip.style.top = `${target.y}px`;

  tip.classList.remove("hidden");
  tip.setAttribute("aria-hidden", "false");
}

function closeTip() {
  tipState = { open: false, itemName: "", desc: "" };
  const tip = el("tip");
  tip.classList.add("hidden");
  tip.setAttribute("aria-hidden", "true");
}

function hookTip() {
  el("tipClose").onclick = closeTip;
  el("tipSearch").onclick = () => {
    if (!tipState.open) return;
    const q = encodeURIComponent(tipState.itemName);
    window.open(`${SEARCH_BASE}${q}`, "_blank", "noopener,noreferrer");
  };

  document.addEventListener("mousedown", (e) => {
    const tip = el("tip");
    if (tip.classList.contains("hidden")) return;
    if (tip.contains(e.target)) return;
    // If clicking a qBtn, that handler will reopen; we close first anyway.
    closeTip();
  });

  window.addEventListener("resize", () => {
    if (tipState.open) closeTip();
  });
}

/***********************
 * RENDER
 ***********************/
const CHOICES = [
  { key: "fav", label: "Favorite" },
  { key: "like", label: "Like" },
  { key: "int", label: "Interested" },
  { key: "no", label: "No" },
  { key: "empty", label: "Unset" },
];

function cellKey(catId, groupId, itemId, colName) {
  return `${catId}__${groupId}__${itemId}__${colName}`;
}

function renderSheet(categories, state, readOnly) {
  const root = el("sheet");
  root.innerHTML = "";

  for (const cat of categories) {
    const card = document.createElement("section");
    card.className = "card";

    const head = document.createElement("div");
    head.className = "cardHeader";

    const title = document.createElement("h2");
    title.className = "cardTitle";
    title.textContent = cat.title;

    const sub = document.createElement("p");
    sub.className = "cardSub";
    sub.textContent = ""; // keep minimal; item tooltips carry the real explanations.

    head.appendChild(title);
    head.appendChild(sub);
    card.appendChild(head);

    for (const group of cat.groups) {
      const g = document.createElement("div");
      g.className = "group";
      g.textContent = group.header;
      card.appendChild(g);

      const table = document.createElement("table");
      table.className = "table";

      for (const item of group.items) {
        const tr = document.createElement("tr");
        tr.className = "row";

        const tdLabel = document.createElement("td");
        tdLabel.className = "cellLabel";

        const labelWrap = document.createElement("div");
        labelWrap.className = "labelText";
        labelWrap.textContent = item.name;

        const qBtn = document.createElement("button");
        qBtn.className = "qBtn";
        qBtn.type = "button";
        qBtn.textContent = "?";
        qBtn.title = "Explain";
        qBtn.onclick = (e) => {
          e.stopPropagation();
          openTip(qBtn, item.name, item.desc || "");
        };

        tdLabel.appendChild(labelWrap);
        tdLabel.appendChild(qBtn);

        const tdDots = document.createElement("td");
        tdDots.className = "cellDots";

        const dotsWrap = document.createElement("div");
        dotsWrap.className = "dots";

        // For each column in this group, render a set of 5 dots.
        for (const col of group.columns) {
          const colWrap = document.createElement("div");
          colWrap.style.display = "inline-flex";
          colWrap.style.alignItems = "center";
          colWrap.style.gap = "8px";

          if (group.columns.length > 1) {
            const tag = document.createElement("span");
            tag.style.fontSize = "11px";
            tag.style.color = "#111827";
            tag.style.fontWeight = "800";
            tag.textContent = col;
            colWrap.appendChild(tag);
          }

          const key = cellKey(cat.id, group.id, item.id, col);
          const current = state[key] || "empty";

          for (const c of CHOICES) {
            const b = document.createElement("button");
            b.type = "button";
            b.className = `dotChoice ${c.key} ${current === c.key ? "selected" : ""}`;
            b.title = `${col}: ${c.label}`;
            b.disabled = !!readOnly;

            b.onclick = () => {
              state[key] = c.key;
              saveLocal(state);
              // Re-render only this row cheaply by re-rendering whole sheet (still fast enough for v1)
              renderSheet(window.KINK_SHEET_DATA, loadLocal(), false);
            };

            colWrap.appendChild(b);
          }

          dotsWrap.appendChild(colWrap);
        }

        tdDots.appendChild(dotsWrap);
        tr.appendChild(tdLabel);
        tr.appendChild(tdDots);
        table.appendChild(tr);
      }

      card.appendChild(table);
    }

    root.appendChild(card);
  }
}

/***********************
 * SHARE (Supabase)
 ***********************/
async function saveSheet(id, stateObj) {
  // You need a table named "sheets" with columns:
  // id (text, primary key)
  // data (jsonb)
  // created_at (timestamp default now)
  const { error } = await sb.from("sheets").upsert({ id, data: stateObj });
  if (error) throw error;
}

async function loadSheet(id) {
  const { data, error } = await sb.from("sheets").select("data").eq("id", id).single();
  if (error) throw error;
  return data?.data || {};
}

/***********************
 * EXPORT PDF
 ***********************/
function exportPdf() {
  // Print current DOM => reflects your real selections.
  window.print();
}

/***********************
 * MAIN
 ***********************/
async function main() {
  hookTip();

  el("exportPdf").onclick = exportPdf;

  el("clearLocal").onclick = () => {
    localStorage.removeItem(LOCAL_KEY);
    setStatus("Local draft cleared.");
    renderSheet(window.KINK_SHEET_DATA, loadLocal(), false);
  };

  el("customize").onclick = () => {
    alert("Customize UI is v2. For now, edit sheetData.js RAW_TEXT.");
  };

  const shareId = getShareId();

  // Shared view
  if (shareId) {
    setStatus("Loading shared sheet...");
    try {
      const shared = await loadSheet(shareId);
      renderSheet(window.KINK_SHEET_DATA, shared, true);
      setStatus("Viewing shared sheet (read-only).");
      // hide actions that shouldn't be used in shared mode
      el("getLink").disabled = true;
      el("clearLocal").disabled = true;
      el("shareUrl").value = location.href;
    } catch (e) {
      console.error(e);
      setStatus("Failed to load shared sheet.");
    }
    return;
  }

  // Local editable view
  renderSheet(window.KINK_SHEET_DATA, loadLocal(), false);

  el("getLink").onclick = async () => {
    setStatus("Saving...");
    el("getLink").disabled = true;

    try {
      const id = makeId(10);
      const state = loadLocal();
      await saveSheet(id, state);

      const url = `${location.origin}/${id}`;
      el("shareUrl").value = url;
      el("shareUrl").select();
      setStatus("Saved. Share the link.");
    } catch (e) {
      console.error(e);
      setStatus("Save failed. Check Supabase RLS policies / table name.");
    } finally {
      el("getLink").disabled = false;
    }
  };
}

main();

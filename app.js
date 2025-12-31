/*********************
 * CONFIG
 *********************/
const SUPABASE_URL = "https://kypkibudjijdnqlfdlkz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IxMUlcAIP0yGlp-JDHxI-Q_lozJCUrG";

/** Search base (your request) */
const SEARCH_BASE = "https://www.pornhub.com/video/search?search=";

/*********************
 * STORAGE KEYS
 *********************/
const LOCAL_KEY = "mySheet.localDraft.v1";
const CUSTOM_KEY = "mySheet.customize.v1";

/*********************
 * CHOICES
 *********************/
const CHOICES = [
  { id: "favorite", label: "Favorite" },
  { id: "like", label: "Like" },
  { id: "interested", label: "Interested" },
  { id: "no", label: "No" },
  { id: "unset", label: "Unset" }
];

/*********************
 * SUPABASE
 *********************/
const supabase = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY);

/*********************
 * HELPERS
 *********************/
const el = (id) => document.getElementById(id);

function setStatus(msg) {
  el("status").textContent = msg || "";
}

function makeId(len = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function getShareId() {
  const u = new URL(location.href);
  return u.searchParams.get("s");
}

function safeJsonParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function loadLocal() {
  return safeJsonParse(localStorage.getItem(LOCAL_KEY) || "{}", {});
}

function saveLocal(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data || {}));
}

/*********************
 * CUSTOMIZE (hide categories)
 *********************/
function loadCustomize() {
  return safeJsonParse(localStorage.getItem(CUSTOM_KEY) || "{}", { hidden: {} });
}
function saveCustomize(cfg) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(cfg || { hidden: {} }));
}

/*********************
 * POPOVER
 *********************/
let openPopover = null;

function closePopover() {
  if (openPopover) {
    openPopover.remove();
    openPopover = null;
  }
}

function openHelpPopover(anchorBtn, title, text) {
  closePopover();

  const pop = document.createElement("div");
  pop.className = "popover";
  pop.innerHTML = `
    <div class="popoverHeader">
      <div class="popoverTitle"></div>
      <button class="popoverClose" aria-label="Close">✕</button>
    </div>
    <div class="popoverText"></div>
    <div class="popoverActions">
      <a class="searchLink" target="_blank" rel="noopener noreferrer">Search</a>
    </div>
  `;

  pop.querySelector(".popoverTitle").textContent = title || "";
  pop.querySelector(".popoverText").textContent = text || "No explanation provided.";
  pop.querySelector(".searchLink").href = SEARCH_BASE + encodeURIComponent(title || "");
  pop.querySelector(".popoverClose").onclick = closePopover;

  document.body.appendChild(pop);
  openPopover = pop;

  // position near button
  const r = anchorBtn.getBoundingClientRect();
  const pad = 8;
  const maxW = 340;

  pop.style.width = Math.min(maxW, window.innerWidth - 24) + "px";

  // after size known
  const pr = pop.getBoundingClientRect();
  let left = r.left;
  let top = r.bottom + pad;

  // keep on screen
  if (left + pr.width > window.innerWidth - 10) left = window.innerWidth - pr.width - 10;
  if (left < 10) left = 10;
  if (top + pr.height > window.innerHeight - 10) top = r.top - pr.height - pad;

  pop.style.left = `${left + window.scrollX}px`;
  pop.style.top  = `${top + window.scrollY}px`;
}

/*********************
 * RENDER
 *********************/
function normalizeData(data) {
  // Ensure structure exists
  return (data || []).map(cat => ({
    id: cat.id,
    title: cat.title,
    description: cat.description || "",
    sections: (cat.sections || []).map(sec => ({
      title: sec.title || "",
      columns: sec.columns || null, // array or null
      items: (sec.items || []).map(it => ({
        label: it.label,
        help: it.help || ""
      }))
    }))
  }));
}

function buildItemKey(catId, secTitle, itemLabel, colName) {
  return [catId, secTitle, itemLabel, colName || "single"].join("::");
}

function getSelection(store, key) {
  return store[key] ?? "unset";
}

function setSelection(store, key, choiceId) {
  store[key] = choiceId;
}

function createDot(choice, active, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `choiceDot ${choice.id}` + (active ? " active" : "");
  b.setAttribute("aria-label", choice.label);
  b.onclick = onClick;
  return b;
}

function createHelpBtn(title, helpText) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "helpBtn";
  b.textContent = "?";
  b.onclick = (e) => {
    e.stopPropagation();
    openHelpPopover(b, title, helpText);
  };
  return b;
}

function render(data, store, readOnly, customizeCfg) {
  const sheet = el("sheet");
  sheet.innerHTML = "";

  const hidden = (customizeCfg?.hidden) || {};

  data.forEach(cat => {
    if (hidden[cat.id]) return;

    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "cardHeader";

    const left = document.createElement("div");
    const title = document.createElement("div");
    title.className = "cardTitle";
    title.textContent = cat.title;

    const desc = document.createElement("div");
    desc.className = "cardDesc";
    desc.textContent = cat.description || "";
    if (!cat.description) desc.style.display = "none";

    left.appendChild(title);
    left.appendChild(desc);

    const helpWrap = document.createElement("div");
    helpWrap.className = "cardHelpRow";
    // category help: show description + search
    helpWrap.appendChild(createHelpBtn(cat.title, cat.description || "No category description."));

    header.appendChild(left);
    header.appendChild(helpWrap);

    card.appendChild(header);

    cat.sections.forEach(sec => {
      const section = document.createElement("div");
      section.className = "section";

      const secTop = document.createElement("div");
      secTop.className = "sectionTitleRow";

      const secTitle = document.createElement("div");
      secTitle.className = "sectionTitle";
      secTitle.textContent = sec.title || "";

      secTop.appendChild(secTitle);

      // Column headers if 2 columns
      if (Array.isArray(sec.columns) && sec.columns.length >= 2) {
        const colHeaders = document.createElement("div");
        colHeaders.className = "colHeaders";
        sec.columns.forEach(c => {
          const s = document.createElement("span");
          s.textContent = c;
          colHeaders.appendChild(s);
        });
        secTop.appendChild(colHeaders);
      }

      section.appendChild(secTop);

      sec.items.forEach(item => {
        const row = document.createElement("div");
        row.className = "row";

        const rowLeft = document.createElement("div");
        rowLeft.className = "rowLeft";

        // item help button (bubble)
        rowLeft.appendChild(createHelpBtn(item.label, item.help || "No explanation provided."));

        const label = document.createElement("div");
        label.className = "rowLabel";
        label.textContent = item.label;

        rowLeft.appendChild(label);

        const cells = document.createElement("div");
        cells.className = "cells";

        const makeGroup = (colName) => {
          const g = document.createElement("div");
          g.className = "dotGroup";

          const key = buildItemKey(cat.id, sec.title, item.label, colName);
          const cur = getSelection(store, key);

          CHOICES.forEach(choice => {
            const active = (choice.id === cur);
            const dot = createDot(choice, active, () => {
              if (readOnly) return;
              setSelection(store, key, choice.id);
              saveLocal(store);
              render(data, store, readOnly, customizeCfg);
            });
            g.appendChild(dot);
          });

          return g;
        };

        if (Array.isArray(sec.columns) && sec.columns.length >= 2) {
          sec.columns.forEach(col => cells.appendChild(makeGroup(col)));
        } else {
          cells.appendChild(makeGroup(null));
        }

        row.appendChild(rowLeft);
        row.appendChild(cells);
        section.appendChild(row);
      });

      card.appendChild(section);
    });

    sheet.appendChild(card);
  });
}

/*********************
 * CUSTOMIZE MODAL UI
 *********************/
function openCustomizeModal(data, cfg) {
  const body = el("customizeBody");
  body.innerHTML = "";

  data.forEach(cat => {
    const wrap = document.createElement("div");
    wrap.className = "catToggle";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = `cat_${cat.id}`;
    cb.checked = !cfg.hidden[cat.id];

    const lab = document.createElement("label");
    lab.setAttribute("for", cb.id);
    lab.innerHTML = `${cat.title}<small>${cat.description || ""}</small>`;

    wrap.appendChild(cb);
    wrap.appendChild(lab);
    body.appendChild(wrap);
  });

  el("modalBackdrop").classList.remove("hidden");
  el("customizeModal").classList.remove("hidden");
}

function closeCustomizeModal() {
  el("modalBackdrop").classList.add("hidden");
  el("customizeModal").classList.add("hidden");
}

/*********************
 * SHARE (Supabase)
 *********************/
async function saveSheet(id, data) {
  if (!supabase) throw new Error("Supabase not initialized. Check URL/key.");
  const payload = { id, data, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("sheets").upsert(payload);
  if (error) throw error;
}

async function loadSheet(id) {
  if (!supabase) throw new Error("Supabase not initialized. Check URL/key.");
  const { data, error } = await supabase.from("sheets").select("data").eq("id", id).single();
  if (error) throw error;
  return data?.data || {};
}

/*********************
 * MAIN
 *********************/
async function main() {
  const data = normalizeData(window.SHEET_DATA || []);
  if (!data.length) {
    setStatus("No data loaded. Check sheetData.js RAW text.");
    return;
  }

  // close popover when clicking elsewhere
  document.addEventListener("click", () => closePopover());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePopover(); });

  const shareId = getShareId();
  const customizeCfg = loadCustomize();

  let store = loadLocal();
  let readOnly = false;

  if (shareId) {
    readOnly = true;
    setStatus("Loading shared sheet…");
    try {
      store = await loadSheet(shareId);
      setStatus("Shared view (read-only).");
    } catch (e) {
      console.error(e);
      setStatus("Failed to load shared sheet.");
      return;
    }
    el("getLink").style.display = "none";
    el("clearLocal").style.display = "none";
    el("customizeBtn").style.display = "none";
  } else {
    setStatus(`Loaded ${data.length} categories.`);
  }

  // Render
  render(data, store, readOnly, customizeCfg);

  // Export PDF
  el("exportPdf").onclick = () => {
    closePopover();
    window.print();
  };

  // Clear local
  el("clearLocal").onclick = () => {
    if (readOnly) return;
    localStorage.removeItem(LOCAL_KEY);
    store = {};
    setStatus("Local draft cleared.");
    render(data, store, readOnly, loadCustomize());
  };

  // Get link
  el("getLink").onclick = async () => {
    closePopover();
    if (readOnly) return;

    try {
      setStatus("Saving…");
      el("getLink").disabled = true;

      const id = makeId(10);
      await saveSheet(id, loadLocal());

      const url = `${location.origin}${location.pathname}?s=${id}`;
      el("shareUrl").value = url;
      el("shareUrl").select();
      setStatus("Saved. Share the link.");
    } catch (e) {
      console

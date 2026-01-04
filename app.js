/* global window, document */

(() => {
  // =========================
  // CONFIG (your Supabase)
  // =========================
  const SUPABASE_URL = "https://kypkibudjijdnqlfdlkz.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_IxMUlcAIP0yGlp-JDHxI-Q_lozJCUrG";
  const TABLE_NAME = "sheets";

  const LOCAL_KEY = "mySheet.localDraft.v3";

  const SEARCH_BASE = window.SHEET_CONFIG.searchBase;
  const DATA_URL = window.SHEET_CONFIG.dataUrl;

  const sb = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY);
  if (!sb) {
    console.warn("Supabase client not available. Check the CDN script or config.");
  }

  // =========================
  // DOM HELPERS
  // =========================
  const el = (id) => document.getElementById(id);

  function setStatus(msg) {
    el("status").textContent = msg || "";
  }

  function qs(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  function makeId(len = 10) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function encodeTerm(term) {
    return encodeURIComponent(term.trim());
  }

  function keyFor(catTitle, sectionTitle, colName, itemName) {
    return [
      catTitle || "",
      sectionTitle || "",
      colName || "",
      itemName || ""
    ].join("||");
  }

  // =========================
  // STATE
  // =========================
  let SHEET = [];
  let selections = {}; 
  let sharedId = null;
  let tooltipEl = null;

  const RATINGS = [
    { id: "fav", className: "fav", label: "Favorite" },
    { id: "like", className: "like", label: "Like" },
    { id: "int", className: "int", label: "Interested" },
    { id: "no", className: "no", label: "No" },
    { id: "empty", className: "empty", label: "Unset" }
  ];

  // =========================
  // TOOLTIP
  // =========================
  function closeTooltip() {
    if (tooltipEl) {
      tooltipEl.remove();
      tooltipEl = null;
    }
  }

  function openTooltip({ title, body, x, y, searchTerm }) {
    closeTooltip();

    const t = document.createElement("div");
    t.className = "tooltip";
    t.style.left = `${Math.min(x, window.innerWidth - 300)}px`;
    t.style.top = `${Math.min(y, window.innerHeight - 150)}px`;

    t.innerHTML = `
      <p class="tooltipTitle"></p>
      <p class="tooltipBody"></p>
      <div class="tooltipActions">
        <button class="tooltipActionBtn" title="Search (opens new tab)">?</button>
        <button class="tooltipClose" title="Close">Close</button>
      </div>
    `;

    t.querySelector(".tooltipTitle").textContent = title || "";
    t.querySelector(".tooltipBody").textContent = body || "No description provided.";

    t.querySelector(".tooltipActionBtn").addEventListener("click", () => {
      const url = SEARCH_BASE + encodeTerm(searchTerm || title || "");
      window.open(url, "_blank", "noopener,noreferrer");
    });

    t.querySelector(".tooltipClose").addEventListener("click", closeTooltip);

    document.body.appendChild(t);
    tooltipEl = t;
  }

  document.addEventListener("click", (e) => {
    if (!tooltipEl) return;
    if (tooltipEl.contains(e.target)) return;
    if (e.target?.classList?.contains("infoBtn")) return;
    if (e.target?.classList?.contains("catHelpBtn")) return;
    closeTooltip();
  });

  // =========================
  // STORAGE
  // =========================
  function loadLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") selections = obj;
    } catch (_) {}
  }

  let saveTimer = null;
  function saveLocalDebounced() {
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(selections)); } catch (_) {}
    }, 120);
  }

  // =========================
  // RENDER
  // =========================
  function render() {
    const root = el("sheet");
    root.innerHTML = "";

    if (!SHEET.length) {
      const d = document.createElement("div");
      d.className = "card";
      d.innerHTML = `<div class="section">No data loaded. Check that <b>INTIMACY.txt</b> exists.</div>`;
      root.appendChild(d);
      return;
    }

    for (const cat of SHEET) {
      const card = document.createElement("div");
      card.className = "card";

      const head = document.createElement("div");
      head.className = "cardHead";

      const left = document.createElement("div");
      left.className = "cardHeadLeft";
      left.innerHTML = `
        <h2 class="cardTitle"></h2>
        <p class="cardDesc"></p>
      `;
      left.querySelector(".cardTitle").textContent = cat.title;
      left.querySelector(".cardDesc").textContent = cat.description || "";

      const help = document.createElement("button");
      help.className = "catHelpBtn";
      help.textContent = "?";
      help.title = "Category info";
      help.addEventListener("click", () => {
        const r = help.getBoundingClientRect();
        openTooltip({
          title: cat.title,
          body: cat.description || "No category description provided.",
          x: r.right + 10,
          y: r.top,
          searchTerm: cat.title
        });
      });

      head.appendChild(left);
      head.appendChild(help);
      card.appendChild(head);

      for (const section of cat.sections) {
        const sec = document.createElement("div");
        sec.className = "section";

        const titleRow = document.createElement("div");
        titleRow.className = "sectionTitleRow";
        titleRow.innerHTML = `<div class="sectionTitle"></div>`;
        titleRow.querySelector(".sectionTitle").textContent = section.title || "General";
        sec.appendChild(titleRow);

        const cols = section.columns || ["General"];
        const table = document.createElement("div");
        table.className = "table";
        table.style.setProperty("--cols", String(cols.length));

        if (cols.length > 1) {
          const labels = document.createElement("div");
          labels.className = "colLabelRow";
          labels.style.setProperty("--cols", String(cols.length));

          const spacer = document.createElement("div");
          labels.appendChild(spacer);

          for (const c of cols) {
            const cl = document.createElement("div");
            cl.className = "colLabel";
            cl.textContent = c;
            labels.appendChild(cl);
          }
          sec.appendChild(labels);
        }

        for (const item of (section.items || [])) {
          const row = document.createElement("div");
          row.className = "row" + (cols.length > 1 ? " multi" : "");
          row.style.setProperty("--cols", String(cols.length));

          const leftCell = document.createElement("div");
          leftCell.className = "itemLeft";

          const name = document.createElement("div");
          name.className = "itemName";
          name.textContent = item.name;

          const info = document.createElement("button");
          info.className = "infoBtn";
          info.textContent = "?";
          info.title = "Show description";
          info.addEventListener("click", (e) => {
            const r = info.getBoundingClientRect();
            openTooltip({
              title: item.name,
              body: item.desc || "No description provided.",
              x: r.right + 10,
              y: r.top,
              searchTerm: item.name
            });
          });

          leftCell.appendChild(info);
          leftCell.appendChild(name);
          row.appendChild(leftCell);

          for (const colName of cols) {
            const dotsWrap = document.createElement("div");
            dotsWrap.className = "dots";

            const itemKey = keyFor(cat.title, section.title, colName, item.name);
            const current = selections[itemKey] || "empty";

            for (const r of RATINGS) {
              const b = document.createElement("button");
              b.className = "dotBtn";
              b.type = "button";
              b.setAttribute("aria-label", `${item.name} (${colName}) → ${r.label}`);

              const dot = document.createElement("span");
              dot.className = `dot ${r.className}` + (current === r.id ? " selected" : "");
              
              b.appendChild(dot);
              b.addEventListener("click", () => {
                selections[itemKey] = r.id;
                saveLocalDebounced();
                // update visually
                dotsWrap.querySelectorAll(".dot").forEach(d => d.classList.remove("selected"));
                dot.classList.add("selected");
              });
              dotsWrap.appendChild(b);
            }
            row.appendChild(dotsWrap);
          }
          table.appendChild(row);
        }
        sec.appendChild(table);
        card.appendChild(sec);
      }
      root.appendChild(card);
    }
  }

  // =========================
  // SUPABASE SHARE
  // =========================
  async function saveSheet(id, data) {
    if (!sb) throw new Error("Supabase not configured.");
    const payload = { id, data };
    const { error } = await sb.from(TABLE_NAME).upsert(payload);
    if (error) throw error;
  }

  async function loadSheet(id) {
    if (!sb) throw new Error("Supabase not configured.");
    const { data, error } = await sb.from(TABLE_NAME).select("data").eq("id", id).single();
    if (error) throw error;
    return data?.data || null;
  }

  // =========================
  // CSV EXPORT LOGIC (Text Based)
  // =========================
  function exportCsv() {
    if (!SHEET.length) {
      alert("No data to export.");
      return;
    }

    // Prepare headers for CSV
    // Format: Category, Section, Item, Context (Self/Partner), Rating (Text)
    const rows = [["Category", "Section", "Item", "Context", "Rating"]];
    const safe = (str) => `"${(str || "").replace(/"/g, '""')}"`;

    let count = 0;

    // Loop through all data to find what user selected
    for (const cat of SHEET) {
      for (const section of cat.sections) {
        for (const item of section.items) {
          for (const colName of section.columns) {
            const k = keyFor(cat.title, section.title, colName, item.name);
            const val = selections[k];

            // If user selected something (and it's not "empty")
            if (val && val !== "empty") {
              // Convert "fav" (color code) to "Favorite" (readable text)
              const rObj = RATINGS.find(r => r.id === val);
              const label = rObj ? rObj.label : val;

              rows.push([
                safe(cat.title),
                safe(section.title),
                safe(item.name),
                safe(colName),
                safe(label) // <--- This is where Color becomes Text
              ]);
              count++;
            }
          }
        }
      }
    }

    if (count === 0) {
      alert("No selections found. Select some items before exporting.");
      return;
    }

    // Create CSV file string
    const csvContent = rows.map(e => e.join(",")).join("\n");
    
    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "MySheet_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // =========================
  // CUSTOMIZE
  // =========================
  function showCustomizeModal() {
    const back = document.createElement("div");
    back.className = "modalBack";
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <h3>Customize</h3>
      <p>Edit <b>INTIMACY.txt</b> to change categories/items.</p>
      <div class="modalActions">
        <button id="closeModal" class="secondary">Close</button>
      </div>
    `;
    document.body.appendChild(back);
    document.body.appendChild(modal);
    back.style.display = "block";
    
    const close = () => { back.remove(); modal.remove(); };
    back.addEventListener("click", close);
    modal.querySelector("#closeModal").addEventListener("click", close);
  }

  // =========================
  // BOOT
  // =========================
  async function boot() {
    setStatus("Loading data…");

    try {
      const res = await fetch(`${DATA_URL}?v=${Date.now()}`);
      if (!res.ok) throw new Error(`Failed to fetch ${DATA_URL}`);
      const raw = await res.text();
      SHEET = window.parseSheetFromTxt(raw);
      setStatus(SHEET.length ? `Loaded ${SHEET.length} categories.` : "Loaded empty file.");
    } catch (e) {
      console.error(e);
      setStatus(`Data load failed: ${e.message}`);
      SHEET = [];
    }

    loadLocal();

    sharedId = qs("id");
    if (sharedId) {
      try {
        setStatus("Loading shared sheet…");
        const remote = await loadSheet(sharedId);
        if (remote) {
          selections = remote;
          setStatus("Loaded shared sheet.");
        }
      } catch (e) {
        setStatus(`Share load failed: ${e.message}`);
      }
    }

    render();

    // ============================================
    // BUTTON WIRING (The Hijack)
    // ============================================
    
    // We bind the CSV function to the "exportPdf" button ID.
    // So the UI still says "Export PDF", but it downloads a CSV.
    el("exportPdf").onclick = exportCsv; 
    
    el("customize").onclick = showCustomizeModal;
    
    el("clearLocal").onclick = () => {
      if(!confirm("Clear all local selections?")) return;
      localStorage.removeItem(LOCAL_KEY);
      selections = {};
      render();
      setStatus("Local draft cleared.");
    };

    el("getLink").onclick = async () => {
      try {
        setStatus("Saving…");
        el("getLink").disabled = true;
        const id = makeId(10);
        await saveSheet(id, selections);
        const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
        el("shareUrl").value = url;
        el("shareUrl").select();
        setStatus("Saved. Share the link.");
      } catch (e) {
        console.error(e);
        setStatus("Save failed.");
      } finally {
        el("getLink").disabled = false;
      }
    };
  }

  boot();
})();
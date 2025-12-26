/********************************
 * SUPABASE CONFIG
 ********************************/
const SUPABASE_URL = "https://kypkibudjijdnqlfdlkz.supabase.co";
const SUPABASE_KEY = "sb_publishable_IxMUlcAIP0yGlp-JDHxI-Q_lozJCUrG";

if (!window.supabase) throw new Error("Supabase failed to load (check index.html script order).");
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/********************************
 * SHEET DATA
 ********************************/
const SHEET = window.SHEET_DEFINITION;
if (!Array.isArray(SHEET) || SHEET.length === 0) {
  throw new Error("SHEET_DEFINITION missing. Did sheetData.js load?");
}

const STATES = [
  { id: "fav", label: "Favorite" },
  { id: "like", label: "Like" },
  { id: "int", label: "Interested" },
  { id: "no", label: "No" },
];

const LOCAL_KEY = "sheet_state_v2";

const el = (id) => document.getElementById(id);

function setStatus(msg) {
  el("status").textContent = msg || "";
}

function getShareId() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "s") return parts[1];
  return null;
}

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {};
  } catch {
    return {};
  }
}

function saveLocal(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

function makeId(len = 12) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => (b % 36).toString(36)).join("");
}

function keyFor(sectionId, itemId, roleId) {
  return `${sectionId}.${itemId}.${roleId}`;
}

/********************************
 * SUPABASE IO
 ********************************/
async function fetchSheet(id) {
  const { data, error } = await db.from("sheets").select("data").eq("id", id).single();
  if (error) throw error;
  return data?.data || {};
}

async function saveSheet(id, state) {
  const { error } = await db.from("sheets").insert([{ id, data: state }]);
  if (error) throw error;
}

/********************************
 * RENDER
 ********************************/
function render(state, readOnly) {
  const root = el("sheet");
  root.innerHTML = "";

  SHEET.forEach(sectionDef => {
    const section = document.createElement("section");
    section.className = "section";

    const header = document.createElement("div");
    header.className = "sectionHeader";

    const title = document.createElement("h2");
    title.textContent = sectionDef.title;
    header.appendChild(title);

    const roleHeader = document.createElement("div");
    roleHeader.className = "roleHeader";
    sectionDef.roles.forEach(r => {
      const pill = document.createElement("div");
      pill.className = "rolePill";
      pill.textContent = r.label;
      roleHeader.appendChild(pill);
    });
    header.appendChild(roleHeader);

    section.appendChild(header);

    const rows = document.createElement("div");
    rows.className = "rows";

    sectionDef.items.forEach(item => {
      const row = document.createElement("div");
      row.className = "row";

      const label = document.createElement("div");
      label.className = "rowLabel";
      label.textContent = item.label;

      const roleCells = document.createElement("div");
      roleCells.className = "roleCells";

      sectionDef.roles.forEach(role => {
        const cell = document.createElement("div");
        cell.className = "roleCell";

        const k = keyFor(sectionDef.id, item.id, role.id);

        STATES.forEach(s => {
          const dot = document.createElement("button");
          dot.className = `choiceDot ${s.id}`;
          dot.type = "button";
          dot.title = s.label;

          if (state[k] === s.id) dot.classList.add("active");

          dot.onclick = () => {
            if (readOnly) return;

            if (state[k] === s.id) delete state[k];
            else state[k] = s.id;

            saveLocal(state);
            render(state, false);
          };

          cell.appendChild(dot);
        });

        roleCells.appendChild(cell);
      });

      row.appendChild(label);
      row.appendChild(roleCells);
      rows.appendChild(row);
    });

    section.appendChild(rows);
    root.appendChild(section);
  });
}

/********************************
 * EXPORT PNG
 ********************************/
async function exportPng() {
  const sheetEl = el("sheet");
  setStatus("Rendering PNG…");
  try {
    const canvas = await html2canvas(sheetEl, { scale: 2, backgroundColor: "#ffffff" });
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

/********************************
 * EXPORT PDF (print dialog)
 ********************************/
function exportPdf() {
  setStatus("Opening print dialog… choose “Save as PDF”.");
  window.print();
}

/********************************
 * MAIN
 ********************************/
async function main() {
  const shareId = getShareId();

  // Shared view (read-only)
  if (shareId) {
    setStatus("Loading shared sheet…");
    try {
      const shared = await fetchSheet(shareId);
      render(shared, true);
      el("shareUrl").value = location.href;

      el("getLink").disabled = true;
      el("clearLocal").disabled = true;

      el("exportPng").onclick = exportPng;
      el("exportPdf").onclick = exportPdf;

      setStatus("Viewing shared sheet (read-only).");
    } catch (e) {
      console.error(e);
      render({}, true);
      setStatus("Invalid or missing sheet.");
    }
    return;
  }

  // Edit mode
  const state = loadLocal();
  render(state, false);

  el("clearLocal").onclick = () => {
    localStorage.removeItem(LOCAL_KEY);
    render({}, false);
    el("shareUrl").value = "";
    setStatus("Local draft cleared.");
  };

  el("exportPng").onclick = exportPng;
  el("exportPdf").onclick = exportPdf;

  el("getLink").onclick = async () => {
    setStatus("Saving…");
    el("getLink").disabled = true;

    try {
      const id = makeId();
      await saveSheet(id, loadLocal());
      const url = `${location.origin}/s/${id}`;
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

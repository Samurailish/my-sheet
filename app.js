/********************************
 * SUPABASE CONFIG
 ********************************/
const SUPABASE_URL = "https://kypkibudjjdnqlfdlkz.supabase.co";
const SUPABASE_KEY = "sb_publishable_IxMULcAlPOyGlp-JDHxI-Q_lozJCUrG";

// SINGLE client — no duplicates
const db = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

/********************************
 * DATA MODEL
 ********************************/
const DATA = [
  {
    section: "INTIMACY",
    items: [
      "Romance / Affection",
      "Hugging",
      "Kissing (body)",
      "Kissing (mouth)",
      "Spooning",
      "Using real names",
      "Sleepover",
    ],
  },
  {
    section: "CLOTHING",
    items: [
      "Clothed sex",
      "Lingerie",
      "Stockings",
      "Heels",
      "Leather",
      "Latex",
      "Uniform",
      "Cosplay",
      "Cross-dressing",
      "Formal clothing",
    ],
  },
];

const STATES = ["fav", "like", "int", "no"];
const LOCAL_KEY = "sheet_state_v1";

/********************************
 * UTILITIES
 ********************************/
function qs(id) {
  return document.getElementById(id);
}

function setStatus(text) {
  const el = qs("status");
  if (el) el.textContent = text || "";
}

function getShareIdFromPath() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "s") return parts[1];
  return null;
}

function loadLocalState() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {};
  } catch {
    return {};
  }
}

function saveLocalState(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

function makeId(len = 12) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => (b % 36).toString(36)).join("");
}

/********************************
 * SUPABASE I/O
 ********************************/
async function fetchSheet(id) {
  const { data, error } = await db
    .from("sheets")
    .select("data")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data?.data || {};
}

async function saveSheet(id, state) {
  const { error } = await db
    .from("sheets")
    .insert([{ id, data: state }]);

  if (error) throw error;
}

/********************************
 * RENDER
 ********************************/
function render(state) {
  const root = qs("sheet");
  root.innerHTML = "";

  DATA.forEach(sec => {
    const section = document.createElement("section");
    section.className = "section";

    const h2 = document.createElement("h2");
    h2.textContent = sec.section;
    section.appendChild(h2);

    sec.items.forEach(item => {
      const key = `${sec.section}::${item}`;

      const row = document.createElement("div");
      row.className = "row";

      const label = document.createElement("label");
      label.textContent = item;

      const choices = document.createElement("div");
      choices.className = "choices";

      STATES.forEach(val => {
        const btn = document.createElement("div");
        btn.className = "choice";
        btn.dataset.val = val;

        if (state[key] === val) btn.classList.add("active");

        btn.onclick = () => {
          if (state[key] === val) delete state[key];
          else state[key] = val;

          saveLocalState(state);
          render(state);
        };

        choices.appendChild(btn);
      });

      row.appendChild(label);
      row.appendChild(choices);
      section.appendChild(row);
    });

    root.appendChild(section);
  });
}

/********************************
 * MAIN
 ********************************/
async function main() {
  const shareId = getShareIdFromPath();

  // READ-ONLY shared view
  if (shareId) {
    setStatus("Loading shared sheet…");
    try {
      const shared = await fetchSheet(shareId);
      render(shared);
      qs("shareUrl").value = location.href;
      qs("getLink").disabled = true;
      qs("clearLocal").disabled = true;
      setStatus("Viewing shared sheet (read-only).");
    } catch {
      render({});
      setStatus("Invalid or missing sheet.");
    }
    return;
  }

  // EDIT MODE
  const state = loadLocalState();
  render(state);

  qs("clearLocal").onclick = () => {
    localStorage.removeItem(LOCAL_KEY);
    render({});
    qs("shareUrl").value = "";
    setStatus("Local draft cleared.");
  };

  qs("getLink").onclick = async () => {
    qs("getLink").disabled = true;
    setStatus("Saving…");

    try {
      const id = makeId();
      const latest = loadLocalState();
      await saveSheet(id, latest);

      const url = `${location.origin}/s/${id}`;
      qs("shareUrl").value = url;
      qs("shareUrl").select();

      setStatus("Saved. Share the link.");
    } catch (e) {
      console.error(e);
      setStatus("Save failed. Check Supabase RLS policies.");
    } finally {
      qs("getLink").disabled = false;
    }
  };
}

main();

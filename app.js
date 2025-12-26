/*************************
 * 1) SUPABASE CONFIG
 *************************/
const SUPABASE_URL = "https://kypkibudjjdnqlfdlkz.supabase.co";
const SUPABASE_KEY = "sb_publishable_IxMULcAlPOyGlp-JDHxI-Q_lozJCUrG";

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

/*************************
 * 2) DATA
 *************************/
const DATA = [
  { section: "INTIMACY", items: ["Romance / Affection","Hugging","Kissing (body)","Kissing (mouth)","Spooning","Using real names","Sleepover"] },
  { section: "CLOTHING", items: ["Clothed sex","Lingerie","Stockings","Heels","Leather","Latex","Uniform","Cosplay","Cross-dressing","Formal clothing"] },
  // Add more sections later
];

const LOCAL_KEY = "sheet_state_v1";
const STATES = ["fav","like","int","no"];

/*************************
 * 3) HELPERS
 *************************/
function setStatus(msg){
  const el = document.getElementById("status");
  if (el) el.textContent = msg || "";
}

function getShareIdFromPath(){
  // expects /s/<id>
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "s" && parts[1]) return parts[1];
  return null;
}

function loadLocalState(){
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocalState(state){
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

// Strong enough random id for “friend links”
function makeId(len = 10){
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  // base36-ish from bytes
  return Array.from(bytes).map(b => (b % 36).toString(36)).join("");
}

/*************************
 * 4) SUPABASE IO
 *************************/
async function fetchSheetFromSupabase(id){
  const { data, error } = await supabase
    .from("sheets")
    .select("data")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data?.data || {};
}

async function saveSheetToSupabase(id, state){
  const payload = { id, data: state };
  const { error } = await supabase
    .from("sheets")
    .insert([payload]);

  if (error) throw error;
}

/*************************
 * 5) RENDER
 *************************/
function render(state){
  const root = document.getElementById("sheet");
  root.innerHTML = "";

  DATA.forEach(sec => {
    const wrap = document.createElement("section");
    wrap.className = "section";

    const h2 = document.createElement("h2");
    h2.textContent = sec.section;
    wrap.appendChild(h2);

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

        btn.addEventListener("click", () => {
          // toggle: clicking same selection clears it
          if (state[key] === val) delete state[key];
          else state[key] = val;

          saveLocalState(state);
          render(state);
        });

        choices.appendChild(btn);
      });

      row.appendChild(label);
      row.appendChild(choices);
      wrap.appendChild(row);
    });

    root.appendChild(wrap);
  });
}

/*************************
 * 6) MAIN
 *************************/
async function main(){
  setStatus("");

  const shareId = getShareIdFromPath();

  // If we are on /s/<id>, load from Supabase and DO NOT overwrite with local
  if (shareId){
    setStatus("Loading shared sheet…");
    try{
      const sharedState = await fetchSheetFromSupabase(shareId);
      render(sharedState);

      // Show the current URL in the share box for convenience
      const out = document.getElementById("shareUrl");
      out.value = location.href;

      // Disable "GET LINK" to prevent accidental overwrites confusion
      document.getElementById("getLink").disabled = true;

      setStatus("Viewing a shared sheet (read-only view).");
    } catch (e){
      console.error(e);
      setStatus("Could not load this shared link. It may not exist.");
      render({});
    }
    return;
  }

  // Normal edit mode (no /s/ in URL)
  const state = loadLocalState();
  render(state);

  // Clear local
  document.getElementById("clearLocal").onclick = () => {
    localStorage.removeItem(LOCAL_KEY);
    render({});
    setStatus("Local draft cleared.");
    document.getElementById("shareUrl").value = "";
  };

  // GET LINK => save to Supabase => short URL
  document.getElementById("getLink").onclick = async () => {
    setStatus("Saving…");
    const btn = document.getElementById("getLink");
    btn.disabled = true;

    try{
      const id = makeId(12);
      const latest = loadLocalState(); // grab freshest

      await saveSheetToSupabase(id, latest);

      const url = `${location.origin}/s/${id}`;
      const out = document.getElementById("shareUrl");
      out.value = url;
      out.focus();
      out.select();

      setStatus("Saved. Share the link.");
    } catch (e){
      console.error(e);
      setStatus("Save failed. This is usually RLS/policy not set.");
    } finally {
      btn.disabled = false;
    }
  };
}

main();

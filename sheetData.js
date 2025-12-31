/* global window */

window.SHEET_CONFIG = {
  // IMPORTANT: put INTIMACY.txt next to index.html so this fetch works on Vercel.
  dataUrl: "./INTIMACY.txt",
  // Search engine requested:
  searchBase: "https://www.pornhub.com/video/search?search=",

  categoryDescriptions: {
    "INTIMACY": "Affection, closeness, and non-explicit intimacy behaviors.",
    "CLOTHING": "Clothing, outfits, and accessories as part of the experience.",
    "GROUPINGS": "Group configurations and contexts.",
    "GENERAL": "General sexual activities and dynamics.",
    "PENETRATION": "Penetrative activities and variations.",
    "SPECIAL POSITIONS": "Positions, suspension, and unusual physical setups.",
    "BUTT STUFF": "Anal play and related activities.",
    "RESTRICTIVE": "Restraints, control, and limitation of movement.",
    "TOYS": "Toys and devices.",
    "DOMINATION": "Power dynamics, roles, and control.",
    "SCENARIOS": "Common scenes and setups.",
    "TABOO SCENARIOS": "Edgy fantasies — discuss consent and boundaries.",
    "SURREALISM": "Fantasy / unreal / impossible scenarios.",
    "FLUIDS": "Bodily fluids and related play.",
    "TOUCH & STIMULATION": "Touch-focused stimulation and sensation play.",
    "PAIN": "Impact / sensation intensity play.",
    "MARKING": "Marks, lasting or temporary.",
    "ROLE PLAY": "Character and dynamic role-play.",
    "FOOD PLAY": "Food used as a sensual element.",
    "MEDICAL PLAY": "Clinical-themed play.",
    "MINDFULNESS": "Slow, present, consent-forward intimacy."
  }
};

function isAllCapsCategory(line) {
  // Category lines in your txt are like: INTIMACY, CLOTHING, GROUPINGS... :contentReference[oaicite:3]{index=3}
  if (!line) return false;
  if (line.startsWith("*") || line.startsWith("●")) return false;
  // must contain at least one letter
  if (!/[A-Z]/.test(line)) return false;
  // treat as category if line equals its uppercase and doesn't contain pipes
  return line === line.toUpperCase() && !line.includes("|") && line.length <= 40;
}

function parseItemLine(line) {
  // line: "* Romance / Affection - Tender emotional and physical closeness..." :contentReference[oaicite:4]{index=4}
  const cleaned = line.replace(/^\s*[\*\u25cf]\s+/, "").trim();
  const idx = cleaned.indexOf(" - ");
  if (idx === -1) return { name: cleaned, desc: "" };
  return {
    name: cleaned.slice(0, idx).trim(),
    desc: cleaned.slice(idx + 3).trim()
  };
}

function safeId(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

window.parseSheetFromTxt = function parseSheetFromTxt(rawText) {
  const text = rawText.replace(/^\uFEFF/, ""); // strip BOM if present
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const categories = [];
  let currentCat = null;
  let currentSection = null;

  for (const line of lines) {
    if (isAllCapsCategory(line)) {
      currentCat = {
        id: safeId(line),
        title: line,
        description: (window.SHEET_CONFIG.categoryDescriptions[line] || ""),
        sections: []
      };
      categories.push(currentCat);
      currentSection = null;
      continue;
    }

    if (!currentCat) continue;

    // Item line
    if (/^\s*[\*\u25cf]\s+/.test(line)) {
      if (!currentSection) {
        currentSection = { title: "General", columns: ["General"], items: [] };
        currentCat.sections.push(currentSection);
      }
      const it = parseItemLine(line);
      currentSection.items.push(it);
      continue;
    }

    // Section / columns header line:
    // Examples from your txt:
    // "General" :contentReference[oaicite:5]{index=5}
    // "Self | Partner" :contentReference[oaicite:6]{index=6}
    // "Giving | Receiving" :contentReference[oaicite:7]{index=7}
    const hasPipes = line.includes("|");
    if (hasPipes) {
      const cols = line.split("|").map(s => s.trim()).filter(Boolean);
      currentSection = {
        title: cols.join(" / "),
        columns: cols,
        items: []
      };
    } else {
      currentSection = {
        title: line,
        columns: ["General"],
        items: []
      };
    }
    currentCat.sections.push(currentSection);
  }

  return categories;
};

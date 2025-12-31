/* sheetData.js
   Builds window.SHEET_DATA from a raw TXT format:

   CATEGORY
   Section Title (or "A | B" for 2 columns)
   * Item name - Explanation text
*/

(() => {
  const CATEGORY_DESC = {
    "INTIMACY": "Affection, closeness, and non-explicit intimacy behaviors.",
    "CLOTHING": "Clothing, outfits, and accessories as part of the experience.",
    "GROUPINGS": "Group configurations and contexts.",
    "GENERAL": "General sexual activities and dynamics.",
    "PENETRATION": "Penetrative activities and variations.",
    "SPECIAL POSITIONS": "Positions, suspension, and unusual physical setups.",
    "BUTT STUFF": "Anal play and related activities.",
    "RESTRICTIVE": "Restraints, control, and limitation of movement.",
    "TOYS": "Sex toys and devices.",
    "DOMINATION": "Power dynamics, roles, and control.",
    "SCENARIOS": "Roleplay and scenario-based activities.",
    "TABOO SCENARIOS": "Taboo roleplay themes (fictional/consensual framing).",
    "SURREALISM": "Fantasy/surreal themes and non-realistic elements.",
    "FLUIDS": "Messy/wet play and bodily fluids.",
    "TOUCH & STIMULATION": "Touch-based stimulation and sensory play.",
    "PAIN": "Impact and pain play (consensual)."
    // Any categories not listed here will simply show no description (cleaner than making stuff up).
  };

  // ✅ PASTE YOUR FULL TXT HERE (your INTIMACY.txt content)
  const RAW = String.raw`PASTE_YOUR_TXT_HERE`;

  const clean = (s) => (s || "").replace(/\uFEFF/g, "").trim();

  const slug = (s) =>
    clean(s)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const isCategoryLine = (line) => {
    const s = clean(line);
    if (!s) return false;
    if (s.startsWith("*")) return false;
    // Category lines are all caps in your file
    if (s !== s.toUpperCase()) return false;
    // keep it strict-ish
    return /^[A-Z0-9 &/'()\-]+$/.test(s) && s.length >= 3;
  };

  const parseSectionColumns = (title) => {
    const t = clean(title);
    if (t.includes("|")) {
      return t.split("|").map(x => clean(x));
    }
    // Special known case: "Self / Partner" etc.
    if (/^\s*Self\s*\/\s*Partner\s*$/i.test(t)) return ["Self", "Partner"];
    return null; // single-column section
  };

  const parseItemLine = (line) => {
    // "* Name - Explanation"
    const s = clean(line).replace(/^\*\s*/, "");
    const idx = s.indexOf(" - ");
    if (idx === -1) return { label: s, help: "" };
    return {
      label: clean(s.slice(0, idx)),
      help: clean(s.slice(idx + 3))
    };
  };

  function buildData(raw) {
    const lines = raw.split(/\r?\n/).map(clean);

    const categories = [];
    let cat = null;
    let section = null;

    const pushSection = () => null;
    const pushCategory = () => {
      if (cat) categories.push(cat);
      cat = null;
      section = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      if (isCategoryLine(line)) {
        pushCategory();
        const title = clean(line);
        cat = {
          id: slug(title),
          title,
          description: CATEGORY_DESC[title] || "",
          sections: []
        };
        continue;
      }

      if (!cat) continue; // ignore junk before first category

      if (line.startsWith("*")) {
        if (!section) {
          section = {
            title: "General",
            columns: null,
            items: []
          };
          cat.sections.push(section);
        }
        section.items.push(parseItemLine(line));
        continue;
      }

      // If it's not a category and not an item, it's a section header
      section = {
        title: line,
        columns: parseSectionColumns(line),
        items: []
      };
      cat.sections.push(section);
    }

    // finalize
    pushCategory();

    return categories;
  }

  window.SHEET_DATA = buildData(RAW);
})();

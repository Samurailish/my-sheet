/* global window */
window.SHEET_DATA = [
  {
    id: "intimacy",
    title: "INTIMACY",
    desc: "Affection, closeness, and non-explicit intimacy behaviors.",
    groups: [
      {
        id: "general",
        title: "General",
        columns: [{ key: "general", label: "" }],
        items: [
          { label: "Romance / Affection", q: "romance affection relationship intimacy" },
          { label: "Hugging", q: "hugging affection intimacy" },
          { label: "Kissing (body)", q: "kissing body intimacy" },
          { label: "Kissing (mouth)", q: "kissing mouth intimacy" },
          { label: "Spooning", q: "spooning cuddling intimacy" },
          { label: "Using real names", q: "using real names intimacy dynamic" },
          { label: "Sleepover", q: "sleepover intimacy couple" }
        ]
      }
    ]
  },

  {
    id: "groupings",
    title: "GROUPINGS",
    desc: "Group configurations and contexts.",
    groups: [
      {
        id: "general",
        title: "General",
        columns: [{ key: "general", label: "" }],
        items: [
          { label: "You and 1 male", q: "couple configuration you and 1 male" },
          { label: "You and 1 female", q: "couple configuration you and 1 female" },
          { label: "You and 1 male, 1 female", q: "threesome configuration male female" },
          { label: "You and 2 males", q: "threesome configuration 2 males" },
          { label: "You and 2 females", q: "threesome configuration 2 females" },
          { label: "Group setting", q: "group setting intimacy boundaries communication" }
        ]
      }
    ]
  },

  {
    id: "general",
    title: "GENERAL",
    desc: "General adult sexual activities and dynamics.",
    groups: [
      {
        id: "giving_receiving",
        title: "Giving / Receiving",
        columns: [
          { key: "giving", label: "Giving" },
          { key: "receiving", label: "Receiving" }
        ],
        items: [
          { label: "Hand play / Fingering", q: "fingering hand play safety consent" },
          { label: "Oral sex", q: "oral sex safety consent" },
          { label: "Deep throat (consensual)", q: "deep throat safety consent" },
          { label: "Swallowing", q: "swallowing sexual health safety" },
          { label: "Mutual masturbation", q: "mutual masturbation communication" },
          { label: "Edging", q: "edging technique consent" },
          { label: "Teasing", q: "sexual teasing consent communication" },
          { label: "Strip tease", q: "strip tease intimacy" }
        ]
      }
    ]
  },

  {
    id: "clothing",
    title: "CLOTHING",
    desc: "Clothing, outfits, and accessories as part of the experience.",
    groups: [
      {
        id: "self_partner",
        title: "Self / Partner",
        columns: [
          { key: "self", label: "Self" },
          { key: "partner", label: "Partner" }
        ],
        items: [
          { label: "Clothed sex", q: "clothed sex preferences" },
          { label: "Lingerie", q: "lingerie preferences" },
          { label: "Stockings", q: "stockings lingerie" },
          { label: "Heels", q: "heels intimacy" },
          { label: "Leather", q: "leather clothing kink fashion" },
          { label: "Latex", q: "latex clothing kink safety care" },
          { label: "Uniform", q: "uniform roleplay adult consent" },
          { label: "Cosplay", q: "cosplay adult roleplay consent" },
          { label: "Cross-dressing", q: "cross dressing intimacy" },
          { label: "Formal clothing", q: "formalwear intimacy" }
        ]
      }
    ]
  },

  {
    id: "penetration",
    title: "PENETRATION",
    desc: "Penetrative activities and variations (consenting adults only).",
    groups: [
      {
        id: "giving_receiving",
        title: "Giving / Receiving",
        columns: [
          { key: "giving", label: "Giving" },
          { key: "receiving", label: "Receiving" }
        ],
        items: [
          { label: "Penetration (general)", q: "penetration sex safety consent" },
          { label: "Strap-on (consensual)", q: "strap on safety consent" },
          { label: "Manual stimulation", q: "manual stimulation consent" },
          { label: "Toy-assisted penetration", q: "toy assisted penetration safety" }
        ]
      }
    ]
  },

  {
    id: "butt",
    title: "BUTT STUFF",
    desc: "Anal play and related activities (go slow, use lube, communicate).",
    groups: [
      {
        id: "giving_receiving",
        title: "Giving / Receiving",
        columns: [
          { key: "giving", label: "Giving" },
          { key: "receiving", label: "Receiving" }
        ],
        items: [
          { label: "Anal teasing", q: "anal teasing safety consent lube" },
          { label: "Anal toys", q: "anal toys safety lube hygiene" },
          { label: "Rimming (consensual)", q: "rimming safety hygiene consent" }
        ]
      }
    ]
  },

  {
    id: "restrictive",
    title: "RESTRICTIVE",
    desc: "Restraints, control, and limitation of movement (safety-first).",
    groups: [
      {
        id: "self_partner",
        title: "Self / Partner",
        columns: [
          { key: "self", label: "Self" },
          { key: "partner", label: "Partner" }
        ],
        items: [
          { label: "Blindfold", q: "blindfold sensory play consent safety" },
          { label: "Handcuffs (soft / padded)", q: "padded handcuffs safety consent" },
          { label: "Rope (basic)", q: "rope bondage safety consent beginner" },
          { label: "Collar (symbolic)", q: "collar consensual dynamic" },
          { label: "Leash (play)", q: "leash play consensual dynamic" }
        ]
      }
    ]
  },

  {
    id: "domination",
    title: "DOMINATION",
    desc: "Power dynamics (explicit consent and boundaries required).",
    groups: [
      {
        id: "as_roles",
        title: "As Dom / As Sub",
        columns: [
          { key: "dom", label: "As Dom" },
          { key: "sub", label: "As Sub" }
        ],
        items: [
          { label: "Dominant / Submissive dynamic", q: "dominant submissive consent boundaries" },
          { label: "Domestic service (consensual)", q: "domestic service consensual dynamic" },
          { label: "Discipline (consensual)", q: "discipline bdsm consent safety" },
          { label: "Begging (consensual)", q: "begging kink consent" },
          { label: "Orgasm control (consensual)", q: "orgasm control consent boundaries" }
        ]
      }
    ]
  },

  {
    id: "touch",
    title: "TOUCH & STIMULATION",
    desc: "Physical stimulation and sensation play.",
    groups: [
      {
        id: "actor_subject",
        title: "Actor / Subject",
        columns: [
          { key: "actor", label: "Actor" },
          { key: "subject", label: "Subject" }
        ],
        items: [
          { label: "Tickling", q: "tickling consent safety" },
          { label: "Foot play", q: "foot play consent hygiene" },
          { label: "Massage (sensual)", q: "sensual massage consent" },
          { label: "Temperature play (mild)", q: "temperature play safety consent" },
          { label: "Light scratching", q: "light scratching consent safety" }
        ]
      }
    ]
  },

  {
    id: "fluids",
    title: "FLUIDS",
    desc: "Fluid-related preferences (health/safety awareness matters).",
    groups: [
      {
        id: "general",
        title: "General",
        columns: [{ key: "general", label: "" }],
        items: [
          { label: "Blood (medical play discussion)", q: "blood play safety consent risks" },
          { label: "Watersports", q: "watersports kink safety consent" },
          { label: "Scat", q: "scat kink safety risks consent" },
          { label: "Cum play", q: "cum play consent hygiene" }
        ]
      }
    ]
  },

  {
    id: "pain",
    title: "PAIN",
    desc: "Impact and pain play (keep it safe, negotiated, and reversible).",
    groups: [
      {
        id: "giving_receiving",
        title: "Giving / Receiving",
        columns: [
          { key: "giving", label: "Giving" },
          { key: "receiving", label: "Receiving" }
        ],
        items: [
          { label: "Light pain", q: "light pain play consent safety" },
          { label: "Heavy pain", q: "heavy pain play consent safety aftercare" },
          { label: "Spanking", q: "spanking safety consent" },
          { label: "Paddles", q: "paddle impact play safety" },
          { label: "Whips (beginner-safe discussion)", q: "whip impact play safety consent" }
        ]
      }
    ]
  },

  {
    id: "toys",
    title: "TOYS",
    desc: "Toy usage preferences.",
    groups: [
      {
        id: "on_self_on_others",
        title: "On Self / On Others",
        columns: [
          { key: "self", label: "On Self" },
          { key: "others", label: "On Others" }
        ],
        items: [
          { label: "Vibrators", q: "vibrator safety cleaning" },
          { label: "Dildos", q: "dildo safety cleaning" },
          { label: "Plugs", q: "plug safety cleaning" },
          { label: "Wands", q: "wand massager safety" },
          { label: "Sex machine (discussion)", q: "sex machine safety consent" }
        ]
      }
    ]
  },

  {
    id: "scenarios",
    title: "SCENARIOS",
    desc: "Role and context scenarios (consensual only).",
    groups: [
      {
        id: "roles",
        title: "Being center / Participating / Observing",
        columns: [
          { key: "center", label: "Being center" },
          { key: "part", label: "Participating" },
          { key: "obs", label: "Observing" }
        ],
        items: [
          { label: "Exhibitionism (safe/private)", q: "exhibitionism consent privacy safety" },
          { label: "Voyeurism (consensual)", q: "voyeurism consent privacy safety" },
          { label: "Humiliation (consensual)", q: "humiliation kink consent aftercare" },
          { label: "Medical roleplay (consensual)", q: "medical roleplay consent boundaries" }
        ]
      }
    ]
  }
];

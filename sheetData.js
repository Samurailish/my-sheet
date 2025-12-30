:root{
  --bg:#ffffff;
  --card:#ffffff;
  --muted:#6b7280;
  --border:#e5e7eb;
  --shadow: 0 10px 30px rgba(0,0,0,.06);
  --radius:16px;
  --primary:#ef4444;
  --btn:#111827;
  --btnText:#fff;

  --fav:#60a5fa;
  --like:#6ee7b7;
  --int:#fcd34d;
  --no:#fca5a5;
  --empty:#ffffff;
}

*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  background:var(--bg);
  color:#111827;
}

.top{
  padding:22px 24px 14px;
  border-bottom: 1px solid var(--border);
}

h1{margin:0 0 6px;font-size:56px;letter-spacing:-0.02em}
.sub{margin:0 0 14px;color:var(--muted)}

.legend{
  display:flex;
  align-items:center;
  gap:14px;
  flex-wrap:wrap;
  margin:10px 0 14px;
  color:#111827;
  font-size:14px;
}

.actions{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  align-items:center;
  margin-bottom:12px;
}

button{
  border:0;
  border-radius:10px;
  padding:10px 14px;
  font-weight:700;
  cursor:pointer;
  background:var(--primary);
  color:#fff;
}

button.secondary{
  background:var(--btn);
  color:var(--btnText);
}

button:disabled{opacity:.6;cursor:not-allowed}

#shareUrl{
  width:100%;
  padding:12px 14px;
  border:1px solid var(--border);
  border-radius:12px;
  outline:none;
  font-size:14px;
}

.status{margin-top:8px;color:var(--muted);min-height:18px}

.sheet{
  padding:22px 24px 40px;
  display:grid;
  grid-template-columns: repeat(2, minmax(320px, 1fr));
  gap:18px;
}

@media (max-width: 980px){
  .sheet{grid-template-columns:1fr}
  h1{font-size:44px}
}

.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow:hidden;
}

.cardHeader{
  padding:14px 16px;
  background:#f9fafb;
  border-bottom:1px solid var(--border);
}

.cardTitle{
  margin:0;
  font-size:22px;
  font-weight:900;
  letter-spacing: -0.01em;
}

.cardSub{
  margin:6px 0 0;
  color:var(--muted);
  font-size:13px;
}

.group{
  padding:10px 16px 6px;
  color:#111827;
  font-weight:800;
  font-size:13px;
}

.table{
  width:100%;
  border-collapse:collapse;
}

.row{
  border-top:1px solid var(--border);
}

.cellLabel{
  padding:12px 16px;
  font-weight:800;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}

.labelText{
  line-height:1.15;
}

.qBtn{
  width:26px;
  height:26px;
  border-radius:999px;
  border:1px solid #cbd5e1;
  background:#fff;
  color:#111827;
  font-weight:900;
  display:grid;
  place-items:center;
  flex:0 0 auto;
}
.qBtn:hover{background:#f3f4f6}

.cellDots{
  padding:10px 16px;
  text-align:right;
}

.dots{
  display:inline-flex;
  gap:10px;
  align-items:center;
}

.dot{
  width:18px;height:18px;border-radius:999px;
  border:1px solid rgba(0,0,0,.18);
  display:inline-block;
}

/* Default: DIM + desaturate so selection is obvious */
.dotChoice{
  width:34px;height:22px;border-radius:999px;
  border:1px solid rgba(0,0,0,.18);
  background:#fff;
  cursor:pointer;
  padding:0;
  position:relative;
  filter: grayscale(1) saturate(.15);
  opacity:.35;
  transform: translateZ(0);
}

.dotChoice::after{
  content:"";
  position:absolute;
  inset:3px;
  border-radius:999px;
  background:transparent;
}

.dotChoice.fav::after{background:var(--fav)}
.dotChoice.like::after{background:var(--like)}
.dotChoice.int::after{background:var(--int)}
.dotChoice.no::after{background:var(--no)}
.dotChoice.empty::after{
  background:var(--empty);
  border:1px solid rgba(0,0,0,.18);
}

/* Selected: full color + strong outline */
.dotChoice.selected{
  filter:none;
  opacity:1;
  border:2px solid rgba(0,0,0,.55);
  box-shadow: 0 0 0 3px rgba(0,0,0,.08);
}

/* Tooltip */
.tip{
  position:fixed;
  min-width:280px;
  max-width:420px;
  background:#fff;
  border:1px solid var(--border);
  border-radius:14px;
  box-shadow: var(--shadow);
  padding:12px;
  z-index:9999;
}

.tip.hidden{display:none}

.tipHeader{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
  margin-bottom:8px;
}

.tipTitle{
  font-weight:900;
  font-size:14px;
}

.tipClose{
  background:#fff;
  border:1px solid var(--border);
  color:#111827;
  width:28px;height:28px;
  border-radius:10px;
  padding:0;
  cursor:pointer;
}

.tipBody{
  color:#111827;
  font-size:13px;
  line-height:1.35;
  white-space:pre-wrap;
}

.tipFooter{
  display:flex;
  justify-content:flex-end;
  margin-top:10px;
}

.tipSearch{
  background:#111827;
  color:#fff;
  border-radius:10px;
  padding:8px 12px;
  font-weight:900;
}

/* Print: hide UI chrome */
@media print {
  .actions, #shareUrl, .status, .legend, .sub, #customize, #getLink, #clearLocal, #exportPdf { display:none !important; }
  body{ background:#fff; }
  .sheet{ padding:0; gap:10px; }
  .card{ box-shadow:none; }
  .qBtn{ display:none !important; }
  .dotChoice{ opacity:1 !important; filter:none !important; }
}

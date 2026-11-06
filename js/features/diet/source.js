/* Dieta, primo passo: da dove arriva. Si carica un JSON (file o incollato), si copia una dieta esistente,
   oppure si chiede all'IA — o di convertire il proprio PDF in JSON, o di proporre una dieta. */

function dietSourceSheet(k) {
  var err = k.err ? `<div class="banner exp" style="margin-bottom:12px">${esc(k.err)}</div>` : "";
  if (k.step === "gen") return dietGenSheet(k, err);
  if (k.step === "genout") return dietGenOutSheet(k, err);
  var copy = S.diete.length
    ? `<div class="field" style="margin-top:12px"><label for="d-copy">Oppure copia una dieta esistente</label><div class="row"><select id="d-copy" data-sf="copyFrom" style="flex:1"><option value="">Scegli…</option>${S.diete
        .map((x) => `<option value="${x.id}"${k.copyFrom === x.id ? " selected" : ""}>${esc(x.nome)}</option>`)
        .join("")}</select><button class="btn small" data-act="d-copy">Copia</button></div></div>`
    : "";
  var conv = k.showConv
    ? `<div class="card" style="margin:10px 0 0"><p class="meta" style="margin:0 0 10px">1. Copia il prompt. 2. Incollalo in un assistente IA (Claude, ChatGPT…) e allega il PDF della dieta, con eventuale altro testo. 3. Incolla qui sopra la risposta, oppure salvala come file .json e caricala.</p>${promptCard("conv-d", "Prompt da dare all'IA", promptConvertDieta())}</div>`
    : "";
  var body = `<p class="meta" style="margin:0 0 12px">La dieta si carica da un file <b>JSON</b>.</p>
    <div class="field"><label for="d-file">Carica il file JSON</label><input type="file" id="d-file" accept=".json,application/json,.txt,text/plain"></div>
    <div class="field"><label for="d-txt">Oppure incolla qui il JSON (o la risposta dell'IA)</label><textarea class="dtx" id="d-txt" data-sf="txt" placeholder='{ "gymtrack": "dieta", … }'>${esc(k.txt || "")}</textarea></div>
    <button class="btn wide" data-act="d-conv">${k.showConv ? "Nascondi" : "Non ho il JSON: come lo ottengo dal mio PDF?"}</button>${conv}
    <button class="btn wide" style="margin-top:8px" data-act="d-gen">Crea una dieta con l'IA</button>${copy}
    ${k.busy ? '<p class="meta">Leggo il file…</p>' : ""}${err}`;
  return sheetShell(
    "Nuova dieta",
    body,
    `<div class="grid2"><button class="btn" data-act="close-sheet">Annulla</button><button class="btn primary" data-act="d-parse"${k.busy ? " disabled" : ""}>Leggi il JSON</button></div>`
  );
}
var GEN_MEALS = ["Colazione", "Spuntino", "Pranzo", "Merenda", "Cena"];
function dietGenSheet(k, err) {
  var chips = GEN_MEALS.map((m) => {
    var on = k.genMeals.indexOf(m) >= 0;
    return `<button class="eq" data-act="d-genmeal" data-m="${m}" aria-pressed="${on}"><span>${on ? "✓" : "+"}</span> ${m}</button>`;
  }).join("");
  var body = `${AI_WARN_HTML}
    <div class="meta" style="margin:0 0 6px;font-weight:600">Pasti della giornata</div><div class="eqs" style="margin-bottom:14px">${chips}</div>
    <div class="field"><label for="g-dis">Cibi o spezie che non ti piacciono</label><textarea id="g-dis" data-sf="dislikes" rows="2" placeholder="Es. cavolfiore, coriandolo, zenzero, pesce azzurro">${esc(k.dislikes || "")}</textarea></div>
    <div class="field"><label for="g-all">Allergie o intolleranze (facoltativo)</label><textarea id="g-all" data-sf="allergie" rows="2" placeholder="Es. lattosio, glutine, arachidi">${esc(k.allergie || "")}</textarea></div>
    <p class="hint">Uso anche età, altezza, peso e obiettivo del tuo profilo e della sessione in corso.</p>${err}`;
  return sheetShell(
    "Dieta con l'IA",
    body,
    `<div class="grid2"><button class="btn" data-act="d-back">Indietro</button><button class="btn primary" data-act="d-genprompt">Prepara il prompt</button></div>`
  );
}
function dietGenOutSheet(k, err) {
  var auto = aiFn
    ? `<button class="btn primary wide" style="margin-bottom:12px"${k.busy ? " disabled" : ""} data-act="d-genai">${k.busy ? "Sto creando la dieta…" : "Genera qui con l'IA"}</button><p class="hint" style="margin:0 0 12px">Oppure usa il prompt qui sotto in un assistente esterno.</p>`
    : "";
  var body = `${AI_WARN_HTML}${auto}${promptCard("gen-d", "1. Copia questo prompt in un assistente IA", k.prompt)}
    <div class="field"><label for="g-paste">2. Incolla qui la risposta</label><textarea id="g-paste" class="dtx mono" data-sf="paste" placeholder='{ "gymtrack": "dieta", … }'>${esc(k.paste || "")}</textarea></div>${err}`;
  return sheetShell(
    "Dieta con l'IA",
    body,
    `<div class="grid2"><button class="btn" data-act="d-back">Indietro</button><button class="btn primary" data-act="d-genimport">Importa la dieta</button></div>`
  );
}

/* Legge un JSON di dieta (testo grezzo, anche con parole attorno, oppure oggetto già letto) e passa alla scelta dei pasti. */
function dietIngest(src) {
  var k = sheet,
    r;
  try {
    var o = typeof src === "string" ? parseLoose(src) : src;
    if (!o) throw new Error("Non trovo un JSON valido nel testo.");
    if (o.gymtrack === "sessione") throw new Error("Questo è un JSON di allenamento: caricalo da Sessioni.");
    r = dietFromJson(o);
  } catch (e) {
    k.busy = false;
    k.err = e && e.message ? e.message : "Dieta non leggibile.";
    render();
    return;
  }
  k.busy = false;
  k.pasti = r.pasti;
  k.regole = r.regole;
  k.periodo = r.periodo;
  k.nome =
    r.nome ||
    (r.periodo && r.periodo.dal ? "Dieta " + fd(Date.parse(r.periodo.dal)) + " – " + fd(Date.parse(r.periodo.al)) : "Dieta " + (S.diete.length + 1));
  k.step = "pasti";
  k.err = "";
  render();
}
async function dietRead(file) {
  var k = sheet;
  if (!k || !file) return;
  k.busy = true;
  k.err = "";
  render();
  try {
    var txt = await file.text();
    if (sheet !== k) return;
    k.txt = txt;
    dietIngest(txt);
  } catch (e) {
    if (sheet === k) {
      k.busy = false;
      k.err = "Non riesco a leggere il file.";
      render();
    }
  }
}
async function genDietAI() {
  var k = sheet;
  if (!k || k.busy) return;
  k.err = "";
  k.busy = true;
  render();
  aiCtl = new AbortController();
  try {
    var o = await aiFn.json(k.prompt, { modelTier: "default", cache: false, signal: aiCtl.signal });
    if (sheet === k) dietIngest(o);
  } catch (e) {
    if (sheet === k) {
      k.busy = false;
      k.err = aiCopy(e && e.code);
      render();
    }
  }
}

ACT["d-new"] = function () {
  if (!S.sessioni.length) {
    toast("Prima crea una sessione: la dieta va collegata a una sessione");
    return;
  }
  var cur = attiva();
  sheet = {
    kind: "dieta",
    step: "src",
    txt: "",
    err: "",
    busy: false,
    pasti: [],
    cook: "due",
    dir: "sera",
    sessId: cur ? cur.id : "",
    copyFrom: "",
    showConv: false,
    genMeals: ["Colazione", "Pranzo", "Cena", "Spuntino"],
    dislikes: "",
    allergie: "",
    paste: ""
  };
  render();
};
ACT["d-parse"] = function () {
  dietIngest(sheet.txt);
};
ACT["d-conv"] = function () {
  sheet.showConv = !sheet.showConv;
  render();
};
ACT["d-copy"] = function () {
  var cf = dietById(sheet.copyFrom);
  if (!cf) {
    sheet.err = "Scegli la dieta da copiare.";
    render();
    return;
  }
  sheet.pasti = reId(clone(cf.pasti));
  sheet.regole = clone(cf.regole);
  sheet.periodo = cf.periodo || null;
  sheet.nome = cf.nome + " (copia)";
  sheet.cook = (cf.cook && cf.cook.mode) || "due";
  sheet.dir = (cf.cook && cf.cook.dir) || "sera";
  sheet.step = "pasti";
  sheet.err = "";
  render();
};
ACT["d-gen"] = function () {
  sheet.step = "gen";
  sheet.err = "";
  render();
};
ACT["d-genmeal"] = function (d) {
  var i = sheet.genMeals.indexOf(d.m);
  if (i >= 0) sheet.genMeals.splice(i, 1);
  else sheet.genMeals.push(d.m);
  render();
};
ACT["d-genprompt"] = function () {
  if (!sheet.genMeals.length) {
    sheet.err = "Scegli almeno un pasto.";
    render();
    return;
  }
  sheet.genMeals.sort((a, b) => GEN_MEALS.indexOf(a) - GEN_MEALS.indexOf(b));
  sheet.prompt = promptGenDieta(sheet);
  sheet.step = "genout";
  sheet.err = "";
  render();
};
ACT["d-genimport"] = function () {
  dietIngest(sheet.paste);
};
ACT["d-genai"] = function () {
  genDietAI();
};

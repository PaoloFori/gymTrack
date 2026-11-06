/* Analisi: statistiche per «scheda suprema» (sessione + dieta) o per sessione, record di tutte le sessioni insieme, peso e storico. */

/* Allenamenti dell'ambito scelto (tutte le sessioni oppure una). */
function scopeSession() {
  return anScope === "all" ? null : S.sessioni.find((x) => x.id === anScope) || null;
}
function scopeLogs() {
  var x = scopeSession();
  return x ? LOG.filter((l) => l.sid === x.id) : LOG;
}
function logVol(l) {
  var v = 0;
  (l.ex || []).forEach((e) => (v += exVol(e.sets)));
  return v;
}
/* Volume sollevato per settimana (kg) nell'intervallo [from, to]. */
function weeklyVolume(logs, from, to) {
  var ws0 = wsOf(from),
    n = Math.round((wsOf(to) - ws0) / WEEK) + 1,
    v = [];
  for (var i = 0; i < n; i++) v.push(0);
  logs.forEach((l) => {
    var k = Math.round((wsOf(l.ts) - ws0) / WEEK);
    if (k >= 0 && k < n) v[k] += logVol(l);
  });
  return v.map((y, i) => ({ x: ws0 + i * WEEK, y: Math.round(y) }));
}
function statTile(valore, etichetta) {
  return `<div class="card stat"><b>${valore}</b><span>${etichetta}</span></div>`;
}
function tons(kg) {
  return (kg / 1000).toFixed(1).replace(".", ",");
}
function anChips() {
  var chips = [`<button class="eq" data-act="an-scope" data-id="all" aria-pressed="${anScope === "all"}">Tutto</button>`];
  S.sessioni
    .slice()
    .reverse()
    .forEach((x) => {
      var d = dietOf(x);
      chips.push(
        `<button class="eq" data-act="an-scope" data-id="${x.id}" aria-pressed="${anScope === x.id}">${esc(x.nome)}${d ? " + " + esc(d.nome) : ""}</button>`
      );
    });
  return `<div class="eqs">${chips.join("")}</div><p class="hint">Le sessioni con una dieta collegata sono «schede supreme».</p>`;
}
/* Riquadro dell'ambito: statistiche e andamento settimanale. */
function scopeCard() {
  var x = scopeSession(),
    logs = scopeLogs(),
    vol = 0,
    dur = 0,
    nDur = 0;
  logs.forEach((l) => {
    vol += logVol(l);
    if (l.durMin) {
      dur += l.durMin;
      nDur++;
    }
  });
  var n = Math.max(logs.length, (x && x.fatti) || 0),
    avg = nDur ? Math.round(dur / nDur) + " min" : "—";
  if (!x) {
    var h = `<div class="card"><div class="meta" style="margin:0 0 8px;font-weight:600">Tutte le sessioni</div><div class="grid3" style="margin:0">${statTile(S.sessioni.length, "sessioni")}${statTile(LOG.length, "allenamenti")}${statTile(tons(vol), "t sollevate")}</div><div class="grid3" style="margin:10px 0 0">${statTile(avg, "durata media")}${statTile(S.diete.length, "diete")}${statTile(volMonth(), "t negli ultimi 30 gg")}</div>`;
    var from = logs.length ? logs[logs.length - 1].ts : Date.now();
    return (
      h +
      `<div class="meta" style="margin:12px 0 0;font-weight:600">Volume per settimana (kg)</div>${lineChart(weeklyVolume(logs, from, Date.now()), "kg")}</div>`
    );
  }
  var L = sessLevel(x),
    d = dietOf(x),
    end = x.chiusa ? x.chiuseTs || endOf(x) : Math.min(Date.now(), endOf(x)),
    weeks = Math.max(1, Math.ceil((end - x.start) / WEEK)),
    pct = Math.min(999, Math.round((100 * n) / (x.giorni * weeks)));
  var h2 = `<div class="card"><div class="row"><div class="grow"><b class="xn" style="font-family:var(--display);font-size:22px;text-transform:uppercase">${esc(x.nome)}</b><div class="meta">${esc(x.obiettivo)} · ${fd(x.start)} – ${fd(end)} · ${x.giorni} a settimana</div></div><span class="mini" style="width:54px;height:64px">${avatarSVG(x.tipo, L.st, x)}</span></div>
    <div class="row" style="margin:10px 0 4px"><div class="lvl grow">${esc(L.label)}</div><div class="meta" style="font-weight:600">Forma ${Math.round(L.P)} / 100</div></div><div class="prog"><i style="width:${L.P.toFixed(1)}%"></i></div>
    <div class="grid3" style="margin:12px 0 0">${statTile(n, "allenamenti")}${statTile(tons(vol), "t sollevate")}${statTile(pct + "%", "aderenza")}</div>
    <div class="meta" style="margin:12px 0 0;font-weight:600">Volume per settimana (kg)</div>${lineChart(weeklyVolume(logs, x.start, end), "kg")}</div>`;
  if (d) {
    var presi = d.spesa.filter((s) => s.preso).length,
      ck = d.cook || { mode: "due" };
    h2 += `<button class="curcard" data-act="open-diet" data-id="${d.id}"><span class="ico"><svg viewBox="0 0 24 24">${TABS[2].i}</svg></span><span class="grow"><span class="meta" style="margin:0">Dieta della scheda suprema</span><b class="xn">${esc(d.nome)}</b><span class="meta">${mealCount(d)} pasti · cottura ${ck.mode === "uno" ? "una volta al giorno" : "due volte al giorno"} · spesa ${presi}/${d.spesa.length}</span></span>${chevron()}</button>`;
  }
  return h2;
}
function histBody() {
  var logs = scopeLogs(),
    x = scopeSession(),
    h = "";
  if (hm === "sess") {
    var list = x ? [x] : S.sessioni.slice().reverse();
    if (!list.length) return '<p class="meta">Nessuna sessione ancora.</p>';
    list.forEach((s) => {
      var ls = LOG.filter((l) => l.sid === s.id),
        v = 0;
      ls.forEach((l) => (v += logVol(l)));
      h += `<button class="plain prrow" style="width:100%;text-align:left" data-act="open-sess" data-id="${s.id}"><b>${esc(s.nome)}${s.chiusa ? "" : " (in corso)"}</b><span>${ls.length} ${ls.length === 1 ? "allenamento" : "allenamenti"} · ${tons(v)} t ›</span></button>`;
    });
  } else if (hm === "ex") {
    var m = {};
    logs.forEach((l) => {
      (l.ex || []).forEach((e) => {
        var k = exKey(e);
        if (!k) return;
        var o = m[k] || (m[k] = { nome: e.nome, id: e.id, n: 0, sid: {}, ts: 0 });
        o.n++;
        o.sid[l.sid] = 1;
        if (l.ts > o.ts) {
          o.ts = l.ts;
          o.id = e.id;
        }
      });
    });
    var arr = Object.keys(m)
      .map((k) => m[k])
      .sort((a, b) => b.ts - a.ts);
    if (!arr.length) return '<p class="meta">Qui compaiono gli esercizi che hai fatto, con tutta la loro storia.</p>';
    arr.forEach((o) => {
      var ns = Object.keys(o.sid).length;
      h += `<button class="plain prrow" style="width:100%;text-align:left" data-act="graf" data-eid="${esc(o.id || "")}" data-n="${esc(o.nome)}"><b>${esc(o.nome)}</b><span>${o.n} ${o.n === 1 ? "volta" : "volte"} · ${ns} ${ns === 1 ? "sessione" : "sessioni"} ↗</span></button>`;
    });
  } else {
    if (!logs.length) return '<p class="meta">Qui compaiono gli allenamenti che termini.</p>';
    logs.slice(0, 30).forEach((l) => (h += logHTML(l)));
  }
  return h;
}
function vAnalisi() {
  if (anScope !== "all" && !scopeSession()) anScope = "all";
  var seg = (m, t) => `<button class="btn small${hm === m ? " primary" : ""}" data-act="hist-m" data-m="${m}">${t}</button>`;
  return (
    hdr("Analisi", "Schede supreme, sessioni e record", false) +
    `<div class="stack">${anChips()}${scopeCard()}${recordsHTML()}${pesoHTML()}
    <div class="card"><div class="meta" style="margin:0 0 8px;font-weight:600">Storico${anScope === "all" ? "" : " della sessione"}</div><div class="row" style="gap:6px;margin-bottom:8px">${seg("sess", "Per sessione")}${seg("ex", "Per esercizio")}${seg("cron", "Cronologia")}</div>${histBody()}</div></div>`
  );
}
ACT["an-scope"] = function (d) {
  anScope = d.id;
  render();
};
VIEWS.analisi = vAnalisi;

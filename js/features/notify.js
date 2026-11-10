/* Promemoria: acqua, pasti/spuntini della dieta e allenamenti saltati.
   Non c'è un server che li invii: partono dall'app, quindi arrivano solo se è aperta o appena passata in secondo piano
   (su iPhone solo se è aggiunta alla Home). Se l'app si apre in ritardo manda al massimo l'ultimo promemoria scaduto da meno di 30 minuti. */

var NDEF = {
  water: { on: false, goal: 2.5, every: 120, from: "08:00", to: "22:00" },
  meals: { on: false, before: 10 },
  train: { on: false, at: "18:00" }
};
function notifCfg() {
  var c = S.notif && typeof S.notif === "object" ? S.notif : (S.notif = {});
  Object.keys(NDEF).forEach((k) => (c[k] = Object.assign({}, NDEF[k], c[k] || {})));
  if (!c.sent || typeof c.sent !== "object") c.sent = {};
  return c;
}
const isSnack = (nome) => /spuntino|merenda/i.test(nome);
/* orari dei promemoria dell'acqua: dalle «from» alle «to» ogni «every» minuti */
function waterSlots(w) {
  var out = [],
    every = Math.max(15, Number(w.every) || 120);
  for (var m = hm(w.from); m <= hm(w.to); m += every) out.push(m);
  return out;
}
/* pasti da ricordare, dalla dieta corrente: [{ id, nome, items, min }] */
function mealReminders(c) {
  var out = [];
  curDiets().forEach((d) => {
    var names = c.meals.names;
    (d.plan[todayI()] || []).forEach((m) => {
      var on = names ? names[m.t] : isSnack(m.t);
      if (on) out.push({ id: "m" + d.id + m.t, nome: m.t, ora: mealTime(m), items: m.v, min: hm(mealTime(m)) - (Number(c.meals.before) || 0) });
    });
  });
  return out;
}
function trainMsg() {
  var a = attiva();
  if (!a || a.start > Date.now()) return "";
  var g = progress(a);
  if (g.over) return "";
  var last = LOG.filter((l) => l.sid === a.id).reduce((m, l) => Math.max(m, l.ts), 0),
    t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  if (last >= t0.getTime()) return ""; // oggi ti sei già allenato
  var exp = Math.round((g.thisT * todayI()) / 7),
    gap = Math.floor((Date.now() - (last || a.start)) / 86400000);
  if (g.thisC < exp)
    return `Stai saltando troppi allenamenti: questa settimana ne hai fatti ${g.thisC} su ${g.thisT} e a oggi dovresti essere a ${exp}. Oggi è il momento di allenarti!`;
  if (gap >= 3) return `Sono ${gap} giorni che non ti alleni. Un allenamento oggi ti rimette in carreggiata!`;
  return "";
}
function notifTick() {
  try {
    if (typeof S === "undefined" || notifState() !== "granted") return;
    var c = notifCfg(),
      dn = new Date(),
      nm = dn.getHours() * 60 + dn.getMinutes(),
      changed = false;
    if (c.day !== dn.toDateString()) {
      c.day = dn.toDateString();
      c.sent = {};
      changed = true;
    }
    /* slots = minuti; manda l'ultimo scaduto (se recente) e segna come fatti tutti quelli passati */
    var fire = (id, slots, send) => {
      var due = -1;
      slots.forEach((m, i) => {
        if (m <= nm && !c.sent[id + i]) due = i;
      });
      if (due < 0) return;
      slots.forEach((m, i) => {
        if (m <= nm) c.sent[id + i] = 1;
      });
      changed = true;
      if (nm - slots[due] <= 30) send(due);
    };
    if (c.water.on) {
      var ws = waterSlots(c.water),
        ml = Math.max(50, Math.round((c.water.goal * 1000) / ws.length / 50) * 50);
      fire("w", ws, () =>
        notify("💧 Bevi un po' d'acqua", `Circa ${ml} ml. Obiettivo di oggi: ${String(c.water.goal).replace(".", ",")} L.`, "gymtrack-water")
      );
    }
    if (c.meals.on)
      mealReminders(c).forEach((r) =>
        fire(r.id, [r.min], () => {
          var it = r.items.filter((x) => !x.libero);
          notify(
            `🍽 ${r.nome} alle ${r.ora}`,
            it.length ? it.map((x) => x.n).join(", ") : "Pasto libero: goditelo con moderazione.",
            "gymtrack-meal-" + r.nome
          );
        })
      );
    if (c.train.on)
      fire("t", [hm(c.train.at)], () => {
        var msg = trainMsg();
        if (msg) notify("💪 Allenamento", msg, "gymtrack-train");
      });
    if (changed) saveApp();
  } catch (e) {}
}
function notifStart() {
  setInterval(notifTick, 30000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) notifTick();
  });
  notifTick();
  /* tiene aggiornato «Adesso / Prossimo» nel piano della dieta mentre l'app è aperta */
  setInterval(() => {
    var ae = document.activeElement;
    if (document.hidden || sheet || !/^(home|dietad)$/.test(view.name) || (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName))) return;
    var y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }, 60000);
}

/* ---- interfaccia ---- */
function notifPerm() {
  var ns = notifState();
  if (ns === "granted") return "";
  return `<p class="hint" style="margin:0 0 8px">${
    ns === "no"
      ? "Notifiche non supportate in questo browser."
      : ns === "denied"
        ? "Notifiche bloccate: riattivale dalle impostazioni del telefono per questo sito."
        : "Per ricevere i promemoria devi attivare le notifiche."
  }</p>${ns === "default" ? '<button class="btn small" data-act="notif-on" style="margin-bottom:10px">Attiva notifiche</button>' : ""}`;
}
const nChip = (k, on, label) =>
  `<button class="eq" data-act="n-tog" data-k="${k}" aria-pressed="${on}"><span>${on ? "✓" : "+"}</span> ${label}</button>`;
const nOpts = (list, cur) => list.map((o) => `<option value="${o[0]}"${Number(o[0]) === Number(cur) ? " selected" : ""}>${o[1]}</option>`).join("");
function notifDietCard() {
  var c = notifCfg(),
    w = c.water,
    ws = waterSlots(w),
    h = `<div class="card"><div class="meta" style="margin:0 0 6px;font-weight:600">Promemoria</div>${notifPerm()}<div class="eqs" style="margin-bottom:10px">${nChip("water", w.on, "Bere acqua")}</div>`;
  if (w.on)
    h += `<div class="grid2"><div class="field"><label for="n-goal">Litri al giorno</label><input id="n-goal" data-n="water.goal" inputmode="decimal" value="${String(w.goal).replace(".", ",")}"></div>
      <div class="field"><label for="n-every">Ogni</label><select id="n-every" data-n="water.every">${nOpts(
        [
          [30, "30 minuti"],
          [45, "45 minuti"],
          [60, "1 ora"],
          [90, "1 ora e mezza"],
          [120, "2 ore"],
          [180, "3 ore"]
        ],
        w.every
      )}</select></div></div>
      <div class="grid2"><div class="field"><label for="n-from">Dalle</label><input id="n-from" type="time" data-n="water.from" value="${w.from}"></div>
      <div class="field"><label for="n-to">Alle</label><input id="n-to" type="time" data-n="water.to" value="${w.to}"></div></div>
      <p class="hint" style="margin:0 0 10px">${ws.length} promemoria al giorno, circa ${Math.max(50, Math.round((w.goal * 1000) / ws.length / 50) * 50)} ml ciascuno.</p>`;
  h += `<div class="eqs" style="margin-bottom:10px">${nChip("meals", c.meals.on, "Pasti e spuntini")}</div>`;
  if (c.meals.on) {
    var ds = curDiets();
    if (!ds.length) h += '<p class="hint" style="margin:0 0 10px">Serve una dieta corrente: i promemoria seguono i suoi pasti e i loro orari.</p>';
    else {
      var seen = {},
        chips = "";
      ds.forEach((d) =>
        d.pasti
          .filter((m) => m.on)
          .forEach((m) => {
            if (seen[m.nome]) return;
            seen[m.nome] = 1;
            var on = c.meals.names ? !!c.meals.names[m.nome] : isSnack(m.nome);
            chips += `<button class="eq" data-act="n-meal" data-m="${esc(m.nome)}" aria-pressed="${on}"><span>${on ? "✓" : "+"}</span> ${esc(m.nome)} · ${esc(mealTime(m))}</button>`;
          })
      );
      h += `<div class="meta" style="margin:0 0 6px">Quali pasti ricordare (di default gli spuntini e le merende)</div><div class="eqs" style="margin-bottom:10px">${chips}</div>
        <div class="field"><label for="n-before">Avvisami</label><select id="n-before" data-n="meals.before">${nOpts(
          [
            [0, "all'orario del pasto"],
            [5, "5 minuti prima"],
            [10, "10 minuti prima"],
            [15, "15 minuti prima"],
            [30, "30 minuti prima"]
          ],
          c.meals.before
        )}</select></div>`;
    }
  }
  return (
    h +
    '<p class="hint" style="margin:0">Arrivano solo se l\'app è aperta o appena passata in secondo piano: non c\'è un server che li invii.</p></div>'
  );
}
function notifTrainCard() {
  var t = notifCfg().train;
  return `<div class="meta" style="margin:14px 0 6px;font-weight:600">Allenamenti saltati</div><div class="eqs" style="margin-bottom:8px">${nChip("train", t.on, "Avvisami se sono indietro")}</div>${
    t.on
      ? `<div class="field"><label for="n-at">Controlla ogni giorno alle</label><input id="n-at" type="time" data-n="train.at" value="${t.at}"></div><p class="hint" style="margin:0">Ti avviso se in questa settimana hai fatto meno allenamenti del previsto, o se sono passati 3 giorni senza allenarti. Non ti disturbo se oggi ti sei già allenato.</p>`
      : ""
  }`;
}
ACT["n-tog"] = function (d) {
  var o = notifCfg()[d.k];
  o.on = !o.on;
  if (o.on) askNotif();
  saveApp();
  render();
};
ACT["n-meal"] = function (d) {
  var c = notifCfg();
  if (!c.meals.names) {
    c.meals.names = {};
    curDiets().forEach((x) => x.pasti.forEach((m) => (c.meals.names[m.nome] = isSnack(m.nome))));
  }
  c.meals.names[d.m] = !c.meals.names[d.m];
  c.sent = {};
  saveApp();
  render();
};
HOOKS.change.push(function (t) {
  if (t.dataset.n === undefined) return;
  var p = t.dataset.n.split("."),
    c = notifCfg(),
    v = t.value;
  if (p[1] === "goal") v = clamp(num(v) || 2.5, 0.5, 8);
  else if (p[1] === "every" || p[1] === "before") v = Number(v);
  else if (!/^\d{1,2}:\d{2}$/.test(v)) return true;
  c[p[0]][p[1]] = v;
  c.sent = {};
  saveApp();
  render();
  return true;
});

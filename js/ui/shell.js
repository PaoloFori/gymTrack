/* Guscio dell'app: intestazioni, barra in basso, navigazione con scorrimento, finestre e render(). */
/* ---------- viste ---------- */
function hdr(title, sub, back, extra) {
  return (
    '<div class="hdr">' +
    (back ? '<button class="back" data-act="back" aria-label="Indietro">‹</button>' : "") +
    '<div class="t"><h1>' +
    esc(title) +
    "</h1>" +
    (sub ? '<div class="sub">' + esc(sub) + "</div>" : "") +
    "</div>" +
    (extra || "") +
    "</div>"
  );
}
function sgn(n) {
  return (n > 0 ? "+" : "") + n;
}
var TABS = [
  { v: "home", t: "Home", i: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>' },
  { v: "sessioni", t: "Sessioni", i: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>' },
  {
    v: "dieta",
    t: "Dieta",
    i: '<path d="M12 7c-2-2-7-1-7 5 0 4 3 8 5 8 1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 5-4 5-8 0-6-5-7-7-5z"/><path d="M12 7c0-2 1-3 3-4"/>'
  },
  { v: "analisi", t: "Analisi", i: '<path d="M5 20V10M12 20V4M19 20v-7"/>' }
];
/* A quale scheda della barra appartiene la vista corrente. */
function tabOf() {
  var n = view.name,
    fromTab = TABS.some(function (t) {
      return t.v === view.from;
    });
  if (n === "sess" || n === "dietad") return fromTab ? view.from : n === "sess" ? "sessioni" : "dieta";
  if (n === "profilo") return "home";
  if (n === "corrente") return view.from === "home" ? "home" : "sessioni";
  if (n === "scheda" || n === "workout" || n === "wex") return "sessioni";
  return TABS.some(function (t) {
    return t.v === n;
  })
    ? n
    : "home";
}
function barHTML() {
  if (view.name === "workout")
    return (
      '<div class="wk"><div id="restbox"></div><div class="grid2"><button class="btn" data-act="cancel-workout">' +
      (armed === "cw" ? "Tocca ancora: annulla" : "Annulla") +
      '</button><button class="btn primary" data-act="finish">' +
      (armed === "ff" ? "Tocca ancora: salva" : "Fine scheda") +
      "</button></div></div>"
    );
  if (view.name === "wex") {
    var xe = session && session.ex[view.i],
      ad =
        xe &&
        xe.sets.every(function (q) {
          return q.done;
        });
    return (
      '<div class="wk"><div id="restbox"></div><button class="btn primary wide" data-act="ex-done"' +
      (ad ? "" : " disabled") +
      ">" +
      (ad ? "Fatto" : "Fatto (completa tutte le serie)") +
      "</button></div>"
    );
  }
  var cur = tabOf();
  return (
    '<nav class="tabs" aria-label="Principale">' +
    TABS.map(function (t) {
      return (
        '<button class="tab" data-act="tab" data-v="' +
        t.v +
        '"' +
        (cur === t.v ? ' aria-current="page"' : "") +
        '><span class="pl"><svg viewBox="0 0 24 24">' +
        t.i +
        "</svg></span>" +
        t.t +
        "</button>"
      );
    }).join("") +
    "</nav>"
  );
}
/* Cambio scheda con scorrimento: la nuova pagina entra dal lato verso cui si va. */
function go(v) {
  var a = TABS.findIndex(function (t) {
      return t.v === tabOf();
    }),
    b = TABS.findIndex(function (t) {
      return t.v === v;
    }),
    dir = b > a ? "slL" : b < a ? "slR" : "";
  view = { name: v };
  edit = false;
  selMode = false;
  selIds = [];
  armed = "";
  render();
  window.scrollTo(0, 0);
  if (dir) {
    var el = document.getElementById("app");
    el.classList.remove("slL", "slR");
    void el.offsetWidth;
    el.classList.add(dir);
    setTimeout(function () {
      el.classList.remove(dir);
    }, 300);
  }
}
(function () {
  var x0 = 0,
    y0 = 0,
    t0 = 0,
    ok = false;
  function hscroll(el) {
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 4 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true;
    }
    return false;
  }
  document.addEventListener(
    "touchstart",
    function (e) {
      ok = false;
      if (
        e.touches.length !== 1 ||
        sheet ||
        !TABS.some(function (t) {
          return t.v === view.name;
        })
      )
        return;
      if (e.target.closest && (e.target.closest("input,textarea,select,.sheet,.chart") || hscroll(e.target))) return;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      t0 = Date.now();
      ok = true;
    },
    { passive: true }
  );
  document.addEventListener(
    "touchend",
    function (e) {
      if (!ok) return;
      ok = false;
      var t = e.changedTouches[0],
        dx = t.clientX - x0,
        dy = t.clientY - y0;
      if (Date.now() - t0 > 800 || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
      var i =
        TABS.findIndex(function (q) {
          return q.v === view.name;
        }) + (dx < 0 ? 1 : -1);
      if (i >= 0 && i < TABS.length) go(TABS[i].v);
    },
    { passive: true }
  );
})();
function sheetShell(t, body, foot) {
  return (
    '<div class="scrim" data-act="close-sheet-bg"><div class="sheet" role="dialog" aria-modal="true"><h2>' +
    t +
    "</h2>" +
    body +
    foot +
    "</div></div>"
  );
}
function okFoot(label) {
  return (
    '<div class="grid2"><button class="btn" data-act="close-sheet">Annulla</button><button class="btn primary" data-act="save-sheet">' +
    (label || "Salva") +
    "</button></div>"
  );
}
function render() {
  try {
    var app = document.getElementById("app");
    app.innerHTML = (VIEWS[view.name] || vHome)();
    document.querySelector("#bar .in").innerHTML = barHTML();
    var oldSh = document.querySelector(".sheet"),
      keep = oldSh ? oldSh.scrollTop : 0;
    document.getElementById("sheetwrap").innerHTML = sheetHTML();
    var newSh = document.querySelector(".sheet");
    if (newSh && oldSh) newSh.scrollTop = keep;
    if (sheet && !oldSh) {
      var f = document.querySelector(".sheet [data-focus]");
      if (f) f.focus();
    }
    updateTimer();
  } catch (e) {
    showErr(e && e.message ? e.message : String(e));
  }
}

/* Finestra modale aperta (se c'è): si cerca in SHEETS in base a sheet.kind. */
function sheetHTML() {
  var def = sheet && SHEETS[sheet.kind];
  if (!def || (def.session && !attiva())) return "";
  return def.html(sheet);
}

/* Viste della dieta: lista, dettaglio (piano e spesa), riquadro del giorno. */
/* ---- viste ---- */
function dayHTML(plan, i) {
  if (!plan[i] || !plan[i].length) return '<p class="meta">Niente in programma.</p>';
  return plan[i]
    .map(function (m) {
      return (
        '<div class="meal"><div class="mt">' +
        esc(m.t) +
        "</div>" +
        m.v
          .map(function (it) {
            return (
              '<div class="it"><span>' +
              esc(it.n) +
              "</span><span>" +
              esc(fmtQ(it.qt, it.u)) +
              "</span></div>" +
              (it.nota ? '<div class="hint" style="margin:0 0 4px;color:var(--accent)">' + esc(it.nota) + "</div>" : "")
            );
          })
          .join("") +
        "</div>"
      );
    })
    .join("");
}
function dietRow(d, sel) {
  var ss = dietSessions(d),
    sub =
      (d.periodo && d.periodo.dal ? fd(Date.parse(d.periodo.dal)) + " – " + fd(Date.parse(d.periodo.al)) + " · " : "") +
      mealCount(d) +
      " pasti" +
      (ss.length
        ? " · " +
          ss
            .map(function (x) {
              return x.nome;
            })
            .join(", ")
        : " · non collegata");
  return (
    '<button class="xrow' +
    (sel ? " selrow" : "") +
    '" data-act="' +
    (sel ? "sel-diet" : "open-diet") +
    '" data-id="' +
    d.id +
    '"' +
    (sel ? ' aria-pressed="' + (selIds.indexOf(d.id) >= 0) + '"' : "") +
    ">" +
    (sel ? '<span class="cb">✓</span>' : "") +
    '<span class="grow"><b class="xn">' +
    esc(d.nome) +
    '</b><span class="meta">' +
    esc(sub) +
    "</span></span>" +
    (sel ? "" : '<span class="chev2">›</span>') +
    "</button>"
  );
}
function vDieta() {
  var c = curDiet(),
    past = pastDiets(),
    a = attiva(),
    h = hdr("Dieta", "Corrente e archivio", false) + '<div class="stack">';
  h += '<div class="meta" style="margin:0;font-weight:600">Dieta corrente</div>';
  if (c) {
    h +=
      '<button class="curcard" data-act="open-diet" data-id="' +
      c.id +
      '"><span class="ico">' +
      TABS[2].i.replace(/^/, '<svg viewBox="0 0 24 24">') +
      '</svg></span><span class="grow"><b class="xn">' +
      esc(c.nome) +
      '</b><span class="meta">' +
      (a ? "Collegata a " + esc(a.nome) : "") +
      " · " +
      mealCount(c) +
      ' pasti</span></span><span class="chev2">›</span></button>';
  } else
    h +=
      '<div class="card"><p class="meta" style="margin:0">' +
      (a ? "Nessuna dieta collegata alla sessione in corso. Collegane una dalla Home, oppure creane una nuova." : "Nessuna sessione in corso.") +
      "</p></div>";
  h += '<button class="btn primary wide" data-act="d-new">+ Nuova dieta (JSON, IA o copia)</button>';
  if (past.length) {
    h +=
      '<div class="card"><div class="row" style="margin-bottom:8px"><div class="meta grow" style="margin:0;font-weight:600">Diete passate</div><button class="btn small" data-act="sel-mode">' +
      (selMode ? "Annulla" : "Seleziona") +
      '</button></div><div class="stack" style="gap:8px">' +
      past
        .map(function (d) {
          return dietRow(d, selMode);
        })
        .join("") +
      "</div>";
    if (selMode)
      h +=
        '<button class="btn danger wide" style="margin-top:12px" data-act="del-diete"' +
        (selIds.length ? "" : " disabled") +
        ">" +
        (armed === "dds"
          ? "Tocca ancora: elimina " + selIds.length
          : selIds.length
            ? "Elimina " + selIds.length + (selIds.length === 1 ? " dieta" : " diete")
            : "Scegli le diete da eliminare") +
        "</button>";
    h += "</div>";
  } else if (!c) h += '<p class="hint">Qui compariranno le diete passate.</p>';
  return h + "</div>";
}
function vDietaD() {
  var d = dietById(view.id);
  if (!d) {
    view = { name: "dieta" };
    return vDieta();
  }
  var ti = todayI(),
    ss = dietSessions(d),
    h =
      hdr(
        d.nome,
        (dietActive(d) ? "Corrente" : "Passata") +
          (ss.length
            ? " · " +
              ss
                .map(function (x) {
                  return x.nome;
                })
                .join(", ")
            : " · non collegata"),
        true
      ) + '<div class="stack">';
  h +=
    '<div class="seg"><button data-act="d-tab" data-t="piano" aria-pressed="' +
    (dTab === "piano") +
    '">Piano</button><button data-act="d-tab" data-t="spesa" aria-pressed="' +
    (dTab === "spesa") +
    '">Spesa</button></div>';
  if (dTab === "piano") {
    var open = dOpen === null ? ti : dOpen;
    DAYS.forEach(function (n, i) {
      h +=
        '<div class="card"><button class="dday" data-act="d-day" data-i="' +
        i +
        '" aria-expanded="' +
        (open === i) +
        '"><h3>' +
        n +
        "</h3>" +
        (i === ti ? '<span class="badge today-b">Oggi</span>' : "") +
        '<span class="chev">›</span></button>' +
        (open === i ? dayHTML(d.plan, i) : "") +
        "</div>";
    });
    h += '<p class="hint">Grammature a crudo, come da piano.</p>';
  } else {
    var done = d.spesa.filter(function (x) {
        return x.preso;
      }).length,
      groups = {},
      order = [];
    d.spesa.forEach(function (x) {
      var g = DC[x.cat].g;
      if (!groups[g]) {
        groups[g] = [];
        order.push(g);
      }
      groups[g].push(x);
    });
    h +=
      '<div class="card"><div class="row"><b class="grow">Lista della spesa</b><span class="meta" style="margin:0;font-weight:600">' +
      done +
      " / " +
      d.spesa.length +
      ' presi</span></div><div class="prog"><i style="width:' +
      (d.spesa.length ? ((100 * done) / d.spesa.length).toFixed(0) : 0) +
      '%"></i></div><p class="hint">Quantità per una settimana, a crudo.</p></div>';
    order.forEach(function (g) {
      h +=
        '<div class="card"><h3>' +
        esc(g) +
        "</h3>" +
        groups[g]
          .map(function (x) {
            return (
              '<button class="shop' +
              (x.preso ? " on" : "") +
              '" data-act="d-tick" data-k="' +
              esc(x.k) +
              '" aria-pressed="' +
              x.preso +
              '"><span class="bx">✓</span><span class="grow"><span class="sn2">' +
              esc(x.n) +
              "</span>" +
              '</span><span class="qt">' +
              esc(fmtQ(x.q, x.u)) +
              "</span></button>"
            );
          })
          .join("") +
        "</div>";
    });
    if (done) h += '<button class="btn wide" data-act="d-reset">Azzera le spunte</button>';
  }
  var ck = d.cook || { mode: "due" };
  h +=
    '<div class="card"><div class="field"><label for="d-titolo">Titolo della dieta</label><input id="d-titolo" data-dtitle="' +
    d.id +
    '" value="' +
    esc(d.nome) +
    '" autocomplete="off"></div><p class="meta" style="margin:0 0 10px">Cottura: ' +
    (ck.mode === "uno"
      ? ck.dir === "pranzo"
        ? "una volta al giorno (a pranzo cucini anche la cena)"
        : "una volta al giorno (la sera cucini anche il pranzo di domani)"
      : "due volte al giorno") +
    '. Per collegare la dieta a una sessione usa la Home.</p><div class="grid2"><button class="btn" data-act="d-edit">Modifica alimenti</button><button class="btn" data-act="d-regen">Rigenera piano</button></div></div>';
  h += '<button class="btn danger wide" data-act="d-del">' + (armed === "dd" ? "Tocca ancora per eliminare" : "Elimina dieta") + "</button>";
  return h + "</div>";
}
function dietHome(a) {
  var d = dietOf(a);
  if (!d) return "";
  return (
    '<div class="card"><div class="row"><h3 class="grow">Dieta di oggi</h3><span class="badge">' +
    DAYS[todayI()] +
    "</span></div>" +
    dayHTML(d.plan, todayI()) +
    '<button class="btn small wide" style="margin-top:8px" data-act="open-diet" data-id="' +
    d.id +
    '">Apri piano e spesa</button></div>'
  );
}

ACT["d-tab"] = function (d) {
  dTab = d.t;
  render();
};
ACT["d-day"] = function (d) {
  var di = Number(d.i),
    dop = dOpen === null ? todayI() : dOpen;
  dOpen = dop === di ? -1 : di;
  render();
};
ACT["d-tick"] = function (d) {
  var dt = dietById(view.id),
    it0 =
      dt &&
      dt.spesa.find(function (x) {
        return x.k === d.k;
      });
  if (it0) {
    it0.preso = !it0.preso;
    var yy = window.scrollY;
    saveApp();
    render();
    window.scrollTo(0, yy);
  }
};
ACT["d-reset"] = function (d) {
  dietById(view.id).spesa.forEach(function (x) {
    x.preso = false;
  });
  saveApp();
  render();
};
ACT["d-regen"] = function (d) {
  var dr = dietById(view.id);
  dr.seed = (dr.seed || 0) + 1;
  dr.plan = makePlan(dr, dr.seed);
  dr.spesa = makeSpesa(dr, dr.spesa);
  saveApp();
  render();
  toast("Piano rigenerato");
};
ACT["d-edit"] = function (d) {
  var de = dietById(view.id);
  sheet = {
    kind: "dieta",
    step: "pasti",
    editId: de.id,
    nome: de.nome,
    pasti: clone(de.pasti),
    regole: de.regole,
    periodo: de.periodo,
    cook: de.cook ? de.cook.mode : "due",
    dir: (de.cook && de.cook.dir) || "sera",
    err: ""
  };
  render();
};
ACT["d-del"] = function (d) {
  if (!confirmed("dd")) return;
  var dx0 = dietById(view.id);
  S.diete = S.diete.filter(function (x) {
    return x.id !== dx0.id;
  });
  S.sessioni.forEach(function (x) {
    if (x.dietId === dx0.id) x.dietId = "";
  });
  view = { name: view.from === "home" ? "home" : "dieta" };
  saveApp();
  render();
  toast("Dieta eliminata");
};
ACT["open-diet"] = function (d) {
  var fromT2 = TABS.some(function (t) {
    return t.v === view.name;
  })
    ? view.name
    : "dieta";
  dCur = d.id;
  dTab = "piano";
  dOpen = null;
  view = { name: "dietad", id: d.id, from: fromT2 };
  selMode = false;
  selIds = [];
  render();
  window.scrollTo(0, 0);
};
ACT["link-diet"] = function (d) {
  var cur = attiva(),
    s = cur && getScheda(cur, d.id);
  if (cur) {
    cur.dietId = d.id || "";
    saveApp();
    render();
    toast(d.id ? "Dieta collegata alla sessione" : "Dieta scollegata");
  }
};
ACT["sel-diet"] = function (d) {
  var sdx = selIds.indexOf(d.id);
  if (sdx >= 0) selIds.splice(sdx, 1);
  else selIds.push(d.id);
  armed = "";
  render();
};
ACT["del-diete"] = function (d) {
  if (!selIds.length) return;
  if (!confirmed("dds")) return;
  var gd = selIds.slice();
  S.diete = S.diete.filter(function (x) {
    return gd.indexOf(x.id) < 0;
  });
  S.sessioni.forEach(function (x) {
    if (gd.indexOf(x.dietId) >= 0) x.dietId = "";
  });
  selMode = false;
  selIds = [];
  saveApp();
  render();
  toast(gd.length + (gd.length === 1 ? " dieta eliminata" : " diete eliminate"));
};

HOOKS.change.push(function (t) {
  if (t.dataset.dtitle !== undefined) {
    var d = dietById(t.dataset.dtitle);
    if (d && t.value.trim()) {
      d.nome = t.value.trim();
      saveApp();
      render();
    }
    return true;
  }
});

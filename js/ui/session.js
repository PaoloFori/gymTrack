/* Dettaglio della sessione in corso e delle sessioni passate, schede ed esercizi. */
function personaggio(a, g) {
  var lv = livello(g, a.obiettivo),
    nx = nextLevel(g.P, a.obiettivo),
    now = Date.now(),
    ws = wsOf(now),
    days = [0, 0, 0, 0, 0, 0, 0],
    T = stimaSettimane(a),
    k = Math.max(1, Math.ceil(T / g.D));
  LOG.forEach(function (l) {
    if (l.sid === a.id && l.ts >= ws) {
      var i = Math.floor((sod(l.ts) - ws) / 864e5);
      if (i >= 0 && i < 7) days[i] = 1;
    }
  });
  var todayI = Math.round((sod(now) - ws) / 864e5),
    left = Math.max(0, Math.ceil((g.end - now) / 864e5));
  var h =
    '<div class="card"><div class="avstage">' +
    avatarSVG(a.tipo, { p: g.p, fat: g.fat, aura: g.aura, anim: dietOf(a) ? "diet" : "train" }, a) +
    "</div>";
  h +=
    '<div class="row" style="margin-top:12px"><div class="lvl grow">' +
    lv +
    '</div><div class="meta" style="font-weight:600;font-variant-numeric:tabular-nums">Forma ' +
    Math.round(g.P) +
    " / 100</div></div>";
  h +=
    '<div class="prog"><i style="width:' +
    g.P.toFixed(1) +
    '%"></i></div><p class="meta">' +
    (g.fat > 0.3
      ? "Hai saltato troppi allenamenti: l'avatar è ingrassato."
      : nx
        ? "Prossimo livello a " + nx.m + ": " + nx.n
        : "Livello massimo raggiunto") +
    "</p>";
  h +=
    '<div class="row" style="margin-top:10px"><span class="meta" style="font-weight:600;margin:0">Aura</span><span class="auradots">' +
    [0, 1, 2, 3, 4, 5, 6, 7]
      .map(function (i) {
        return '<i class="' + (i < g.aura ? "on" : "") + '"></i>';
      })
      .join("") +
    '</span><span class="meta grow" style="margin:0">' +
    (g.aura ? g.aura + (g.aura === 1 ? " boost" : " boost") : "nessuna") +
    "</span></div>";
  if (!g.over) {
    h +=
      '<div class="week">' +
      ["L", "M", "M", "G", "V", "S", "D"]
        .map(function (d, i) {
          return '<div class="' + (days[i] ? "on " : "") + (i === todayI ? "today" : "") + '"><i></i><div>' + d + "</div></div>";
        })
        .join("") +
      "</div>";
    var gn = 2 * g.thisC - g.thisT;
    h +=
      '<p class="meta" style="margin-top:10px">Questa settimana: <b>' +
      g.thisC +
      " / " +
      g.thisT +
      "</b> allenamenti. " +
      (g.pend
        ? "Settimana completa: boost d'aura ottenuto."
        : "Se la settimana finisse ora: " +
          sgn(gn) +
          (gn < 0 ? " (ingrassi)" : "") +
          ". Completane " +
          (g.thisT - g.thisC) +
          " per arrivare a " +
          sgn(g.thisT) +
          " e al boost d'aura.") +
      "</p>";
  }
  if (!g.over && g.thisT - g.thisC > 0 && todayI >= 3)
    h +=
      '<div class="banner" style="margin-top:8px"><b>Sei un po\' indietro</b>Ti ' +
      (g.thisT - g.thisC === 1 ? "manca 1 allenamento" : "mancano " + (g.thisT - g.thisC) + " allenamenti") +
      " e " +
      (7 - todayI === 1 ? "resta solo oggi" : "restano " + (7 - todayI) + " giorni, oggi compreso") +
      ".</div>";
  if (g.lastW)
    h +=
      '<p class="meta">Settimana scorsa: ' +
      g.lastW.c +
      " / " +
      g.lastW.t +
      " → " +
      sgn(g.lastW.g) +
      (g.lastW.perfect ? " e boost d'aura" : "") +
      "</p>";
  h +=
    '<p class="meta">' +
    g.tot +
    (g.tot === 1 ? " allenamento" : " allenamenti") +
    " in sessione · " +
    (g.over ? "terminata il " + fd(g.end) : "finisce il " + fd(g.end) + ", mancano " + left + " giorni") +
    "</p>";
  h += '<p class="meta">' + ((OBJP[a.obiettivo] || {}).txt || "") + "</p>";
  h +=
    '<p class="meta">Obiettivo «' +
    esc(a.obiettivo) +
    "» stimato in circa " +
    Math.round(T) +
    " settimane: " +
    (k === 1 ? "basta una sessione." : "circa " + k + " sessioni da " + a.mesi + " mesi.") +
    "</p>";
  return h + "</div>";
}
function logHTML(l) {
  var vol = 0;
  (l.ex || []).forEach(function (e) {
    vol += exVol(e.sets);
  });
  var h =
    '<details class="log"><summary><div class="grow"><div style="font-weight:600">' +
    esc(l.schedaNome) +
    '</div><div class="meta">' +
    fdl(l.ts) +
    (l.durMin ? " · " + l.durMin + " min" : "") +
    " · " +
    Math.round(vol) +
    " kg" +
    (l.fat ? " · fatica " + l.fat + "/5" : "") +
    (l.prs && l.prs.length ? " · 🏆 " + l.prs.length : "") +
    '</div></div><span class="meta">▾</span></summary><div class="lx">';
  (l.ex || []).forEach(function (e) {
    h +=
      "<div><span>" +
      esc(e.nome) +
      "</span><span>" +
      e.sets
        .map(function (x) {
          return (x.w ? "R " : "") + kgf(num(x.kg)) + "×" + x.reps;
        })
        .join(" · ") +
      "</span></div>";
  });
  if (l.nota) h += "<div><i>" + esc(l.nota) + "</i></div>";
  return (
    h +
    '<button class="btn danger small" style="margin-top:8px" data-act="del-log" data-id="' +
    l.id +
    '">' +
    (armed === "l" + l.id ? "Tocca ancora per eliminare" : "Elimina allenamento") +
    "</button></div></details>"
  );
}
function exLogs(ex) {
  var o = [];
  LOG.forEach(function (l) {
    (l.ex || []).forEach(function (e) {
      if (sameEx(e, ex)) o.push({ ts: l.ts, sid: l.sid, sets: e.sets });
    });
  });
  return o;
}
function vSess() {
  var x = S.sessioni.find(function (q) {
    return q.id === view.id;
  });
  if (!x) {
    view = { name: "sessioni" };
    return vSessioni();
  }
  var st,
    label,
    g = null,
    F = x.finale || {};
  if (x.chiusa) {
    st = { p: F.p || 0, fat: F.fat || 0, aura: F.aura || 0 };
    label = livello({ P: F.P || 0, fat: F.fat || 0 }, x.obiettivo);
  } else {
    g = progress(x);
    st = { p: g.p, fat: g.fat, aura: g.aura };
    label = livello(g, x.obiettivo);
  }
  var logs = LOG.filter(function (l) {
      return l.sid === x.id;
    }),
    vol = 0;
  logs.forEach(function (l) {
    (l.ex || []).forEach(function (e) {
      vol += exVol(e.sets);
    });
  });
  var h =
    hdr(x.nome, x.obiettivo + " · " + fd(x.start) + " – " + fd(x.chiuseTs || endOf(x)) + " · " + x.giorni + " a settimana", true) +
    '<div class="stack"><div class="card"><div class="avstage">' +
    avatarSVG(x.tipo, st, x) +
    "</div>";
  h +=
    '<div class="row" style="margin-top:12px"><div class="lvl grow">' +
    esc(label) +
    '</div><div class="meta" style="font-weight:600">' +
    AV[x.tipo] +
    " · forma " +
    Math.round(x.chiusa ? F.P || 0 : g.P) +
    '</div></div><div class="row" style="margin-top:8px"><span class="meta" style="font-weight:600;margin:0">Aura</span><span class="auradots">' +
    [0, 1, 2, 3, 4, 5, 6, 7]
      .map(function (i) {
        return '<i class="' + (i < st.aura ? "on" : "") + '"></i>';
      })
      .join("") +
    '</span><span class="meta grow" style="margin:0">' +
    (st.aura || "nessuna") +
    '</span></div><p class="meta">' +
    ((OBJP[x.obiettivo] || {}).txt || "") +
    "</p></div>";
  h +=
    '<div class="grid3"><div class="card stat"><b>' +
    Math.max(logs.length, x.fatti || 0) +
    '</b><span>allenamenti</span></div><div class="card stat"><b>' +
    (vol / 1000).toFixed(1).replace(".", ",") +
    '</b><span>t sollevate</span></div><div class="card stat"><b>' +
    x.schede.length +
    "</b><span>schede</span></div></div>";
  if (!x.chiusa) h += '<button class="btn primary wide" data-act="open-sess" data-id="' + x.id + '">Vai alla sessione in corso</button>';
  if (x.schede.length) {
    h += '<div class="meta" style="margin:6px 0 0;font-weight:600">Schede</div>';
    x.schede.forEach(function (sc) {
      h += '<div class="card"><h3>' + esc(sc.nome) + "</h3>";
      sc.esercizi.forEach(function (e) {
        var le = lastEntry(e.id, e.nome);
        h +=
          '<div class="ex">' +
          (e.gif ? gifImg(e.gif, "sm") : "") +
          '<div class="grow"><div class="n">' +
          esc(e.nome) +
          '</div><div class="meta">' +
          e.serie +
          " × " +
          esc(e.reps) +
          " · rec " +
          fmtRec(e.rec) +
          (e.sup ? " · superset ↓" : "") +
          '</div></div><button class="ib" data-act="graf" data-eid="' +
          esc(e.id) +
          '" data-n="' +
          esc(e.nome) +
          '" aria-label="Storico di ' +
          esc(e.nome) +
          '">📈</button></div>';
      });
      h += "</div>";
    });
  }
  h += '<div class="card"><div class="meta" style="margin:0 0 6px;font-weight:600">Allenamenti della sessione</div>';
  if (!logs.length) h += '<p class="meta">Nessun allenamento registrato in questa sessione.</p>';
  logs.slice(0, 60).forEach(function (l) {
    h += logHTML(l);
  });
  return h + "</div></div>";
}
function vCorrente() {
  var a = attiva(),
    h;
  if (!a) {
    view = { name: "sessioni" };
    return vSessioni();
  }
  var g = progress(a),
    left = Math.ceil((g.end - Date.now()) / 864e5);
  h = hdr(a.nome, fd(a.start) + " – " + fd(g.end) + " · " + a.giorni + " allenamenti a settimana", true) + '<div class="stack">' + backupBanner();
  if (g.over)
    h +=
      '<div class="banner exp"><b>Sessione terminata</b>Forma finale ' +
      Math.round(g.P) +
      '. Chiudila per salvare l\'avatar nel tuo profilo e iniziare una nuova sessione.<br><button class="btn primary small" style="margin-top:8px" data-act="close-sess">Chiudi sessione</button></div>';
  else if (left <= 14)
    h +=
      '<div class="banner"><b>La sessione finisce tra ' +
      left +
      " giorni</b>Intanto prepara la prossima: potrai farne creare le schede all'IA.</div>";
  h += personaggio(a, g) + dietHome(a);
  if (!a.schede.length) {
    h +=
      '<div class="card"><h3>Aggiungi le schede</h3><p class="meta" style="margin:6px 0 12px">Servono ' +
      a.giorni +
      ' schede, una per ogni allenamento della settimana. Falle creare all\'IA oppure inserisci quelle che hai già.</p><div class="grid2"><button class="btn primary" data-act="new-ai">Genera con IA</button><button class="btn" data-act="new-scheda">Inserisci le mie</button></div></div>';
  } else {
    h += '<div class="meta" style="margin:6px 0 0;font-weight:600">Schede della sessione</div>';
    if (a.schede.length !== Number(a.giorni))
      h +=
        '<p class="hint">La sessione prevede ' +
        a.giorni +
        " allenamenti a settimana, hai " +
        a.schede.length +
        (a.schede.length === 1 ? " scheda." : " schede.") +
        "</p>";
    a.schede.forEach(function (s) {
      var l = lastSchedaUse(s.id);
      h +=
        '<div class="card"><div class="row"><button class="plain" data-act="open-scheda" data-id="' +
        s.id +
        '"><h3>' +
        esc(s.nome) +
        (s.ai ? ' <span class="badge">IA</span>' : "") +
        '</h3><p class="meta">' +
        s.esercizi.length +
        " esercizi · " +
        (l ? "ultimo: " + rel(l.ts) : "mai fatta") +
        "</p></button>" +
        (s.esercizi.length && !g.over ? '<button class="btn primary small" data-act="start" data-id="' + s.id + '">Inizia</button>' : "") +
        "</div></div>";
    });
    h +=
      '<div class="grid2"><button class="btn dashed" data-act="new-scheda">+ Aggiungi scheda</button><button class="btn" data-act="new-ai">Genera con IA</button></div>';
  }
  if (!g.over)
    h +=
      '<button class="btn danger wide" data-act="close-sess">' +
      (armed === "cs" ? "Tocca ancora per chiudere" : "Chiudi sessione in anticipo") +
      "</button>";
  return h + "</div>";
}
function vScheda() {
  var a = attiva(),
    s = getScheda(a, view.id);
  if (!s) {
    view = { name: "corrente" };
    return vCorrente();
  }
  var h = hdr(
    s.nome,
    s.esercizi.length + " esercizi" + (s.note ? " · " + s.note : ""),
    true,
    '<button class="btn small" data-act="toggle-edit">' + (edit ? "Fine" : "Modifica") + "</button>"
  );
  h += '<div class="stack"><div class="card">';
  if (!s.esercizi.length) h += '<p class="meta">Nessun esercizio.</p>';
  s.esercizi.forEach(function (e) {
    var t = topSet(lastOf(e.id, e.nome));
    h +=
      '<div class="ex">' +
      (e.gif ? gifImg(e.gif, "sm") : "") +
      '<div class="grow"><div class="n">' +
      esc(e.nome) +
      '</div><div class="meta">' +
      e.serie +
      " × " +
      esc(e.reps) +
      " · rec " +
      fmtRec(e.rec) +
      (e.gruppo ? " · " + esc(e.gruppo) : "") +
      (e.riscal ? " · " + e.riscal + " risc." : "") +
      (e.sup ? " · superset ↓" : "") +
      "</div>" +
      (function () {
        var le = lastEntry(e.id, e.nome);
        return le ? '<div class="meta" style="color:var(--ok);font-weight:600">Ultima volta · ' + esc(prevTxt(le)) + "</div>" : "";
      })() +
      (e.note ? '<div class="meta"><i>' + esc(e.note) + "</i></div>" : "") +
      "</div>";
    if (edit) {
      var q = 'data-id="' + s.id + '" data-eid="' + e.id + '"';
      h +=
        '<button class="ib" data-act="up-es" ' +
        q +
        ' aria-label="Sposta su">↑</button><button class="ib" data-act="down-es" ' +
        q +
        ' aria-label="Sposta giù">↓</button><button class="ib" data-act="edit-es" ' +
        q +
        ' aria-label="Modifica">✎</button><button class="ib" data-act="del-es" ' +
        q +
        ' aria-label="Elimina">' +
        (armed === "e" + e.id ? "?" : "✕") +
        "</button>";
    } else {
      if (t) h += '<span class="last">' + kgf(num(t.kg)) + " kg × " + t.reps + "</span>";
      if (t)
        h +=
          '<button class="ib" data-act="graf" data-eid="' +
          e.id +
          '" data-n="' +
          esc(e.nome) +
          '" aria-label="Grafico di ' +
          esc(e.nome) +
          '">📈</button>';
    }
    h += "</div>";
  });
  if (edit)
    h += '<button class="btn dashed wide small" style="margin-top:8px" data-act="new-es" data-id="' + s.id + '">+ Aggiungi esercizio</button>';
  h += "</div>";
  if (edit) {
    h +=
      '<div class="grid2"><button class="btn" data-act="edit-scheda" data-id="' +
      s.id +
      '">Nome e note</button><button class="btn" data-act="dup-scheda" data-id="' +
      s.id +
      '">Duplica</button></div>';
    h +=
      '<button class="btn danger wide" data-act="del-scheda" data-id="' +
      s.id +
      '">' +
      (armed === "s" + s.id ? "Tocca ancora per eliminare" : "Elimina scheda") +
      "</button>";
  } else if (s.esercizi.length) h += '<button class="btn primary wide" data-act="start" data-id="' + s.id + '">Inizia allenamento</button>';
  return h + "</div>";
}

ACT["del-log"] = function (d) {
  if (!confirmed("l" + d.id)) return;
  LOG = LOG.filter(function (x) {
    return x.id !== d.id;
  });
  saveLocal();
  if (logCol)
    logCol
      .doc(d.id)
      .delete()
      .catch(function () {});
  render();
};

VIEWS.corrente = vCorrente;
VIEWS.sess = vSess;
VIEWS.scheda = vScheda;

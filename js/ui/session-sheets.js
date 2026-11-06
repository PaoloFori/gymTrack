/* Finestre e azioni delle sessioni: nuova sessione, scheda, esercizio, copia, chiusura, eliminazione. */
SHEETS.sess = { html: sessSheet, save: saveSessSheet };
SHEETS.scheda = { html: schedaSheet, save: saveSchedaSheet, session: true };
SHEETS.es = { html: esSheet, save: saveEsSheet, session: true };

function sessSheet(k) {
  var pf = S.profile,
    b =
      '<p class="meta" style="margin:0 0 12px">Scegli peso, obiettivo e allenamenti a settimana. Gli altri dati vengono dal profilo. L\'avatar parte piccolo e debole e cresce con i tuoi allenamenti.</p>';
  b +=
    '<div class="field"><label for="x-nome">Nome (facoltativo)</label><input id="x-nome" data-sf="nome" value="' +
    esc(k.nome) +
    '" placeholder="Sessione ' +
    (S.sessioni.length + 1) +
    '" autocomplete="off"></div>';
  b +=
    '<div class="grid2"><div class="field"><label for="x-peso">Peso attuale kg</label><input id="x-peso" data-sf="peso" inputmode="decimal" value="' +
    esc(k.peso) +
    '"></div><div class="field"><label for="x-ob">Obiettivo della sessione</label><select id="x-ob" data-sf="obiettivo">' +
    OBJ.map(function (o) {
      return "<option" + (o === k.obiettivo ? " selected" : "") + ">" + o + "</option>";
    }).join("") +
    "</select></div></div>";
  b +=
    '<div class="grid2"><div class="field"><label for="x-gg">Allenamenti a settimana</label><select id="x-gg" data-sf="giorni">' +
    [1, 2, 3, 4, 5, 6, 7]
      .map(function (n) {
        return "<option" + (n === Number(k.giorni) ? " selected" : "") + ">" + n + "</option>";
      })
      .join("") +
    '</select></div><div class="field"><label for="x-mesi">Durata</label><select id="x-mesi" data-sf="mesi">' +
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      .map(function (n) {
        return '<option value="' + n + '"' + (Number(k.mesi) === n ? " selected" : "") + ">" + n + (n === 1 ? " mese" : " mesi") + "</option>";
      })
      .join("") +
    "</select></div></div>";
  if (S.sessioni.length)
    b +=
      '<div class="field"><label for="x-copia">Parti da una sessione esistente (copia le schede)</label><select id="x-copia" data-sf="copyFrom"><option value="">Nessuna: da zero</option>' +
      S.sessioni
        .slice()
        .reverse()
        .map(function (x) {
          return (
            '<option value="' +
            x.id +
            '"' +
            (k.copyFrom === x.id ? " selected" : "") +
            ">" +
            esc(x.nome) +
            " · " +
            x.schede.length +
            " schede</option>"
          );
        })
        .join("") +
      "</select></div>";
  if (S.diete.length)
    b +=
      '<div class="field"><label for="x-dieta">Dieta (facoltativa)</label><select id="x-dieta" data-sf="dieta"><option value="">Nessuna dieta</option>' +
      S.diete
        .map(function (x) {
          return '<option value="' + x.id + '"' + (k.dieta === x.id ? " selected" : "") + ">" + esc(x.nome) + "</option>";
        })
        .join("") +
      "</select></div>";
  b +=
    '<p class="hint" style="margin:0 0 12px">Dal profilo: ' +
    (pf.altezza ? "altezza " + esc(pf.altezza) + " cm" : "altezza mancante") +
    " · " +
    (pf.eta ? esc(pf.eta) + " anni" : "età mancante") +
    (pf.altezza && pf.eta ? "." : ". Completali nel Profilo per un avatar più fedele.") +
    "</p>";
  b +=
    '<div class="meta" style="margin:0 0 6px;font-weight:600">Avatar</div><div class="grid3" style="margin-bottom:14px">' +
    AVK.map(function (t) {
      return (
        '<button class="avopt" data-act="pick-tipo" data-t="' +
        t +
        '" aria-pressed="' +
        (k.tipo === t) +
        '">' +
        avatarSVG(t, { p: 0 }, { altezza: pf.altezza, peso: k.peso, obiettivo: k.obiettivo }) +
        "<b>" +
        AV[t] +
        "</b></button>"
      );
    }).join("") +
    "</div>";
  return sheetShell("Nuova sessione", b, okFoot("Inizia"));
}
function schedaSheet(k) {
  var a = attiva(),
    s = getScheda(a, k.id);
  var v = k.mode === "edit" && s ? s : { nome: "", note: "" };
  return sheetShell(
    k.mode === "new" ? "Nuova scheda" : "Scheda",
    '<div class="field"><label for="f-nome">Nome</label><input id="f-nome" data-focus value="' +
      esc(v.nome) +
      '" placeholder="Es. Giorno A · Petto e tricipiti" autocomplete="off"></div><div class="field"><label for="f-note">Note</label><textarea id="f-note" rows="2">' +
      esc(v.note) +
      "</textarea></div>",
    okFoot()
  );
}
function esSheet(k) {
  var a = attiva(),
    s = getScheda(a, k.id);
  var e0 =
    k.mode === "edit"
      ? s.esercizi.find(function (x) {
          return x.id === k.eid;
        })
      : {
          nome: "",
          gruppo: "Petto",
          serie: 3,
          reps: "8-10",
          rec: 90,
          note: "",
          riscal: 0,
          sup: false,
          gif: ""
        };
  var e = {};
  ["nome", "gruppo", "serie", "reps", "rec", "note", "riscal", "sup", "gif"].forEach(function (f) {
    e[f] = k[f] !== undefined ? k[f] : e0[f];
  });
  var q = (k.gq || "").trim() || e.nome,
    sug = q.length >= 3 ? gifSearch(q, 6) : [];
  var gb =
    '<div class="field"><label for="g-q">GIF dimostrativa</label><div class="row" style="gap:8px"><input id="g-q" data-sf="gq" placeholder="Es. panca, curl, squat" value="' +
    esc(k.gq || "") +
    '" autocomplete="off" style="flex:1"><button class="btn small" data-act="gif-search">Cerca</button></div></div>';
  if (e.gif)
    gb +=
      '<div class="row" style="gap:10px;margin-bottom:6px">' +
      gifImg(e.gif, "sm") +
      '<span class="meta grow">GIF scelta</span><button class="btn small" data-act="gif-clear">Rimuovi</button></div>';
  if (sug.length) {
    gb += '<div class="gifrow">';
    sug.forEach(function (g) {
      gb +=
        '<button data-act="gif-pick" data-f="' +
        esc(g[2]) +
        '" aria-pressed="' +
        (e.gif === g[2]) +
        '" aria-label="' +
        esc(g[1]) +
        '">' +
        gifThumb(g[2]) +
        esc(g[1]) +
        "</button>";
    });
    gb += "</div>";
  } else if (q.length >= 3) gb += '<p class="hint">Nessun risultato. Prova con il nome in inglese (es. bench press).</p>';
  gb +=
    '<p class="hint" style="margin-bottom:12px">Premi Cerca (senza testo uso il nome dell\'esercizio). I nomi del database sono in inglese ma capisco i termini italiani più comuni.</p>';
  return sheetShell(
    k.mode === "new" ? "Nuovo esercizio" : "Esercizio",
    '<div class="field"><label for="f-nome">Esercizio</label><input id="f-nome" data-sf="nome" data-focus value="' +
      esc(e.nome) +
      '" autocomplete="off"></div><div class="field"><label for="f-gr">Gruppo muscolare</label><select id="f-gr" data-sf="gruppo">' +
      GR.map(function (x) {
        return "<option" + (x === e.gruppo ? " selected" : "") + ">" + x + "</option>";
      }).join("") +
      '</select></div><div class="grid3"><div class="field"><label for="f-serie">Serie</label><input id="f-serie" data-sf="serie" inputmode="numeric" value="' +
      esc(e.serie) +
      '"></div><div class="field"><label for="f-reps">Ripetizioni</label><input id="f-reps" data-sf="reps" value="' +
      esc(e.reps) +
      '"></div><div class="field"><label for="f-rec">Recupero (s)</label><input id="f-rec" data-sf="rec" inputmode="numeric" value="' +
      esc(e.rec) +
      '"></div></div><div class="grid2"><div class="field"><label for="f-ris">Serie di riscaldamento</label><select id="f-ris" data-sf="riscal">' +
      [0, 1, 2, 3]
        .map(function (n) {
          return "<option" + (n === Number(e.riscal || 0) ? " selected" : "") + ">" + n + "</option>";
        })
        .join("") +
      '</select></div></div><label class="chk"><input type="checkbox" data-sf="sup"' +
      (e.sup ? " checked" : "") +
      '> Superset con l\'esercizio successivo (niente pausa tra i due)</label><div class="field"><label for="f-note">Note</label><input id="f-note" data-sf="note" value="' +
      esc(e.note) +
      '" placeholder="Es. tempo 3-1-1, presa larga"></div>' +
      gb,
    okFoot()
  );
}
function saveSessSheet(k) {
  var peso = String(k.peso || "")
    .trim()
    .replace(",", ".");
  if (!(num(peso) > 0)) {
    toast("Inserisci il tuo peso");
    return;
  }
  var n = {
    id: uid(),
    nome: String(k.nome || "").trim() || "Sessione " + (S.sessioni.length + 1),
    tipo: k.tipo,
    start: Date.now(),
    mesi: clamp(parseInt(k.mesi, 10) || 2, 1, 12),
    giorni: clamp(Number(k.giorni) || 4, 1, 7),
    obiettivo: k.obiettivo,
    altezza: S.profile.altezza,
    eta: S.profile.eta,
    peso: peso,
    chiusa: false,
    finale: null,
    schede: k.copyFrom ? copySchede(k.copyFrom) : []
  };
  S.profile.peso = peso;
  logPeso(peso);
  S.sessioni.push(n);
  if (k.dieta) n.dietId = k.dieta;
  sheet = null;
  view = { name: "corrente" };
  saveApp();
  render();
  window.scrollTo(0, 0);
  return;
}
function saveSchedaSheet(k) {
  var a = attiva(),
    nome = val("f-nome").trim();
  if (k.mode === "new") {
    var ns = {
      id: uid(),
      nome: nome || "Giorno " + String.fromCharCode(65 + a.schede.length),
      note: val("f-note").trim(),
      esercizi: []
    };
    a.schede.push(ns);
    view = { name: "scheda", id: ns.id };
    edit = true;
  } else {
    var s0 = getScheda(a, k.id);
    s0.nome = nome || s0.nome;
    s0.note = val("f-note").trim();
  }
  sheet = null;
  saveApp();
  render();
}
function saveEsSheet(k) {
  var a = attiva(),
    nome = val("f-nome").trim();
  if (!nome) {
    toast("Dai un nome all'esercizio");
    return;
  }
  var s1 = getScheda(a, k.id),
    data = {
      nome: nome,
      gruppo: val("f-gr"),
      serie: Math.max(1, parseInt(val("f-serie"), 10) || 3),
      reps: val("f-reps").trim() || "10",
      rec: Math.max(0, parseInt(val("f-rec"), 10) || 0),
      note: val("f-note").trim(),
      riscal: clamp(parseInt(val("f-ris"), 10) || 0, 0, 3),
      sup:
        k.sup !== undefined
          ? !!k.sup
          : !!(
              k.mode === "edit" &&
              s1.esercizi.find(function (x) {
                return x.id === k.eid;
              }).sup
            ),
      gif:
        k.gif !== undefined
          ? k.gif
          : k.mode === "edit"
            ? s1.esercizi.find(function (x) {
                return x.id === k.eid;
              }).gif || ""
            : ""
    };
  if (k.mode === "new") s1.esercizi.push(Object.assign({ id: uid() }, data));
  else
    Object.assign(
      s1.esercizi.find(function (x) {
        return x.id === k.eid;
      }),
      data
    );
  sheet = null;
  saveApp();
  render();
}
ACT["open-scheda"] = function (d) {
  view = { name: "scheda", id: d.id };
  edit = false;
  render();
  window.scrollTo(0, 0);
};
ACT["open-sess"] = function (d) {
  var xs = S.sessioni.find(function (q) {
    return q.id === d.id;
  });
  if (!xs) return;
  var fromTab = TABS.some(function (t) {
    return t.v === view.name;
  })
    ? view.name
    : "sessioni";
  view = xs.chiusa ? { name: "sess", id: xs.id, from: fromTab } : { name: "corrente", from: fromTab };
  edit = false;
  render();
  window.scrollTo(0, 0);
};
ACT["toggle-edit"] = function (d) {
  edit = !edit;
  armed = "";
  render();
};
ACT["new-sess"] = function (d) {
  var last = S.sessioni[S.sessioni.length - 1];
  sheet = {
    kind: "sess",
    nome: "",
    obiettivo: last ? last.obiettivo : "Ipertrofia",
    mesi: 2,
    giorni: last ? last.giorni : 4,
    peso: S.profile.peso,
    tipo: last ? last.tipo : "umano"
  };
  render();
};
ACT["pick-tipo"] = function (d) {
  sheet.tipo = d.t;
  render();
};
ACT["close-sess"] = function (d) {
  var cur = attiva(),
    s = cur && getScheda(cur, d.id);
  if (cur && Date.now() < endOf(cur) && !confirmed("cs")) return;
  var g = progress(cur);
  cur.chiusa = true;
  cur.chiuseTs = Math.min(Date.now(), endOf(cur));
  cur.finale = { P: g.P, n: livello(g, cur.obiettivo), aura: g.aura, fat: g.fat, p: g.p };
  saveApp();
  view = { name: "sessioni" };
  render();
  window.scrollTo(0, 0);
  toast("Sessione salvata nell'archivio");
};
ACT["new-scheda"] = function (d) {
  sheet = { kind: "scheda", mode: "new" };
  render();
};
ACT["edit-scheda"] = function (d) {
  sheet = { kind: "scheda", mode: "edit", id: d.id };
  render();
};
ACT["dup-scheda"] = function (d) {
  var cur = attiva(),
    s = cur && getScheda(cur, d.id);
  var c = JSON.parse(JSON.stringify(s));
  c.id = uid();
  c.nome = s.nome + " (copia)";
  c.ai = false;
  c.esercizi.forEach(function (y) {
    y.id = uid();
  });
  cur.schede.push(c);
  saveApp();
  view = { name: "scheda", id: c.id };
  render();
  toast("Scheda duplicata");
};
ACT["del-scheda"] = function (d) {
  var cur = attiva(),
    s = cur && getScheda(cur, d.id);
  if (!confirmed("s" + d.id)) return;
  cur.schede = cur.schede.filter(function (x) {
    return x.id !== d.id;
  });
  saveApp();
  view = { name: "corrente" };
  edit = false;
  render();
};
ACT["new-es"] = function (d) {
  sheet = { kind: "es", mode: "new", id: d.id };
  render();
};
ACT["edit-es"] = function (d) {
  sheet = { kind: "es", mode: "edit", id: d.id, eid: d.eid };
  render();
};
ACT["del-es"] = function (d) {
  var cur = attiva(),
    s = cur && getScheda(cur, d.id);
  if (!confirmed("e" + d.eid)) return;
  s.esercizi = s.esercizi.filter(function (x) {
    return x.id !== d.eid;
  });
  saveApp();
  render();
};
ACT["down-es"] = function (d, el, a) {
  var cur = attiva(),
    s = cur && getScheda(cur, d.id);
  move(
    s.esercizi,
    s.esercizi.findIndex(function (x) {
      return x.id === d.eid;
    }),
    a === "up-es" ? -1 : 1
  );
  saveApp();
  render();
};
ACT["up-es"] = ACT["down-es"];
ACT["sel-sess"] = function (d) {
  var sx = selIds.indexOf(d.id);
  if (sx >= 0) selIds.splice(sx, 1);
  else selIds.push(d.id);
  armed = "";
  render();
};
ACT["del-sess"] = function (d) {
  if (!selIds.length) return;
  if (!confirmed("ds")) return;
  var gone = selIds.slice(),
    nl = LOG.filter(function (l) {
      return gone.indexOf(l.sid) >= 0;
    });
  S.sessioni = S.sessioni.filter(function (x) {
    return gone.indexOf(x.id) < 0;
  });
  LOG = LOG.filter(function (l) {
    return gone.indexOf(l.sid) < 0;
  });
  if (logCol)
    nl.forEach(function (l) {
      logCol
        .doc(l.id)
        .delete()
        .catch(function () {});
    });
  if (session && gone.indexOf(session.sid) >= 0) {
    session = null;
    saveSess();
    wakeOff();
    timer = null;
  }
  selMode = false;
  selIds = [];
  saveApp();
  render();
  toast(gone.length + (gone.length === 1 ? " sessione eliminata" : " sessioni eliminate"));
};
ACT["gif-search"] = function (d) {
  render();
};
ACT["gif-pick"] = function (d) {
  sheet.gif = d.f;
  sheet.gq = "";
  render();
};
ACT["gif-clear"] = function (d) {
  sheet.gif = "";
  render();
};
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && e.target && e.target.id === "g-q") {
    e.preventDefault();
    render();
  }
});
HOOKS.change.push(function (t) {
  if (t.dataset.sf === "copyFrom" && sheet && sheet.kind === "sess") {
    sheet.copyFrom = t.value;
    var cx = S.sessioni.find(function (q) {
      return q.id === t.value;
    });
    if (cx) {
      sheet.obiettivo = cx.obiettivo;
      sheet.giorni = cx.giorni;
      sheet.mesi = cx.mesi;
      sheet.tipo = cx.tipo;
    }
    render();
    return true;
  }
});

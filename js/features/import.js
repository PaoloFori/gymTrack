/* Caricamento di schede da JSON e creazione della sessione (corrente o passata). */
function cleanSchedeJson(d) {
  if (!d || !Array.isArray(d.schede)) return null;
  var out = d.schede
    .slice(0, 14)
    .map(function (g, i) {
      var es = (Array.isArray(g.esercizi) ? g.esercizi : [])
        .slice(0, 30)
        .filter(function (e) {
          return e && e.nome;
        })
        .map(function (e) {
          return {
            id: uid(),
            nome: String(e.nome).slice(0, 90),
            gruppo: GR.indexOf(e.gruppo) >= 0 ? e.gruppo : "Altro",
            serie: clamp(parseInt(e.serie, 10) || 3, 1, 15),
            reps: String(e.reps || "10").slice(0, 20),
            rec: clamp(parseInt(e.rec, 10) || 0, 0, 600),
            note: e.note ? String(e.note).slice(0, 300) : "",
            sup: e.sup === true,
            riscal: clamp(parseInt(e.riscal, 10) || 0, 0, 3),
            gif: e.nome_en ? matchGif(e.nome_en) : ""
          };
        });
      return {
        id: uid(),
        nome: String(g.nome || "Giorno " + String.fromCharCode(65 + i)).slice(0, 60),
        note: g.note ? String(g.note).slice(0, 400) : "",
        esercizi: es
      };
    })
    .filter(function (g) {
      return g.esercizi.length;
    });
  return out.length ? out : null;
}
function isoDay(t) {
  var d = new Date(t);
  return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
}
function impIngest(txt) {
  var k = sheet,
    o;
  try {
    o = parseLoose(txt);
    if (!o) throw new Error("Non trovo un JSON valido nel testo.");
    if (o.gymtrack === "dieta") throw new Error("Questo è un JSON di dieta: caricalo dalla scheda Dieta.");
    var sc = cleanSchedeJson(o);
    if (!sc) throw new Error("JSON non valido: servono «schede» con degli «esercizi».");
    var per = o.periodo || {},
      dal = per.dal ? Date.parse(per.dal) : 0,
      al = per.al ? Date.parse(per.al) : 0;
    k.data = { schede: sc, nome: o.nome ? String(o.nome) : "" };
    k.nome = k.data.nome;
    k.obiettivo = OBJ.indexOf(o.obiettivo) >= 0 ? o.obiettivo : "Ipertrofia";
    k.giorni = clamp(parseInt(o.giorni, 10) || sc.length, 1, 7);
    k.dal = dal ? isoDay(dal) : isoDay(Date.now() - 56 * 864e5);
    k.al = al ? isoDay(al) : isoDay(Date.now());
    k.fatti = "";
    k.peso = S.profile.peso || "";
    var w = Math.max(1, Math.round(((al || Date.now()) - (dal || Date.now() - 56 * 864e5)) / WEEK));
    k.mesi = clamp(Math.round(w / 4.345), 1, 12);
    var last = S.sessioni[S.sessioni.length - 1];
    k.tipo = last ? last.tipo : "umano";
    k.dieta = "";
  } catch (e) {
    k.busy = false;
    k.err = e && e.message ? e.message : "File non leggibile.";
    render();
    return;
  }
  k.busy = false;
  k.err = "";
  k.step = "q";
  render();
}
async function impRead(file) {
  var k = sheet;
  if (!k || !file) return;
  k.busy = true;
  k.err = "";
  render();
  try {
    var t = await file.text();
    if (sheet === k) {
      k.txt = t;
      impIngest(t);
    }
  } catch (e) {
    if (sheet === k) {
      k.busy = false;
      k.err = "Non riesco a leggere il file.";
      render();
    }
  }
}
function impAvatars(k) {
  var pf = S.profile;
  return (
    '<div class="meta" style="margin:0 0 6px;font-weight:600">Avatar</div><div class="grid3" style="margin-bottom:14px">' +
    AVK.map(function (t) {
      return (
        '<button class="avopt" data-act="imp-tipo" data-t="' +
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
    "</div>"
  );
}
function impFields(k, past) {
  var b =
    '<div class="field"><label for="i-nome">Nome della sessione</label><input id="i-nome" data-sf="nome" value="' +
    esc(k.nome) +
    '" placeholder="Sessione ' +
    (S.sessioni.length + 1) +
    '" autocomplete="off"></div>';
  b +=
    '<div class="grid2"><div class="field"><label for="i-ob">Obiettivo</label><select id="i-ob" data-sf="obiettivo">' +
    OBJ.map(function (o) {
      return "<option" + (o === k.obiettivo ? " selected" : "") + ">" + o + "</option>";
    }).join("") +
    '</select></div><div class="field"><label for="i-gg">Allenamenti a settimana</label><select id="i-gg" data-sf="giorni">' +
    [1, 2, 3, 4, 5, 6, 7]
      .map(function (n) {
        return "<option" + (n === Number(k.giorni) ? " selected" : "") + ">" + n + "</option>";
      })
      .join("") +
    "</select></div></div>";
  if (past)
    b +=
      '<div class="grid2"><div class="field"><label for="i-dal">Dal</label><input id="i-dal" type="date" data-sf="dal" value="' +
      esc(k.dal) +
      '"></div><div class="field"><label for="i-al">Al</label><input id="i-al" type="date" data-sf="al" value="' +
      esc(k.al) +
      '"></div></div><div class="field"><label for="i-fatti">Quanti allenamenti hai fatto in quel periodo?</label><input id="i-fatti" data-sf="fatti" inputmode="numeric" value="' +
      esc(k.fatti) +
      '" placeholder="Es. 28"></div>';
  else
    b +=
      '<div class="grid2"><div class="field"><label for="i-mesi">Durata</label><select id="i-mesi" data-sf="mesi">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        .map(function (n) {
          return '<option value="' + n + '"' + (Number(k.mesi) === n ? " selected" : "") + ">" + n + (n === 1 ? " mese" : " mesi") + "</option>";
        })
        .join("") +
      '</select></div><div class="field"><label for="i-peso">Peso attuale kg</label><input id="i-peso" data-sf="peso" inputmode="decimal" value="' +
      esc(k.peso) +
      '"></div></div>';
  if (!past && S.diete.length)
    b +=
      '<div class="field"><label for="i-dieta">Dieta (facoltativa)</label><select id="i-dieta" data-sf="dieta"><option value="">Nessuna dieta</option>' +
      S.diete
        .map(function (x) {
          return '<option value="' + x.id + '"' + (k.dieta === x.id ? " selected" : "") + ">" + esc(x.nome) + "</option>";
        })
        .join("") +
      "</select></div>";
  return b + impAvatars(k);
}
function impSheet() {
  var k = sheet,
    err = k.err ? '<div class="banner exp" style="margin-bottom:12px">' + esc(k.err) + "</div>" : "";
  if (k.step === "src") {
    var conv = k.showConv
      ? `<div class="card" style="margin:10px 0 0"><p class="meta" style="margin:0 0 10px">1. Copia il prompt. 2. Incollalo in un assistente IA (Claude, ChatGPT…) e allega il PDF della scheda, con eventuale altro testo. 3. Incolla qui sopra la risposta, oppure salvala come file .json e caricala.</p>${promptCard("conv-s", "Prompt da dare all'IA", promptConvertSessione())}</div>`
      : "";
    var body = `<p class="meta" style="margin:0 0 12px">Le schede si caricano da un file <b>JSON</b>.</p>
      <div class="field"><label for="i-file">Carica il file JSON</label><input type="file" id="i-file" accept=".json,application/json,.txt,text/plain"></div>
      <div class="field"><label for="i-txt">Oppure incolla qui il JSON (o la risposta dell'IA)</label><textarea class="dtx" id="i-txt" data-sf="txt" placeholder='{ "gymtrack": "sessione", … }'>${esc(k.txt || "")}</textarea></div>
      <button class="btn wide" data-act="imp-conv">${k.showConv ? "Nascondi" : "Non ho il JSON: come lo ottengo dalla mia scheda?"}</button>${conv}
      ${k.busy ? '<p class="meta">Leggo il file…</p>' : ""}${err}`;
    return sheetShell(
      "Carica da JSON",
      body,
      `<div class="grid2"><button class="btn" data-act="close-sheet">Annulla</button><button class="btn primary" data-act="imp-parse"${k.busy ? " disabled" : ""}>Leggi il JSON</button></div>`
    );
  }
  var nEs = 0;
  k.data.schede.forEach(function (s) {
    nEs += s.esercizi.length;
  });
  var sum =
    '<div class="card" style="margin-bottom:12px"><b>' +
    k.data.schede.length +
    (k.data.schede.length === 1 ? " scheda" : " schede") +
    " · " +
    nEs +
    ' esercizi</b><div class="meta">' +
    k.data.schede
      .map(function (s) {
        return esc(s.nome);
      })
      .join(" · ") +
    "</div></div>";
  if (k.step === "q")
    return sheetShell(
      "È la scheda corrente?",
      sum +
        '<p class="meta" style="margin:0 0 12px">Se è quella che stai usando ora, la aggiungo alla sessione in corso (o ne creo una nuova). Se è una scheda passata, creo una sessione già conclusa con l\'avatar che le corrisponde.</p><div class="stack"><button class="btn primary wide" data-act="imp-q" data-v="si">Sì, è la scheda corrente</button><button class="btn wide" data-act="imp-q" data-v="no">No, è una scheda passata</button></div>' +
        err,
      '<button class="btn wide" style="margin-top:12px" data-act="close-sheet">Annulla</button>'
    );
  if (k.step === "cur") {
    var a = attiva();
    return sheetShell(
      "Scheda corrente",
      sum +
        (a
          ? '<p class="meta" style="margin:0 0 12px">Hai già la sessione in corso «' + esc(a.nome) + "»: le schede verranno aggiunte lì.</p>"
          : '<p class="meta" style="margin:0 0 12px">Non hai una sessione in corso: ne creo una nuova con queste schede.</p>' + impFields(k, false)) +
        err,
      '<div class="grid2"><button class="btn" data-act="imp-back">Indietro</button><button class="btn primary" data-act="imp-make">' +
        (a ? "Aggiungi le schede" : "Crea sessione") +
        "</button></div>"
    );
  }
  return sheetShell(
    "Scheda passata",
    sum +
      '<p class="meta" style="margin:0 0 12px">Indica il periodo e quante volte ti sei allenato: creo una sessione conclusa con l\'avatar che raggiungeresti con quel ritmo.</p>' +
      impFields(k, true) +
      err,
    '<div class="grid2"><button class="btn" data-act="imp-back">Indietro</button><button class="btn primary" data-act="imp-make">Crea sessione</button></div>'
  );
}
function impMake() {
  var k = sheet,
    a = attiva(),
    n;
  if (k.step === "cur" && a) {
    k.data.schede.forEach(function (s) {
      a.schede.push(s);
    });
    sheet = null;
    view = { name: "corrente" };
    saveApp();
    render();
    window.scrollTo(0, 0);
    toast(k.data.schede.length + " schede aggiunte alla sessione");
    return;
  }
  var peso = String(k.peso || S.profile.peso || "").replace(",", ".");
  if (k.step === "cur") {
    if (!(num(peso) > 0)) {
      k.err = "Inserisci il tuo peso.";
      render();
      return;
    }
    n = {
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
      schede: k.data.schede,
      dietId: k.dieta || ""
    };
    S.profile.peso = peso;
    logPeso(peso);
    S.sessioni.push(n);
    sheet = null;
    view = { name: "corrente" };
    saveApp();
    render();
    window.scrollTo(0, 0);
    toast("Sessione creata con " + k.data.schede.length + " schede");
    return;
  }
  var dal = Date.parse(k.dal),
    al = Date.parse(k.al),
    fatti = Math.max(0, parseInt(k.fatti, 10));
  if (!dal || !al || al <= dal) {
    k.err = "Controlla le date: «Al» deve essere dopo «Dal».";
    render();
    return;
  }
  if (isNaN(fatti)) {
    k.err = "Scrivi quanti allenamenti hai fatto.";
    render();
    return;
  }
  var giorni = clamp(Number(k.giorni) || 4, 1, 7),
    W = Math.max(1, Math.round((al - dal) / WEEK)),
    f = simFinal(giorni, W, fatti);
  n = {
    id: uid(),
    nome: String(k.nome || "").trim() || "Sessione " + (S.sessioni.length + 1),
    tipo: k.tipo,
    start: dal,
    mesi: clamp(Math.round(W / 4.345), 1, 12),
    giorni: giorni,
    obiettivo: k.obiettivo,
    altezza: S.profile.altezza,
    eta: S.profile.eta,
    peso: peso || S.profile.peso || "",
    chiusa: true,
    chiuseTs: al,
    fatti: fatti,
    finale: { P: f.P, n: livello({ P: f.P, fat: f.fat }, k.obiettivo), aura: f.aura, fat: f.fat, p: f.p },
    schede: k.data.schede,
    dietId: ""
  };
  S.sessioni.push(n);
  S.sessioni.sort(function (x, y) {
    return x.start - y.start;
  });
  sheet = null;
  view = { name: "sessioni" };
  saveApp();
  render();
  window.scrollTo(0, 0);
  toast("Sessione passata creata: " + n.finale.n + " · forma " + Math.round(f.P));
}
/* Copia le schede di una sessione esistente (nuovi id) per iniziare una nuova sessione da lì. */
function copySchede(id) {
  var x = S.sessioni.find(function (q) {
    return q.id === id;
  });
  if (!x) return [];
  return clone(x.schede).map(function (s) {
    s.id = uid();
    s.esercizi.forEach(function (e) {
      e.id = uid();
    });
    return s;
  });
}

ACT["imp-sess"] = function (d) {
  sheet = { kind: "impsess", step: "src", txt: "", err: "", busy: false, showConv: false };
  render();
};
ACT["imp-parse"] = function (d) {
  impIngest(sheet.txt);
};
ACT["imp-q"] = function (d) {
  var cur = attiva(),
    s = cur && getScheda(cur, d.id);
  sheet.step = d.v === "si" ? "cur" : "past";
  sheet.err = "";
  render();
};
ACT["imp-back"] = function (d) {
  sheet.step = "q";
  sheet.err = "";
  render();
};
ACT["imp-tipo"] = function (d) {
  sheet.tipo = d.t;
  render();
};
ACT["imp-make"] = function (d) {
  impMake();
};

SHEETS.impsess = { html: impSheet };

HOOKS.change.push(function (t) {
  if (t.id === "i-file") {
    impRead(t.files && t.files[0]);
    return true;
  }
});

ACT["imp-conv"] = function () {
  sheet.showConv = !sheet.showConv;
  render();
};

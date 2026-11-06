/* Finestra di creazione/modifica della dieta e salvataggio. */
function dietSheet() {
  var k = sheet,
    b = "",
    foot;
  var nav = function (next, lbl) {
    return (
      '<div class="grid2"><button class="btn" data-act="' +
      (k.step === "src" || (k.editId && k.step === "pasti") ? "close-sheet" : "d-back") +
      '">' +
      (k.step === "src" || (k.editId && k.step === "pasti") ? "Annulla" : "Indietro") +
      '</button><button class="btn primary" data-act="' +
      next +
      '"' +
      (k.busy ? " disabled" : "") +
      ">" +
      lbl +
      "</button></div>"
    );
  };
  var err = k.err ? '<div class="banner exp" style="margin-bottom:12px">' + esc(k.err) + "</div>" : "";
  if (/^(src|gen|genout)$/.test(k.step)) return dietSourceSheet(k);
  if (k.step === "pasti") {
    b += '<p class="meta" style="margin:0 0 8px">Ho trovato questi pasti. Togli la spunta a quelli che non fai.</p>';
    k.pasti.forEach(function (m) {
      var n = 0;
      m.piatti.forEach(function (p) {
        p.varianti.forEach(function (v) {
          v.alimenti.forEach(function () {
            n++;
          });
        });
      });
      b +=
        '<label class="fd"><input type="checkbox" data-chk="' +
        m.id +
        '"' +
        (m.on ? " checked" : "") +
        '><span class="nm"><b>' +
        esc(m.nome) +
        '</b><span class="meta">' +
        m.piatti.length +
        (m.piatti.length === 1 ? " piatto" : " piatti") +
        " · " +
        n +
        " alimenti</span></span></label>";
    });
    return sheetShell(k.editId ? "Modifica la dieta" : "Quali pasti fai?", b + err, nav("d-next", "Avanti"));
  }
  if (k.step === "alim") {
    var ms = k.pasti.filter(function (m) {
        return m.on;
      }),
      mi = Math.min(k.mi || 0, ms.length - 1),
      cm = ms[mi];
    b +=
      '<p class="meta" style="margin:0 0 4px">Pasto ' +
      (mi + 1) +
      " di " +
      ms.length +
      ". Togli la spunta agli alimenti che non mangeresti e correggi le quantità: il piano userà solo quelli.</p>";
    [cm].forEach(function (m) {
      b += '<div class="meta" style="margin:16px 0 0;font-weight:700;font-size:16px;color:var(--ink)">' + esc(m.nome) + "</div>";
      m.piatti.forEach(function (p) {
        b += '<div class="meta" style="margin:8px 0 0;font-weight:600">' + esc(p.nome) + "</div>";
        p.varianti.forEach(function (v, vi) {
          if (p.varianti.length > 1)
            b +=
              '<label class="fd" style="border-top:2px solid var(--line)"><input type="checkbox" data-chk="' +
              v.id +
              '"' +
              (v.on ? " checked" : "") +
              '><span class="nm"><b>Alternativa ' +
              (vi + 1) +
              '</b><span class="meta">' +
              esc(
                v.alimenti
                  .map(function (a) {
                    return a.opzioni[0].n;
                  })
                  .join(" + ")
              ) +
              "</span></span></label>";
          if (v.on)
            v.alimenti.forEach(function (a) {
              b +=
                '<div class="itm">' +
                a.opzioni
                  .map(function (o) {
                    return (
                      '<div class="opt"><input type="checkbox" data-chk="' +
                      o.id +
                      '"' +
                      (o.on ? " checked" : "") +
                      ' aria-label="' +
                      esc(o.n) +
                      '"><span class="nm">' +
                      esc(o.n) +
                      '</span><input class="q" inputmode="decimal" data-oq="' +
                      o.id +
                      '" value="' +
                      esc(String(o.qt).replace(".", ",")) +
                      '" aria-label="Quantità ' +
                      esc(o.n) +
                      '"><span class="u">' +
                      esc(o.u) +
                      "</span></div>"
                    );
                  })
                  .join("") +
                "</div>";
            });
        });
      });
    });
    var items = [];
    k.pasti.forEach(function (m) {
      if (m === cm)
        m.piatti.forEach(function (p) {
          p.varianti.forEach(function (v) {
            v.alimenti.forEach(function (a) {
              items.push([a.id, a.opzioni[0].n]);
            });
          });
        });
    });
    if (
      !items.some(function (i) {
        return i[0] === k.addItem;
      })
    )
      k.addItem = items.length ? items[0][0] : "";
    b +=
      '<div class="meta" style="margin:20px 0 6px;font-weight:600">Aggiungi un alimento che mangi</div><div class="field"><select data-sf="addItem" aria-label="A quale voce">' +
      items
        .map(function (i) {
          return '<option value="' + i[0] + '"' + (k.addItem === i[0] ? " selected" : "") + ">" + esc(i[1]) + " (e simili)</option>";
        })
        .join("") +
      '</select></div><div class="row"><input data-sf="addName" placeholder="Es. Petto di pollo" value="' +
      esc(k.addName || "") +
      '" style="flex:1;min-width:0" class="grow"><input data-sf="addQt" inputmode="decimal" placeholder="g" value="' +
      esc(k.addQt || "") +
      '" style="width:70px"><button class="btn small" data-act="d-addopt">Aggiungi</button></div><p class="hint">Se aggiungi lo stesso alimento a pranzo e a cena, con la cottura unica potrai cucinarlo una volta sola.</p><div style="height:12px"></div>';
    return sheetShell(cm.nome + " · " + (mi + 1) + "/" + ms.length, b + err, nav("d-next", "Avanti"));
  }
  if (k.step === "regole") {
    var R = k.regole || (k.regole = {});
    b += k.noRules
      ? '<div class="banner" style="margin-bottom:12px"><b>Il piano non indica regole</b>Dimmi quante volte a settimana mangi questi alimenti: servono a variare la dieta. Lascia vuoto dove non c\'è un limite.</div>'
      : '<p class="meta" style="margin:0 0 8px">Queste sono le regole che ho trovato nel piano. Correggile o completale: servono a variare la dieta (vuoto = nessun limite).</p>';
    b += '<div class="itm">';
    RULEDEF.forEach(function (r) {
      var t = ruleType(r[0], R),
        v = R[r[0]] && R[r[0]][t];
      b +=
        '<div class="opt"><span class="nm">' +
        r[1] +
        '<span class="meta" style="display:block;margin:0">' +
        (t === "min" ? "almeno" : "al massimo") +
        '</span></span><input class="q" inputmode="numeric" data-rule="' +
        r[0] +
        '" value="' +
        (v == null ? "" : v) +
        '" placeholder="–" aria-label="' +
        r[1] +
        '"><span class="u">a sett.</span></div>';
    });
    b +=
      '<div class="opt"><span class="nm">Pasti liberi<span class="meta" style="display:block;margin:0">sgarro, in settimana</span></span><input class="q" inputmode="numeric" data-rule="libero" value="' +
      (R.libero && R.libero.n != null ? R.libero.n : "") +
      '" placeholder="0" aria-label="Pasti liberi a settimana"><span class="u">a sett.</span></div></div>';
    return sheetShell("Regole della dieta", b + err, nav("d-next", "Avanti"));
  }
  if (k.step === "pref") {
    var pf = k.pref || "indiff";
    b +=
      '<p class="meta" style="margin:0 0 10px">Cosa preferisci mangiare? Il piano ne mette di più, ma sempre dentro le regole di prima.</p><div class="seg" style="grid-template-columns:1fr;gap:8px">' +
      [
        ["carne", "Più carne"],
        ["pesce", "Più pesce"],
        ["indiff", "Indifferente: un po' di tutto"]
      ]
        .map(function (o) {
          return '<button data-act="d-pref" data-m="' + o[0] + '" aria-pressed="' + (pf === o[0]) + '">' + o[1] + "</button>";
        })
        .join("") +
      "</div>";
    return sheetShell("Carne o pesce?", b + err, nav("d-next", "Avanti"));
  }
  /* cucina */
  b +=
    '<div class="field"><label for="d-nome">Titolo della dieta</label><input id="d-nome" data-sf="nome" value="' +
    esc(k.nome) +
    '" autocomplete="off"></div>';
  if (!k.editId)
    b +=
      '<div class="meta" style="margin:0 0 6px;font-weight:600">Collegala a una sessione (obbligatorio)</div><div class="eqs" style="margin-bottom:14px">' +
      S.sessioni
        .slice()
        .reverse()
        .map(function (x) {
          var on = k.sessId === x.id;
          return (
            '<button class="eq" data-act="d-ses" data-id="' +
            x.id +
            '" aria-pressed="' +
            on +
            '"><span>' +
            (on ? "✓" : "+") +
            "</span> " +
            esc(x.nome) +
            (x.chiusa ? "" : " · in corso") +
            (x.dietId ? " · ha già una dieta" : "") +
            "</button>"
          );
        })
        .join("") +
      "</div>";
  b +=
    '<div class="meta" style="margin:0 0 6px;font-weight:600">Quante volte al giorno cucini?</div><div class="seg" style="margin-bottom:10px"><button data-act="d-cook" data-m="due" aria-pressed="' +
    (k.cook !== "uno") +
    '">Cucino 2 volte al giorno</button><button data-act="d-cook" data-m="uno" aria-pressed="' +
    (k.cook === "uno") +
    '">Cucino 1 volta al giorno</button></div>';
  if (k.cook === "uno")
    b +=
      '<div class="banner" style="margin-bottom:12px"><b>La sera cucini anche il pranzo del giorno dopo?</b>Se sì, il piano è «intelligente»: a cena e a pranzo mette lo stesso cereale e le stesse verdure, così cucini tutto insieme, e ti dice la quantità totale da cucinare.<div class="seg" style="margin-top:10px;grid-template-columns:1fr"><button data-act="d-dir" data-m="sera" aria-pressed="' +
      (k.dir !== "pranzo") +
      '">Sì, la sera cucino anche il pranzo di domani</button><button data-act="d-dir" data-m="pranzo" aria-pressed="' +
      (k.dir === "pranzo") +
      '">No: a pranzo cucino anche la cena</button></div></div>';
  else b += '<p class="hint" style="margin:0 0 12px">Piano normale: pranzo e cena sono preparati separatamente.</p>';
  return sheetShell(k.editId ? "Aggiorna il piano" : "Crea il piano", b + err, nav("d-make", k.editId ? "Aggiorna piano" : "Crea piano"));
}
/* Regole settimanali: chiave, nome, tipo predefinito (min = almeno, max = al massimo). */
var RULEDEF = [
  ["carne", "Carne (bianca e rossa)", "max"],
  ["rossa", "Carne rossa", "max"],
  ["pesce", "Pesce", "min"],
  ["tonno", "Tonno in scatola", "max"],
  ["uova", "Uova", "min"],
  ["latt", "Latticini e formaggi", "min"],
  ["legu", "Legumi", "min"],
  ["patate", "Patate e gnocchi", "max"]
];
function ruleType(key, R) {
  if (R[key] && R[key].min != null) return "min";
  if (R[key] && R[key].max != null) return "max";
  return RULEDEF.find(function (r) {
    return r[0] === key;
  })[2];
}
function dietMake() {
  var k = sheet;
  if (!k.editId && !k.sessId) {
    k.err = "Collega la dieta a una sessione.";
    render();
    return;
  }
  if (
    !k.pasti.some(function (m) {
      return (
        m.on &&
        m.piatti.some(function (p) {
          return p.varianti.some(function (v) {
            return (
              v.on &&
              v.alimenti.some(function (a) {
                return activeOpts(a).length;
              })
            );
          });
        })
      );
    })
  ) {
    k.err = "Lascia almeno un alimento.";
    render();
    return;
  }
  var d = k.editId && dietById(k.editId),
    cook = { mode: k.cook === "uno" ? "uno" : "due", dir: k.dir === "pranzo" ? "pranzo" : "sera" };
  if (d) {
    d.nome = k.nome.trim() || d.nome;
    d.pasti = k.pasti;
    d.regole = k.regole || {};
    d.pref = k.pref || "indiff";
    d.cook = cook;
    d.seed = (d.seed || 0) + 1;
  } else {
    d = {
      id: uid(),
      nome: k.nome.trim() || "Dieta " + (S.diete.length + 1),
      creata: Date.now(),
      periodo: k.periodo || null,
      regole: k.regole || {},
      pref: k.pref || "indiff",
      pasti: k.pasti,
      cook: cook,
      seed: 0,
      plan: [],
      spesa: []
    };
    S.diete.push(d);
    var x = S.sessioni.find(function (q) {
      return q.id === k.sessId;
    });
    if (x) x.dietId = d.id;
  }
  d.plan = makePlan(d, d.seed);
  d.spesa = makeSpesa(d, d.spesa);
  dCur = d.id;
  dTab = "piano";
  dOpen = null;
  sheet = null;
  view = { name: "dietad", id: d.id };
  saveApp();
  render();
  window.scrollTo(0, 0);
  toast("Piano creato: " + d.spesa.length + " prodotti nella lista della spesa");
}

ACT["d-back"] = function () {
  var back = { cucina: "pref", pref: "regole", regole: "alim", alim: "pasti", pasti: "src", genout: "gen", gen: "src" };
  if (sheet.step === "alim" && sheet.mi > 0) sheet.mi--;
  else {
    if (sheet.step === "regole")
      sheet.mi =
        sheet.pasti.filter(function (m) {
          return m.on;
        }).length - 1;
    sheet.step = back[sheet.step] || "src";
  }
  sheet.err = "";
  render();
};
ACT["d-next"] = function (d) {
  if (sheet.step === "pasti") {
    if (
      !sheet.pasti.some(function (m) {
        return m.on;
      })
    ) {
      sheet.err = "Scegli almeno un pasto.";
      render();
      return;
    }
    sheet.step = "alim";
    sheet.mi = 0;
  } else if (sheet.step === "alim") {
    var nm = sheet.pasti.filter(function (m) {
      return m.on;
    }).length;
    if (sheet.mi < nm - 1) sheet.mi++;
    else {
      sheet.step = "regole";
      sheet.noRules = !Object.keys(sheet.regole || {}).length;
    }
  } else if (sheet.step === "regole") sheet.step = "pref";
  else if (sheet.step === "pref") sheet.step = "cucina";
  sheet.err = "";
  render();
  if (document.querySelector(".sheet")) document.querySelector(".sheet").scrollTop = 0;
};
ACT["d-addopt"] = function (d) {
  var ai = null;
  sheet.pasti.forEach(function (m) {
    m.piatti.forEach(function (p) {
      p.varianti.forEach(function (v) {
        v.alimenti.forEach(function (a) {
          if (a.id === sheet.addItem) ai = a;
        });
      });
    });
  });
  var an = String(sheet.addName || "").trim();
  if (!ai || an.length < 2) {
    toast("Scrivi il nome dell'alimento");
    return;
  }
  ai.opzioni.push({
    id: uid(),
    n: titleCase(an),
    qt: num(sheet.addQt) || ai.opzioni[0].qt,
    u: ai.opzioni[0].u,
    on: true
  });
  sheet.addName = "";
  sheet.addQt = "";
  render();
};
ACT["d-ses"] = function (d) {
  sheet.sessId = sheet.sessId === d.id ? "" : d.id;
  render();
};
ACT["d-pref"] = function (d) {
  sheet.pref = d.m;
  render();
};
ACT["d-cook"] = function (d) {
  sheet.cook = d.m;
  render();
};
ACT["d-dir"] = function (d) {
  sheet.dir = d.m;
  render();
};
ACT["d-make"] = function (d) {
  dietMake();
};

SHEETS.dieta = { html: dietSheet };

HOOKS.input.push(function (t) {
  if (t.dataset.rule !== undefined && sheet && sheet.regole) {
    var key = t.dataset.rule,
      n = parseInt(t.value, 10),
      Rg = sheet.regole;
    if (isNaN(n) || n < 0) delete Rg[key];
    else if (key === "libero") Rg.libero = { n: n };
    else {
      var ty = ruleType(key, Rg);
      Rg[key] = {};
      Rg[key][ty] = n;
    }
    return true;
  }
  if (t.dataset.oq !== undefined && sheet && sheet.pasti) {
    var o = dietFind(sheet, t.dataset.oq);
    if (o) o.qt = num(t.value);
    return true;
  }
});
HOOKS.change.push(function (t) {
  if (t.id === "d-file") {
    dietRead(t.files && t.files[0]);
    return true;
  }
  if (t.dataset.chk !== undefined && sheet && sheet.pasti) {
    var c = dietFind(sheet, t.dataset.chk);
    if (c) {
      c.on = t.checked;
      if (c.piatti || c.alimenti) render();
    }
    return true;
  }
});

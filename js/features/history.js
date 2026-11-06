/* Storico degli esercizi: ultimi carichi, volumi, massimali stimati, record, contesto per l'IA. */
/* ---------- allenamenti passati ---------- */
function W(sets) {
  return (sets || []).filter(function (x) {
    return !x.w;
  });
}
function W2(sets) {
  var w = W(sets);
  return w.length ? w : sets;
}
function lastOf(exId, nome) {
  for (var i = 0; i < LOG.length; i++) {
    var e = LOG[i].ex || [];
    for (var j = 0; j < e.length; j++)
      if (e[j].id === exId || (nome && e[j].nome && e[j].nome.toLowerCase() === nome.toLowerCase())) return W2(e[j].sets);
  }
  return null;
}
function lastEntry(exId, nome) {
  for (var i = 0; i < LOG.length; i++) {
    var e = LOG[i].ex || [];
    for (var j = 0; j < e.length; j++)
      if (e[j].id === exId || (nome && e[j].nome && e[j].nome.toLowerCase() === nome.toLowerCase())) return { ts: LOG[i].ts, sets: W2(e[j].sets) };
  }
  return null;
}
function prevTxt(en) {
  return en
    ? fd(en.ts) +
        ": " +
        en.sets
          .map(function (x) {
            return kgf(num(x.kg)) + " kg × " + x.reps;
          })
          .join(" · ")
    : "";
}
function lastSchedaUse(id) {
  for (var i = 0; i < LOG.length; i++) if (LOG[i].schedaId === id) return LOG[i];
  return null;
}
function topSet(sets) {
  var b = null;
  (sets || []).forEach(function (s) {
    if (!b || num(s.kg) > num(b.kg)) b = s;
  });
  return b;
}
function volMonth() {
  var v = 0,
    now = Date.now();
  LOG.forEach(function (l) {
    if (now - l.ts < 30 * 864e5)
      (l.ex || []).forEach(function (e) {
        W(e.sets).forEach(function (s) {
          v += num(s.kg) * num(s.reps);
        });
      });
  });
  return (v / 1000).toFixed(1).replace(".", ",");
}
function e1(kg, reps) {
  kg = num(kg);
  reps = num(reps);
  return kg > 0 && reps > 0 ? kg * (1 + reps / 30) : 0;
}
function exKey(e) {
  return String(e.nome || "")
    .trim()
    .toLowerCase();
}
function sameEx(a, b) {
  return (a.id && a.id === b.id) || (exKey(a) && exKey(a) === exKey(b));
}
function exVol(sets) {
  var v = 0;
  W(sets).forEach(function (x) {
    v += num(x.kg) * num(x.reps);
  });
  return v;
}
function exBest(sets) {
  var b = 0;
  W(sets).forEach(function (x) {
    b = Math.max(b, e1(x.kg, x.reps));
  });
  return b;
}
function exHistory(ex) {
  var pts = [];
  LOG.slice()
    .reverse()
    .forEach(function (l) {
      (l.ex || []).forEach(function (e) {
        if (sameEx(e, ex)) pts.push({ ts: l.ts, e1: exBest(e.sets), vol: exVol(e.sets) });
      });
    });
  return pts;
}
function findPRs(out) {
  var prs = [];
  out.forEach(function (ne) {
    var prior = [];
    LOG.forEach(function (l) {
      (l.ex || []).forEach(function (e) {
        if (sameEx(e, ne)) prior.push(e);
      });
    });
    if (!prior.length) return;
    var pk = 0,
      pe = 0,
      pv = 0,
      nk = 0;
    prior.forEach(function (e) {
      W(e.sets).forEach(function (x) {
        pk = Math.max(pk, num(x.kg));
      });
      pe = Math.max(pe, exBest(e.sets));
      pv = Math.max(pv, exVol(e.sets));
    });
    W(ne.sets).forEach(function (x) {
      nk = Math.max(nk, num(x.kg));
    });
    var ee = exBest(ne.sets),
      vv = exVol(ne.sets);
    if (nk > pk) prs.push({ nome: ne.nome, tipo: "Carico massimo", val: kgf(nk) + " kg" });
    else if (ee > pe + 0.01) prs.push({ nome: ne.nome, tipo: "Massimale stimato", val: kgf(Math.round(ee * 10) / 10) + " kg" });
    else if (vv > pv) prs.push({ nome: ne.nome, tipo: "Volume", val: Math.round(vv) + " kg" });
  });
  return prs;
}
function andamento() {
  var r = LOG.slice(0, 8),
    f = r.filter(function (l) {
      return l.fat;
    }),
    o = "";
  if (f.length)
    o +=
      " Fatica media percepita (1-5) negli ultimi " +
      f.length +
      " allenamenti: " +
      (
        f.reduce(function (a, l) {
          return a + l.fat;
        }, 0) / f.length
      ).toFixed(1) +
      ".";
  var nn = r
    .filter(function (l) {
      return l.nota;
    })
    .map(function (l) {
      return l.nota;
    })
    .slice(0, 4);
  if (nn.length) o += " Note dell'utente: " + JSON.stringify(nn) + ".";
  var pr = [];
  r.forEach(function (l) {
    (l.prs || []).forEach(function (q) {
      pr.push(q.nome);
    });
  });
  if (pr.length) o += " Esercizi con record recenti: " + JSON.stringify(pr.slice(0, 6)) + ".";
  return o;
}

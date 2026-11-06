/* Grafici e riquadri di statistica: linee, record, peso, storico di un esercizio, nuovi record. */
function lineChart(pts, label) {
  if (pts.length < 2) return '<p class="meta" style="margin:10px 0">Servono almeno due rilevazioni per vedere il grafico.</p>';
  var W = 320,
    H = 160,
    pl = 38,
    pr = 8,
    pt = 10,
    pb = 22,
    xs = pts.map(function (q) {
      return q.x;
    }),
    ys = pts.map(function (q) {
      return q.y;
    });
  var x0 = Math.min.apply(null, xs),
    x1 = Math.max.apply(null, xs),
    y0 = Math.min.apply(null, ys),
    y1 = Math.max.apply(null, ys);
  if (y1 === y0) {
    y1 += 1;
    y0 -= 1;
  }
  var pd = (y1 - y0) * 0.12;
  y0 -= pd;
  y1 += pd;
  if (x1 === x0) x1 += 1;
  function X(v) {
    return pl + ((v - x0) / (x1 - x0)) * (W - pl - pr);
  }
  function Y(v) {
    return pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb);
  }
  var d = pts
    .map(function (q, i) {
      return (i ? "L" : "M") + X(q.x).toFixed(1) + " " + Y(q.y).toFixed(1);
    })
    .join("");
  var o =
    '<svg class="chart" viewBox="0 0 ' +
    W +
    " " +
    H +
    '" role="img" aria-label="' +
    esc(label + ": da " + kgf(Math.round(ys[0] * 10) / 10) + " a " + kgf(Math.round(ys[ys.length - 1] * 10) / 10)) +
    '">';
  [y0 + pd, (y0 + y1) / 2, y1 - pd].forEach(function (v) {
    o +=
      '<line class="c-grid" x1="' +
      pl +
      '" x2="' +
      (W - pr) +
      '" y1="' +
      Y(v).toFixed(1) +
      '" y2="' +
      Y(v).toFixed(1) +
      '"/><text class="c-lbl" x="' +
      (pl - 5) +
      '" y="' +
      (Y(v) + 3).toFixed(1) +
      '" text-anchor="end">' +
      kgf(Math.round(v * 10) / 10) +
      "</text>";
  });
  o +=
    '<path class="c-area" d="' +
    d +
    "L" +
    X(x1).toFixed(1) +
    " " +
    (H - pb) +
    "L" +
    X(x0).toFixed(1) +
    " " +
    (H - pb) +
    'Z"/><path class="c-line" d="' +
    d +
    '"/>';
  pts.forEach(function (q) {
    o += '<circle class="c-dot" cx="' + X(q.x).toFixed(1) + '" cy="' + Y(q.y).toFixed(1) + '" r="2.6"/>';
  });
  return (
    o +
    '<text class="c-lbl" x="' +
    pl +
    '" y="' +
    (H - 6) +
    '">' +
    fd(x0) +
    '</text><text class="c-lbl" x="' +
    (W - pr) +
    '" y="' +
    (H - 6) +
    '" text-anchor="end">' +
    fd(x1) +
    "</text></svg>"
  );
}
function recordsHTML() {
  var best = {};
  LOG.forEach(function (l) {
    (l.ex || []).forEach(function (e) {
      W(e.sets).forEach(function (x) {
        var v = e1(x.kg, x.reps);
        if (!v) return;
        var k = exKey(e);
        if (!best[k] || v > best[k].v) best[k] = { v: v, nome: e.nome, id: e.id, kg: num(x.kg), reps: x.reps, ts: l.ts };
      });
    });
  });
  var arr = Object.keys(best)
    .map(function (k) {
      return best[k];
    })
    .sort(function (a, b) {
      return b.ts - a.ts;
    })
    .slice(0, 12);
  var h = '<div class="card"><div class="meta" style="margin:0 0 6px;font-weight:600">Record personali · tutte le sessioni insieme 🏆</div>';
  if (!arr.length) return h + '<p class="meta">I tuoi migliori carichi compaiono qui dopo il primo allenamento.</p></div>';
  arr.forEach(function (r) {
    h +=
      '<button class="plain prrow" style="width:100%;text-align:left" data-act="graf" data-eid="' +
      esc(r.id || "") +
      '" data-n="' +
      esc(r.nome) +
      '"><b>' +
      esc(r.nome) +
      "</b><span>" +
      kgf(r.kg) +
      " kg × " +
      r.reps +
      " · " +
      fd(r.ts) +
      " ↗</span></button>";
  });
  return h + "</div>";
}
function pesoHTML() {
  var pts = S.pesi.map(function (q) {
    return { x: q.ts, y: q.kg };
  });
  return (
    '<div class="card"><div class="meta" style="margin:0 0 6px;font-weight:600">Peso nel tempo</div>' +
    lineChart(pts, "Peso in kg") +
    '<div class="row" style="gap:8px;margin-top:10px"><input id="w-new" inputmode="decimal" placeholder="Peso di oggi in kg" aria-label="Nuovo peso" style="flex:1"><button class="btn small" data-act="add-peso">Aggiungi</button></div></div>'
  );
}
function grafHTML() {
  var k = sheet,
    pts = exHistory(k.ex),
    cut = k.r === "3m" ? Date.now() - 92 * 864e5 : 0;
  var data = pts
    .filter(function (q) {
      return q.ts >= cut;
    })
    .map(function (q) {
      return { x: q.ts, y: k.m === "vol" ? q.vol : q.e1 };
    });
  var u = function (m, r, t) {
    return (
      '<button class="btn small' +
      ((m && k.m === m) || (r && k.r === r) ? " primary" : "") +
      '" data-act="' +
      (m ? "graf-m" : "graf-r") +
      '" data-' +
      (m ? "m" : "r") +
      '="' +
      (m || r) +
      '">' +
      t +
      "</button>"
    );
  };
  var b =
    '<div class="row" style="gap:6px;margin-bottom:6px">' +
    u("e1", "", "Massimale") +
    u("vol", "", "Volume") +
    '<span class="grow"></span>' +
    u("", "3m", "3 mesi") +
    u("", "all", "Tutto") +
    "</div>";
  b += lineChart(data, (k.m === "vol" ? "Volume" : "Massimale stimato") + " " + k.ex.nome);
  if (data.length) {
    var f = data[0].y,
      l = data[data.length - 1].y,
      mx = Math.max.apply(
        null,
        data.map(function (q) {
          return q.y;
        })
      );
    b +=
      '<p class="meta" style="margin-top:8px">' +
      data.length +
      (data.length === 1 ? " allenamento" : " allenamenti") +
      " · ultimo " +
      kgf(Math.round(l * 10) / 10) +
      " kg · migliore " +
      kgf(Math.round(mx * 10) / 10) +
      " kg" +
      (data.length > 1 ? " · " + (l >= f ? "+" : "") + kgf(Math.round((l - f) * 10) / 10) + " dall'inizio" : "") +
      "</p>";
  }
  var lg = exLogs(k.ex),
    lastSid = null;
  if (lg.length) {
    b += '<div class="meta" style="margin:16px 0 2px;font-weight:600">Storico per sessione</div>';
    lg.forEach(function (q) {
      if (q.sid !== lastSid) {
        var sx = S.sessioni.find(function (z) {
          return z.id === q.sid;
        });
        b += '<div class="meta" style="margin-top:8px"><b>' + esc(sx ? sx.nome : "Sessione") + "</b></div>";
        lastSid = q.sid;
      }
      b +=
        '<div class="prrow"><b>' +
        fd(q.ts) +
        "</b><span>" +
        q.sets
          .map(function (x) {
            return (x.w ? "R " : "") + kgf(num(x.kg)) + "×" + x.reps;
          })
          .join(" · ") +
        "</span></div>";
    });
  }
  b +=
    '<p class="hint">' +
    (k.m === "vol" ? "Volume = somma di kg × ripetizioni." : "Massimale stimato con la formula di Epley: kg × (1 + ripetizioni / 30).") +
    '</p><button class="btn wide" style="margin-top:12px" data-act="close-sheet">Chiudi</button>';
  return sheetShell(k.ex.nome, b, "");
}
function prHTML() {
  var b = '<p class="meta" style="margin:0 0 8px">Hai migliorato il tuo storico:</p>';
  sheet.prs.forEach(function (q) {
    b += '<div class="prrow"><b>' + esc(q.nome) + "</b><span>" + esc(q.tipo) + " · " + esc(q.val) + "</span></div>";
  });
  return sheetShell("Nuovo record 🏆", b + '<button class="btn primary wide" style="margin-top:14px" data-act="close-sheet">Ottimo!</button>', "");
}

ACT["hist-m"] = function (d) {
  hm = d.m;
  render();
};
ACT["graf"] = function (d) {
  sheet = { kind: "graf", ex: { id: d.eid, nome: d.n }, m: "e1", r: "all" };
  render();
};
ACT["graf-m"] = function (d) {
  sheet.m = d.m;
  render();
};
ACT["graf-r"] = function (d) {
  sheet.r = d.r;
  render();
};

SHEETS.graf = { html: grafHTML, save: closeSheet };
SHEETS.pr = { html: prHTML, save: closeSheet };

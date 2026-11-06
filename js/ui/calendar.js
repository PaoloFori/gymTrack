/* Calendario degli allenamenti: riquadro in fondo alla Home (mese + dettaglio del giorno scelto). */
function calCard() {
  var now = new Date(),
    base = new Date(now.getFullYear(), now.getMonth() + calM, 1),
    y = base.getFullYear(),
    m = base.getMonth(),
    first = (base.getDay() + 6) % 7,
    dim = new Date(y, m + 1, 0).getDate(),
    by = {},
    today = sod(Date.now()),
    nDays = 0,
    nTot = 0;
  LOG.forEach(function (l) {
    var k = sod(l.ts);
    (by[k] = by[k] || []).push(l);
  });
  var h =
    '<div class="meta" style="margin:6px 0 0;font-weight:600">Calendario</div><div class="card"><div class="row" style="margin-bottom:10px"><button class="ib" data-act="cal-prev" aria-label="Mese precedente">‹</button><div class="grow" style="text-align:center;font-family:var(--display);font-size:22px;text-transform:uppercase">' +
    esc(base.toLocaleDateString("it-IT", { month: "long", year: "numeric" })) +
    '</div><button class="ib" data-act="cal-next" aria-label="Mese successivo"' +
    (calM >= 0 ? " disabled" : "") +
    '>›</button></div><div class="cal">';
  ["L", "M", "M", "G", "V", "S", "D"].forEach(function (d) {
    h += '<div class="dh">' + d + "</div>";
  });
  for (var i = 0; i < first; i++) h += '<div class="d e"></div>';
  for (var d = 1; d <= dim; d++) {
    var ts = new Date(y, m, d).getTime(),
      L = by[ts],
      cls = "d" + (L ? " has" : "") + (ts === today ? " today" : "") + (calSel === ts ? " sel" : "");
    if (L) {
      nDays++;
      nTot += L.length;
      h +=
        '<button class="' + cls + '" data-act="cal-day" data-ts="' + ts + '" aria-label="' + d + ', allenamento">' + d + "<span>🏋️</span></button>";
    } else h += '<div class="' + cls + '">' + d + "</div>";
  }
  h +=
    '</div><p class="hint" style="margin-top:10px">' +
    (nTot ? nDays + (nDays === 1 ? " giorno" : " giorni") + " di allenamento in questo mese." : "Nessun allenamento in questo mese.") +
    (nTot ? " Tocca un giorno con 🏋️ per i dettagli." : "") +
    "</p></div>";
  var sel = calSel && by[calSel];
  if (sel) {
    h += '<div class="card"><div class="meta" style="margin:0 0 6px;font-weight:600">' + esc(fdl(calSel)) + "</div>";
    sel
      .slice()
      .reverse()
      .forEach(function (l) {
        var vol = 0;
        (l.ex || []).forEach(function (e) {
          vol += exVol(e.sets);
        });
        h +=
          '<div style="padding:8px 0;border-top:1px solid var(--line)"><div style="font-weight:600">' +
          esc(l.schedaNome) +
          '</div><div class="meta">' +
          new Date(l.ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) +
          (l.durMin ? " · " + l.durMin + " min" : "") +
          " · " +
          Math.round(vol) +
          " kg" +
          (l.fat ? " · fatica " + l.fat + "/5" : "") +
          "</div>";
        (l.ex || []).forEach(function (e) {
          h +=
            '<div class="meta">' +
            esc(e.nome) +
            ": " +
            e.sets
              .map(function (x) {
                return (x.w ? "R " : "") + kgf(num(x.kg)) + "×" + x.reps;
              })
              .join(" · ") +
            "</div>";
        });
        (l.prs || []).forEach(function (q) {
          h += '<div class="meta" style="color:var(--ok);font-weight:600">🏆 ' + esc(q.nome) + " · " + esc(q.tipo) + " " + esc(q.val) + "</div>";
        });
        if (l.nota) h += '<div class="meta"><i>' + esc(l.nota) + "</i></div>";
        h += "</div>";
      });
    h += "</div>";
  }
  return h;
}

ACT["cal-prev"] = function (d) {
  calM--;
  calSel = null;
  render();
};
ACT["cal-next"] = function (d) {
  if (calM < 0) {
    calM++;
    calSel = null;
    render();
  }
};
ACT["cal-day"] = function (d) {
  calSel = calSel === Number(d.ts) ? null : Number(d.ts);
  render();
};

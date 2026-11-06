/* Schermate dell'allenamento: lista esercizi e dettaglio esercizio. */
function vWorkout() {
  var w = session,
    nd = w.ex.filter(function (e) {
      return e.completed;
    }).length;
  var h =
    hdr(w.schedaNome, nd + " di " + w.ex.length + " esercizi completati", false) +
    '<div class="stack"><div class="card chrono"><span class="l">Durata scheda<small>Non mettere in stand by: tieni lo schermo acceso</small></span><b id="elapsed">0:00</b></div>';
  w.ex.forEach(function (e, ei) {
    var n = e.sets.filter(function (x) {
      return x.done;
    }).length;
    h +=
      '<button class="xrow' +
      (e.completed ? " ok" : n ? " part" : "") +
      '" data-act="open-ex" data-e="' +
      ei +
      '"><span class="dot">✓</span><span class="grow"><b class="xn">' +
      esc(e.nome) +
      '</b><span class="meta">' +
      e.serie +
      " serie · " +
      esc(e.reps) +
      " ripetizioni · recupero " +
      fmtRec(e.rec) +
      (n && !e.completed ? " · " + n + "/" + e.sets.length + " fatte" : "") +
      (e.sup ? " · superset ↓" : "") +
      "</span></span>" +
      gifImg(e.gif, "md") +
      "</button>";
  });
  return (
    h +
    '<p class="hint">Tocca un esercizio per aprirlo. Con «Fine scheda» l\'allenamento viene salvato come fatto. Le GIF sono di Gym visual (gymvisual.com), tramite il dataset hasaneyldrm/exercises-dataset.</p></div>'
  );
}
function vEx() {
  var w = session,
    ei = view.i,
    e = w.ex[ei];
  if (!e) {
    view = { name: "workout" };
    return vWorkout();
  }
  var h = hdr(e.nome, "Esercizio " + (ei + 1) + " di " + w.ex.length, true) + '<div class="stack"><div class="card">';
  if (e.gif) h += gifImg(e.gif, "big");
  h +=
    '<div class="chips"><span>' +
    e.serie +
    " serie</span><span>" +
    esc(e.reps) +
    " ripetizioni</span><span>recupero " +
    fmtRec(e.rec) +
    "</span>" +
    (e.sup ? '<span class="ss">Superset ↓</span>' : "") +
    (e.riscal ? "<span>" + e.riscal + " risc.</span>" : "") +
    "</div>";
  if (e.note) h += '<p class="meta"><b>Note:</b> <i>' + esc(e.note) + "</i></p>";
  var prevSup = ei > 0 && w.ex[ei - 1].sup;
  if (prevSup) h += '<p class="meta">Superset con ' + esc(w.ex[ei - 1].nome) + ": niente pausa tra i due.</p>";
  h +=
    '<p class="hint">' +
    (e.prev && e.prev.length
      ? "Ultima volta" +
        (e.prevTs ? " (" + fd(e.prevTs) + ")" : "") +
        ": " +
        e.prev
          .map(function (s) {
            return kgf(num(s.kg)) + " kg × " + s.reps;
          })
          .join(" · ")
      : "Prima volta: inserisci i carichi.") +
    "</p></div>";
  h += '<div class="card"><div class="sets"><div class="h">Serie</div><div class="h">kg</div><div class="h">Rip</div><div class="h"></div>';
  var cnt = 0;
  e.sets.forEach(function (s, si) {
    if (!s.w) cnt++;
    h +=
      '<div class="rowc' +
      (s.done ? " done" : "") +
      '"><span class="sn' +
      (s.w ? " w" : "") +
      '">' +
      (s.w ? "R" : cnt) +
      '</span><input inputmode="decimal" data-f="kg" data-e="' +
      ei +
      '" data-s="' +
      si +
      '" value="' +
      esc(s.kg) +
      '"' +
      (s.done ? " readonly" : "") +
      ' aria-label="Kg serie ' +
      (si + 1) +
      '"><input inputmode="numeric" data-f="reps" data-e="' +
      ei +
      '" data-s="' +
      si +
      '" value="' +
      esc(s.reps) +
      '"' +
      (s.done ? " readonly" : "") +
      ' aria-label="Ripetizioni serie ' +
      (si + 1) +
      '"><button class="ck" data-act="set-done" data-e="' +
      ei +
      '" data-s="' +
      si +
      '"' +
      (s.done ? " disabled" : "") +
      ' aria-label="' +
      (s.done ? "Serie fatta" : "Segna serie fatta") +
      '">✓</button></div>';
  });
  var last = e.sets[e.sets.length - 1],
    canRm = last && last.added && !last.done;
  h +=
    '</div><div class="row" style="margin-top:12px"><button class="btn small" data-act="add-set" data-e="' +
    ei +
    '">+ Aggiungi serie</button><button class="btn small" data-act="rm-set" data-e="' +
    ei +
    '"' +
    (canRm ? "" : " disabled") +
    '>− Togli serie aggiunta</button></div><p class="hint">Cambia kg e ripetizioni quando vuoi, finché la serie non è fatta. Una serie segnata come fatta non si può annullare; si possono togliere solo quelle aggiunte da te.</p></div>';
  return h + "</div>";
}

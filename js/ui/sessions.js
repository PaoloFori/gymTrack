/* Pagina Sessioni (corrente + storico) e griglie di avatar con selezione. */
function delBar(act, armKey, one, many) {
  return (
    '<button class="btn danger wide" style="margin-top:12px" data-act="' +
    act +
    '"' +
    (selIds.length ? "" : " disabled") +
    ">" +
    (armed === armKey
      ? "Tocca ancora: elimina " + selIds.length
      : selIds.length
        ? "Elimina " + selIds.length + " " + (selIds.length === 1 ? one : many)
        : "Scegli cosa eliminare") +
    "</button>"
  );
}
function vSessioni() {
  var a = attiva(),
    past = S.sessioni
      .filter(function (x) {
        return x.chiusa;
      })
      .slice()
      .reverse();
  var h = hdr("Sessioni", "Corrente e storico", false) + '<div class="stack">';
  h += '<div class="meta" style="margin:0;font-weight:600">Sessione corrente</div>';
  if (a) h += sessCard(a);
  else
    h +=
      '<div class="card"><h3>Nessuna sessione in corso</h3><p class="meta" style="margin:6px 0 0">Una sessione dura da 1 a 12 mesi, ha le sue schede e il suo avatar: cresce a ogni allenamento e, se completi tutti gli allenamenti della settimana, ottiene un boost d\'aura. Se ne salti, ingrassa.</p></div>';
  h +=
    '<div class="grid2"><button class="btn primary" data-act="new-sess">+ Nuova sessione</button><button class="btn" data-act="imp-sess">Carica JSON</button></div>';
  if (past.length) {
    h +=
      '<div class="card"><div class="row" style="margin-bottom:8px"><div class="meta grow" style="margin:0;font-weight:600">Storico sessioni</div><button class="btn small" data-act="sel-mode">' +
      (selMode ? "Annulla" : "Seleziona") +
      "</button></div>" +
      avGridItems(past, selMode);
    h += selMode
      ? delBar("del-sess", "ds", "sessione", "sessioni") +
        '<p class="hint">Vengono eliminati anche gli allenamenti registrati in quelle sessioni. Le diete collegate solo a queste sessioni restano nell\'archivio delle diete.</p>'
      : '<p class="hint">Tocca un avatar per vedere schede e allenamenti di quella sessione.</p>';
    h += "</div>";
  }
  return h + "</div>";
}
function avGridItems(list, sel) {
  var h = '<div class="avgrid">';
  list.forEach(function (x) {
    var st, label, sub;
    if (x.chiusa) {
      var f = x.finale || {};
      st = { p: f.p || 0, fat: f.fat || 0, aura: f.aura || 0 };
      label = livello({ P: f.P || 0, fat: f.fat || 0 }, x.obiettivo);
      sub = "forma " + Math.round(f.P || 0);
    } else {
      var g = progress(x);
      st = { p: g.p, fat: g.fat, aura: g.aura };
      label = livello(g, x.obiettivo);
      sub = "in corso";
    }
    h +=
      (sel
        ? '<button class="avc sel" data-act="sel-sess" data-id="' +
          x.id +
          '" aria-pressed="' +
          (selIds.indexOf(x.id) >= 0) +
          '" aria-label="Seleziona ' +
          esc(x.nome) +
          '"><span class="cb">✓</span>'
        : '<button class="avc" data-act="open-sess" data-id="' + x.id + '" aria-label="Apri ' + esc(x.nome) + '">') +
      avatarSVG(x.tipo, st, x) +
      "<b>" +
      esc(x.nome) +
      '</b><span class="meta">' +
      esc(label) +
      " · " +
      sub +
      (st.aura ? " · aura " + st.aura : "") +
      '</span><span class="meta">' +
      esc(x.obiettivo) +
      " · " +
      fd(x.start) +
      " – " +
      fd(x.chiuseTs || endOf(x)) +
      "</span></button>";
  });
  return h + "</div>";
}
function avatarGrid() {
  var h =
    '<div class="card"><div class="row" style="margin-bottom:8px"><div class="meta grow" style="margin:0;font-weight:600">I miei avatar</div>' +
    (S.sessioni.length ? '<button class="btn small" data-act="sel-mode">' + (selMode ? "Annulla" : "Seleziona") + "</button>" : "") +
    "</div>";
  if (!S.sessioni.length)
    return h + '<p class="meta">Qui compaiono gli avatar di tutte le tue sessioni, quelle concluse e quella in corso.</p></div>';
  h += avGridItems(S.sessioni.slice().reverse(), selMode);
  if (selMode)
    return (
      h +
      '<button class="btn danger wide" style="margin-top:12px" data-act="del-sess"' +
      (selIds.length ? "" : " disabled") +
      ">" +
      (armed === "ds"
        ? "Tocca ancora: elimina " + selIds.length + (selIds.length === 1 ? " sessione" : " sessioni") + " e i suoi allenamenti"
        : selIds.length
          ? "Elimina " + selIds.length + (selIds.length === 1 ? " sessione" : " sessioni")
          : "Scegli le sessioni da eliminare") +
      '</button><p class="hint">Vengono eliminati anche gli allenamenti registrati in quelle sessioni. Le diete collegate solo a queste sessioni vengono eliminate.</p></div>'
    );
  return h + '<p class="hint">Tocca un avatar per vedere la sessione.</p></div>';
}

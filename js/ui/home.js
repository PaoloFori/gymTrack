/* Home: riepilogo con profilo, avatar corrente, sessione e dieta correnti e collegamento tra i due. */
function sessLevel(x) {
  if (x.chiusa) {
    var F = x.finale || {};
    return {
      st: { p: F.p || 0, fat: F.fat || 0, aura: F.aura || 0 },
      label: livello({ P: F.P || 0, fat: F.fat || 0 }, x.obiettivo),
      P: F.P || 0,
      g: null
    };
  }
  var g = progress(x);
  return { st: { p: g.p, fat: g.fat, aura: g.aura }, label: livello(g, x.obiettivo), P: g.P, g: g };
}
function chevron() {
  return '<span class="chev2">›</span>';
}
function sessCard(a) {
  var L = sessLevel(a),
    g = L.g,
    d = dietOf(a);
  return (
    '<button class="curcard" data-act="open-sess" data-id="' +
    a.id +
    '"><span class="mini">' +
    avatarSVG(a.tipo, L.st, a) +
    '</span><span class="grow"><b class="xn">' +
    esc(a.nome) +
    '</b><span class="meta">' +
    esc(a.obiettivo) +
    " · " +
    esc(L.label) +
    " · forma " +
    Math.round(L.P) +
    '</span><span class="prog" style="margin:6px 0 2px"><i style="width:' +
    L.P.toFixed(1) +
    '%"></i></span><span class="meta">' +
    (g ? (g.over ? "Sessione terminata" : "Questa settimana " + g.thisC + " / " + g.thisT + " allenamenti · finisce il " + fd(g.end)) : "") +
    (d ? " · dieta «" + esc(d.nome) + "»" : "") +
    "</span></span>" +
    chevron() +
    "</button>"
  );
}
function vHome() {
  var p = S.profile,
    a = attiva(),
    d = a ? dietOf(a) : null,
    h = hdr("Home", p.nome ? "Ciao " + p.nome : "Il tuo riepilogo", false) + '<div class="stack">' + backupBanner();
  var meta = [p.eta ? esc(p.eta) + " anni" : "", p.altezza ? esc(p.altezza) + " cm" : "", p.peso ? esc(p.peso) + " kg" : ""]
    .filter(Boolean)
    .join(" · ");
  h +=
    '<div class="card"><div class="row" style="gap:14px"><div class="pfoto" style="width:64px;height:64px">' +
    (p.foto
      ? '<img src="' + esc(p.foto) + '" alt="Foto profilo">'
      : '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>') +
    '</div><div class="grow"><b style="font-size:18px">' +
    esc(p.nome || "Il tuo profilo") +
    '</b><div class="meta">' +
    (meta || "Completa i tuoi dati nel Profilo") +
    '</div></div><button class="btn small" data-act="tab" data-v="profilo">Profilo</button></div></div>';
  if (a) {
    var g = progress(a),
      lv = livello(g, a.obiettivo);
    h +=
      '<div class="card"><div class="avstage">' +
      avatarSVG(a.tipo, { p: g.p, fat: g.fat, aura: g.aura, anim: d ? "diet" : "train" }, a) +
      '</div><div class="row" style="margin-top:12px"><div class="lvl grow">' +
      esc(lv) +
      '</div><div class="meta" style="font-weight:600">Forma ' +
      Math.round(g.P) +
      ' / 100</div></div><div class="prog"><i style="width:' +
      g.P.toFixed(1) +
      '%"></i></div><p class="meta">' +
      (d
        ? "Si allena e mangia sano: segue la dieta «" + esc(d.nome) + "»."
        : "Si allena. Collega una dieta alla sessione per vederlo anche mangiare sano.") +
      "</p></div>";
    h += '<div class="meta" style="margin:6px 0 0;font-weight:600">Sessione corrente</div>' + sessCard(a);
  } else {
    h +=
      '<div class="card"><h3>Nessuna sessione in corso</h3><p class="meta" style="margin:6px 0 12px">Inizia una sessione per avere il tuo avatar che si allena.</p><button class="btn primary wide" data-act="new-sess">Inizia sessione</button></div>';
  }
  h += '<div class="meta" style="margin:6px 0 0;font-weight:600">Dieta corrente</div>';
  if (d)
    h +=
      '<button class="curcard" data-act="open-diet" data-id="' +
      d.id +
      '"><span class="ico"><svg viewBox="0 0 24 24">' +
      TABS[2].i +
      '</svg></span><span class="grow"><b class="xn">' +
      esc(d.nome) +
      '</b><span class="meta">Oggi: ' +
      esc(
        (d.plan[todayI()] || [])
          .map(function (m) {
            return m.t;
          })
          .join(", ") || "—"
      ) +
      "</span></span>" +
      chevron() +
      "</button>";
  else h += '<div class="card"><p class="meta" style="margin:0">Nessuna dieta collegata alla sessione corrente.</p></div>';
  if (a) {
    h +=
      '<div class="card"><div class="meta" style="margin:0 0 6px;font-weight:600">Collega una dieta alla sessione corrente</div><div class="eqs"><button class="eq" data-act="link-diet" data-id="" aria-pressed="' +
      !a.dietId +
      '"><span>' +
      (a.dietId ? "+" : "✓") +
      "</span> Nessuna dieta</button>" +
      S.diete
        .map(function (x) {
          var on = a.dietId === x.id;
          return (
            '<button class="eq" data-act="link-diet" data-id="' +
            x.id +
            '" aria-pressed="' +
            on +
            '"><span>' +
            (on ? "✓" : "+") +
            "</span> " +
            esc(x.nome) +
            "</button>"
          );
        })
        .join("") +
      '</div><p class="hint">Una dieta può servire più sessioni; una sessione può anche non avere dieta. Con una dieta collegata l\'avatar si allena e mangia sano.</p>' +
      (S.diete.length ? "" : '<button class="btn small" data-act="d-new">Crea una dieta</button>') +
      "</div>";
  }
  return h + "</div>";
}

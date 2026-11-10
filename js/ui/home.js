/* Home: profilo (si apre con un tocco), riquadro dell'avatar animato (collegamento sessione↔dieta) e calendario in fondo. */
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
function profileCard() {
  var p = S.profile,
    meta = [p.eta ? esc(p.eta) + " anni" : "", p.altezza ? esc(p.altezza) + " cm" : "", p.peso ? esc(p.peso) + " kg" : ""]
      .filter(Boolean)
      .join(" · ");
  var foto = p.foto
    ? `<img src="${esc(p.foto)}" alt="Foto profilo">`
    : '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
  return `<button class="curcard" data-act="open-profilo"><span class="pfoto" style="width:56px;height:56px">${foto}</span><span class="grow"><b class="xn">${esc(p.nome || "Il tuo profilo")}</b><span class="meta">${meta || "Tocca per inserire nome, età, altezza e peso"}</span></span>${chevron()}</button>`;
}
function dietLinkCard(d, lbl) {
  var oggi = (d.plan[todayI()] || []).map((m) => m.t).join(", ") || "—";
  return `<button class="curcard" data-act="open-diet" data-id="${d.id}"><span class="ico"><svg viewBox="0 0 24 24">${TABS[2].i}</svg></span><span class="grow"><span class="meta" style="margin:0">${lbl || "Dieta corrente"}</span><b class="xn">${esc(d.nome)}</b><span class="meta">Oggi: ${esc(oggi)}</span></span>${chevron()}</button>`;
}
/* Riquadro principale della Home («scheda suprema» è solo il nome interno): avatar che si muove + sessione e dieta correnti. Toccandola si aprono i rimandi alle due schede. */
function supremaCard(a) {
  if (!a)
    return `<div class="card"><span class="badge">Il tuo campione</span><h3 style="margin-top:8px">Nessuna sessione in corso</h3><p class="meta" style="margin:6px 0 12px">Qui trovi il tuo avatar e il collegamento tra sessione e dieta. Inizia una sessione per vederlo allenarsi.</p><button class="btn primary wide" data-act="new-sess">Inizia sessione</button></div>`;
  var g = progress(a),
    d = dietOf(a),
    lv = livello(g, a.obiettivo);
  var caption = d ? `Si allena e mangia sano: segue la dieta «${esc(d.nome)}».` : "Si allena. Collega una dieta per vederlo anche mangiare sano.";
  var h = `<div class="card suprema"><button class="supbtn" data-act="sup-toggle" aria-expanded="${supOpen}">
    <div class="row" style="margin-bottom:8px"><span class="badge">Il tuo campione</span><span class="meta grow" style="text-align:right">${esc(a.nome)}${d ? " + " + esc(d.nome) : ""}</span></div>
    <div class="avstage">${avatarSVG(a.tipo, { p: g.p, fat: g.fat, aura: g.aura, anim: d ? "diet" : "train" }, a)}</div>
    <div class="row" style="margin-top:12px"><div class="lvl grow">${esc(lv)}</div><div class="meta" style="font-weight:600">Forma ${Math.round(g.P)} / 100</div></div>
    <div class="prog"><i style="width:${g.P.toFixed(1)}%"></i></div>
    <p class="meta" style="margin:0">${caption}</p>
    <div class="supmore">${supOpen ? "Chiudi" : "Tocca per aprire sessione e dieta"}<span class="chev2" style="transform:rotate(${supOpen ? -90 : 90}deg)">›</span></div>
  </button>`;
  if (supOpen) {
    h += `<div class="suplinks">${sessCard(a)}${d ? dietLinkCard(d) : '<div class="card" style="margin:0"><p class="meta" style="margin:0">Nessuna dieta collegata alla sessione.</p></div>'}
      <div class="meta" style="margin:4px 0 0;font-weight:600">Dieta collegata alla sessione</div>
      <div class="eqs"><button class="eq" data-act="link-diet" data-id="" aria-pressed="${!a.dietId}"><span>${a.dietId ? "+" : "✓"}</span> Nessuna dieta</button>${S.diete
        .map(
          (x) =>
            `<button class="eq" data-act="link-diet" data-id="${x.id}" aria-pressed="${a.dietId === x.id}"><span>${a.dietId === x.id ? "✓" : "+"}</span> ${esc(x.nome)}</button>`
        )
        .join("")}</div>
      <p class="hint" style="margin:0">Una dieta può servire più sessioni; una sessione può anche non averne.${S.diete.length ? "" : " Non hai ancora diete: creane una dalla scheda Dieta."}</p></div>`;
  }
  return h + "</div>";
}
/* Diete correnti che non stanno in nessuna sessione: la «scheda madre» può avere solo la dieta. */
function soloDiets() {
  return curDiets()
    .filter(isSolo)
    .map((d) => dietLinkCard(d, "Dieta corrente · senza sessione"))
    .join("");
}
function vHome() {
  var p = S.profile;
  return (
    hdr("Home", p.nome ? "Ciao " + p.nome : "Il tuo riepilogo", false) +
    `<div class="stack">${backupBanner()}${profileCard()}${supremaCard(attiva())}${soloDiets()}${calCard()}</div>`
  );
}
ACT["sup-toggle"] = function () {
  supOpen = !supOpen;
  render();
};
VIEWS.home = vHome;

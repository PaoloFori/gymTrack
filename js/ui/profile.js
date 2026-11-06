/* Profilo: dati personali (si apre dalla Home), notifiche, accessori, backup. */
function vProfilo() {
  var p = S.profile;
  var h =
    hdr(
      p.nome || "Profilo",
      p.nome ? "Dati personali e impostazioni" : "Inserisci i tuoi dati",
      true,
      '<button class="btn small" data-act="open-tema">Tema app</button>'
    ) + '<div class="stack">';
  h +=
    '<div class="card"><div class="row" style="gap:14px"><div class="pfoto">' +
    (p.foto
      ? '<img src="' + esc(p.foto) + '" alt="Foto profilo">'
      : '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>') +
    '</div><div class="grow"><label class="btn small" for="p-foto" style="display:inline-block">' +
    (p.foto ? "Cambia foto" : "Aggiungi foto") +
    '</label><input type="file" id="p-foto" accept="image/*" hidden></div></div>';
  h +=
    '<div class="field" style="margin-top:14px"><label for="p-nome">Nome</label><input id="p-nome" data-p="nome" value="' +
    esc(p.nome) +
    '" autocomplete="off"></div>';
  h +=
    '<div class="grid3" style="margin:0"><div class="field"><label for="p-eta">Età</label><input id="p-eta" data-p="eta" inputmode="numeric" value="' +
    esc(p.eta) +
    '"></div><div class="field"><label for="p-altezza">Altezza cm</label><input id="p-altezza" data-p="altezza" inputmode="numeric" value="' +
    esc(p.altezza) +
    '"></div><div class="field"><label for="p-peso">Peso kg</label><input id="p-peso" data-p="peso" inputmode="decimal" value="' +
    esc(p.peso) +
    '"></div></div>';
  h +=
    '<p class="hint" style="margin:0">Altezza e peso servono per costruire l\'avatar di ogni sessione. Il grafico del peso è in Analisi.</p></div>';
  var ns = notifState(),
    nt =
      ns === "no"
        ? "Non supportate in questo browser."
        : ns === "granted"
          ? "Attive: a fine recupero ricevi una notifica, con suono e vibrazione."
          : ns === "denied"
            ? "Bloccate: riattivale dalle impostazioni del telefono per questo sito."
            : "Non ancora attive.";
  h +=
    '<div class="card"><div class="meta" style="margin:0 0 6px;font-weight:600">Notifiche di recupero</div><p class="hint" style="margin:0 0 8px">' +
    nt +
    " Arrivano se l'app è aperta o appena passata in secondo piano; su iPhone solo se l'hai aggiunta alla Home. Con lo schermo acceso i timer restano precisi: durante l'allenamento l'app lo tiene acceso.</p>" +
    (ns === "default" ? '<button class="btn small" data-act="notif-on">Attiva notifiche</button>' : "") +
    "</div>";
  h +=
    '<div class="card"><div class="meta" style="margin:0 0 6px;font-weight:600">Accessori avatar</div><p class="hint" style="margin:0">Si sbloccano con i boost d\'aura di ogni sessione: fascia (1), cintura (3), mantello (5), corona (7).</p></div>';
  h +=
    '<div class="card"><div class="meta" style="margin:0 0 6px;font-weight:600">Backup</div><p class="hint" style="margin:0 0 8px">' +
    (mode === "cloud"
      ? "I dati sono salvati nel tuo account."
      : "I dati sono sul telefono. L'app tiene da sola una copia al giorno (ultimi 7 giorni) e chiede al browser di non cancellarli. Per metterli al sicuro fuori dal telefono salva il file in Drive, iCloud o email.") +
    '</p><button class="btn small" data-act="export-bk">' +
    (CLOUD ? "Copia backup" : "Salva backup (Drive, iCloud…)") +
    "</button>";
  if (mode !== "cloud" && autoList.length) {
    h += '<div class="meta" style="margin:14px 0 2px;font-weight:600">Copie automatiche su questo telefono</div>';
    autoList.forEach(function (x) {
      h +=
        '<div class="autol"><span class="grow">' +
        fd(x.v.ts) +
        " · " +
        x.v.n +
        " allenamenti · " +
        x.v.ns +
        (x.v.ns === 1 ? " sessione" : " sessioni") +
        '</span><button class="btn small" data-act="auto-restore" data-k="' +
        esc(x.k) +
        '">' +
        (armed === "ar" + x.k ? "Conferma" : "Ripristina") +
        "</button></div>";
    });
  }
  h +=
    '<div class="field" style="margin:14px 0 0"><label for="bk">Ripristina da file di backup</label><textarea id="bk" data-sf="bk" rows="2" class="mono" placeholder="Incolla qui il contenuto del file"></textarea></div><button class="btn small" data-act="import-bk">' +
    (armed === "bk" ? "Tocca ancora: sovrascrive tutto" : "Ripristina") +
    "</button></div>";
  return h + "</div>";
}

ACT["add-peso"] = function (d) {
  var wv = val("w-new");
  if (logPeso(wv)) {
    S.profile.peso = String(num(wv)).replace(".", ",");
    saveApp();
    render();
    toast("Peso aggiunto");
  } else toast("Inserisci un peso valido");
};
ACT["export-bk"] = function (d) {
  exportBk();
};
ACT["auto-restore"] = function (d) {
  var rec = autoList.filter(function (x) {
    return x.k === d.k;
  })[0];
  if (!rec) return;
  if (!confirmed("ar" + d.k)) return;
  try {
    var ob = JSON.parse(rec.v.txt);
    S = normalize(ob.S);
    LOG = Array.isArray(ob.LOG) ? ob.LOG : [];
    saveApp();
    view = { name: "home" };
    render();
    toast("Copia ripristinata");
  } catch (e) {
    toast("Copia non valida");
  }
};
ACT["notif-on"] = function (d) {
  try {
    Notification.requestPermission().then(
      function () {
        render();
      },
      function () {
        toast("Notifiche non disponibili qui");
      }
    );
  } catch (e) {
    toast("Notifiche non disponibili qui");
  }
};
ACT["import-bk"] = function (d) {
  importBk();
};

function processPhoto(file) {
  if (!file) return;
  var fr = new FileReader();
  fr.onload = function () {
    var img = new Image();
    img.onload = function () {
      var sz = Math.min(img.width, img.height),
        cv = document.createElement("canvas");
      cv.width = cv.height = 192;
      cv.getContext("2d").drawImage(img, (img.width - sz) / 2, (img.height - sz) / 2, sz, sz, 0, 0, 192, 192);
      S.profile.foto = cv.toDataURL("image/jpeg", 0.8);
      saveApp();
      render();
    };
    img.onerror = function () {
      toast("Immagine non valida");
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}
HOOKS.change.push(function (t) {
  if (t.id === "p-foto") {
    processPhoto(t.files && t.files[0]);
    return true;
  }
  if (t.dataset.p) {
    S.profile[t.dataset.p] = t.value;
    if (t.dataset.p === "peso") logPeso(t.value);
    saveApp();
    if (t.dataset.p === "nome") {
      var y = window.scrollY;
      render();
      window.scrollTo(0, y);
    }
    return true;
  }
});

ACT["open-profilo"] = function () {
  view = { name: "profilo" };
  edit = false;
  refreshAuto();
  render();
  window.scrollTo(0, 0);
};
VIEWS.profilo = vProfilo;

/* Finestra «Schede con IA» (con IA collegata oppure copia-incolla del prompt) e richiesta via email. I testi dei prompt sono in prompts.js. */
function aiSheetHTML() {
  var k = sheet,
    a = attiva(),
    b =
      AI_WARN_HTML +
      '<p class="meta" style="margin:0 0 12px">Crea ' +
      a.giorni +
      " schede per questa sessione (" +
      a.mesi +
      " mesi) partendo dal tuo profilo, dalle sessioni passate e dai carichi usati. Spunta le attrezzature della tua palestra.</p>";
  Object.keys(EQ).forEach(function (g) {
    b +=
      '<div class="eqg"><div class="row"><b style="flex:1">' +
      g +
      '</b><button class="btn small" data-act="eq-all" data-g="' +
      g +
      '">Tutti</button><button class="btn small" data-act="eq-none" data-g="' +
      g +
      '">Nessuno</button></div><div class="eqs">';
    EQ[g].forEach(function (n) {
      b +=
        '<label class="eq"><input type="checkbox" data-eq="' +
        esc(n) +
        '"' +
        (S.attrezzi.indexOf(n) >= 0 ? " checked" : "") +
        "> " +
        esc(n) +
        "</label>";
    });
    b += "</div></div>";
  });
  b +=
    '<div class="grid2"><div class="field"><label for="ai-min">Minuti per allenamento</label><input id="ai-min" data-sf="min" inputmode="numeric" value="' +
    esc(k.min) +
    '"></div><div class="field"><label>Allenamenti a settimana</label><div class="meta" style="padding:12px 0">' +
    a.giorni +
    " (dalla sessione)</div></div></div>";
  b +=
    '<div class="field"><label for="ai-note">Cosa vorresti ottenere / richieste (facoltativo)</label><textarea id="ai-note" data-sf="note" rows="2" placeholder="Es. niente esercizi con bilanciere sopra la testa">' +
    esc(k.note || "") +
    "</textarea></div>";
  if (k.step === "mail") return mailSheet();
  if (k.err) b += '<p class="meta" style="color:var(--danger);margin-bottom:10px">' + esc(k.err) + "</p>";
  var mailBtn = '<button class="btn wide" style="margin-top:8px" data-act="mail-step">Oppure invia la richiesta per email</button>';
  if (aiFn)
    return sheetShell(
      "Schede con IA",
      b,
      k.busy
        ? '<p class="meta">Sto creando le schede, può volerci un minuto.</p><button class="btn wide" data-act="stop-ai">Interrompi</button>'
        : '<div class="grid2"><button class="btn" data-act="close-sheet">Annulla</button><button class="btn primary" data-act="gen-ai">Genera schede</button></div>' +
            mailBtn
    );
  if (!k.prompt)
    return sheetShell(
      "Schede con IA",
      b +
        '<p class="hint" style="margin-bottom:10px">Qui l\'IA non è collegata: preparo il testo da incollare in un assistente (come Claude), poi importi la risposta.</p>',
      '<div class="grid2"><button class="btn" data-act="close-sheet">Annulla</button><button class="btn primary" data-act="prep-prompt">Prepara testo</button></div>' +
        mailBtn
    );
  b +=
    '<div class="field"><label for="ai-prompt">1. Copia questo testo in un assistente IA</label><textarea id="ai-prompt" readonly rows="5" class="mono">' +
    esc(k.prompt) +
    '</textarea></div><button class="btn small" style="margin-bottom:12px" data-act="copy-prompt">Copia testo</button>';
  b +=
    '<div class="field"><label for="ai-paste">2. Incolla qui la risposta</label><textarea id="ai-paste" data-sf="paste" rows="4" class="mono">' +
    esc(k.paste || "") +
    "</textarea></div>";
  return sheetShell(
    "Schede con IA",
    b,
    '<div class="grid2"><button class="btn" data-act="close-sheet">Annulla</button><button class="btn primary" data-act="import-ai">Importa schede</button></div>' +
      mailBtn
  );
}
function mailHref() {
  var to = sheet && sheet.mail !== undefined ? sheet.mail : S.profile.coachEmail || "";
  return (
    "mailto:" +
    encodeURIComponent(to.trim()).replace(/%40/g, "@") +
    "?subject=" +
    encodeURIComponent("Richiesta scheda di allenamento · " + (S.profile.nome || "GymTrack")) +
    "&body=" +
    encodeURIComponent(mailText())
  );
}
function mailSheet() {
  var k = sheet,
    a = attiva(),
    to = k.mail !== undefined ? k.mail : S.profile.coachEmail || "",
    txt = mailText(),
    subj = "Richiesta scheda di allenamento · " + (S.profile.nome || "GymTrack");
  var href = mailHref();
  var b =
    '<p class="meta" style="margin:0 0 12px">Preparo una email con tutti i tuoi dati: profilo, obiettivo, allenamenti a settimana, minuti, attrezzi e schede passate. La mandi al tuo preparatore con la tua app email.</p><div class="field"><label for="ai-mail">Email del destinatario (facoltativo)</label><input id="ai-mail" data-sf="mail" type="email" inputmode="email" value="' +
    esc(to) +
    '" placeholder="preparatore@esempio.it" autocomplete="off"></div><div class="field"><label for="ai-mailtxt">Anteprima</label><textarea id="ai-mailtxt" readonly rows="8" class="mono">' +
    esc(txt) +
    "</textarea></div>";
  b +=
    '<a id="ai-mailgo" class="btn primary wide" style="text-align:center;text-decoration:none;display:block" href="' +
    esc(href) +
    '">Apri l\'app email</a><div class="grid2" style="margin-top:8px"><button class="btn" data-act="copy-mail">Copia testo</button><button class="btn" data-act="share-mail">Condividi</button></div><p class="hint">Se l\'app email non mostra tutto il testo, usa "Copia testo".</p>';
  return sheetShell("Richiesta per email", b, '<button class="btn wide" data-act="mail-back">Indietro</button>');
}
function aiCopy(c) {
  if (c === "cancelled") return "";
  if (c === "not_granted" || c === "sampling_disabled" || c === "not_declared") return "La generazione con IA non è consentita per questo account.";
  if (c === "rate_limited") return "Troppe richieste. Riprova tra qualche minuto.";
  return "Non sono riuscito a creare le schede. Riprova.";
}
function cleanSchede(d) {
  if (!d || !Array.isArray(d.schede)) return null;
  var out = d.schede
    .slice(0, 7)
    .map(function (g, i) {
      var es = (Array.isArray(g.esercizi) ? g.esercizi : [])
        .slice(0, 10)
        .filter(function (e) {
          return e && e.nome;
        })
        .map(function (e) {
          return {
            id: uid(),
            nome: String(e.nome).slice(0, 80),
            gruppo: GR.indexOf(e.gruppo) >= 0 ? e.gruppo : "Altro",
            serie: clamp(parseInt(e.serie, 10) || 3, 1, 10),
            reps: String(e.reps || "10").slice(0, 12),
            rec: clamp(parseInt(e.rec, 10) || 90, 0, 300),
            note: e.note ? String(e.note).slice(0, 100) : "",
            sup: e.sup === true,
            riscal: clamp(parseInt(e.riscal, 10) || 0, 0, 3),
            gif: matchGif(e.nome_en)
          };
        });
      return {
        id: uid(),
        nome: String(g.nome || "Giorno " + String.fromCharCode(65 + i)).slice(0, 60),
        note: g.note ? String(g.note).slice(0, 160) : "",
        ai: true,
        esercizi: es
      };
    })
    .filter(function (g) {
      return g.esercizi.length;
    });
  return out.length ? out : null;
}
function addAiSchede(list) {
  var a = attiva();
  list.forEach(function (s) {
    a.schede.push(s);
  });
  saveApp();
  sheet = null;
  view = { name: "corrente" };
  render();
  window.scrollTo(0, 0);
  toast(list.length + (list.length === 1 ? " scheda creata" : " schede create"));
}
async function genAI() {
  var k = sheet;
  if (!k || k.busy) return;
  if (!S.attrezzi.length) {
    k.err = "Spunta almeno un attrezzo presente nella tua palestra.";
    render();
    return;
  }
  k.err = "";
  k.busy = true;
  render();
  aiCtl = new AbortController();
  try {
    var list = cleanSchede(await aiFn.json(buildPrompt(k.note), { modelTier: "default", cache: false, signal: aiCtl.signal }));
    if (!list) throw { code: "invalid_json" };
    addAiSchede(list);
  } catch (e) {
    if (sheet === k) {
      k.busy = false;
      k.err = aiCopy(e && e.code);
      render();
    }
  }
}

ACT["mail-step"] = function (d) {
  S.attrezzi = S.attrezzi || [];
  sheet.step = "mail";
  render();
};
ACT["mail-back"] = function (d) {
  sheet.step = "";
  render();
};
ACT["copy-mail"] = function (d) {
  try {
    navigator.clipboard.writeText(mailText()).then(
      function () {
        toast("Testo copiato");
      },
      function () {
        toast("Seleziona il testo e copialo a mano");
      }
    );
  } catch (e) {
    toast("Seleziona il testo e copialo a mano");
  }
};
ACT["share-mail"] = function (d) {
  try {
    if (navigator.share) navigator.share({ title: "Richiesta scheda di allenamento", text: mailText() }).catch(function () {});
    else toast("Condivisione non disponibile: usa Copia testo");
  } catch (e) {
    toast("Usa Copia testo");
  }
};
ACT["new-ai"] = function (d) {
  var cur = attiva(),
    s = cur && getScheda(cur, d.id);
  sheet = {
    kind: "ai",
    note: "",
    prompt: "",
    paste: "",
    min: (cur && cur.minuti) || 60,
    step: "",
    mail: undefined
  };
  render();
  if (!aiFn && CLOUD) initCloudAi();
};
ACT["eq-all"] = function (d) {
  S.attrezzi = S.attrezzi
    .filter(function (n) {
      return EQ[d.g].indexOf(n) < 0;
    })
    .concat(EQ[d.g]);
  saveApp();
  render();
};
ACT["eq-none"] = function (d) {
  S.attrezzi = S.attrezzi.filter(function (n) {
    return EQ[d.g].indexOf(n) < 0;
  });
  saveApp();
  render();
};
ACT["gen-ai"] = function (d) {
  genAI();
};
ACT["stop-ai"] = function (d) {
  if (aiCtl) aiCtl.abort();
};
ACT["prep-prompt"] = function (d) {
  if (!S.attrezzi.length) {
    sheet.err = "Spunta almeno un attrezzo presente nella tua palestra.";
    render();
    return;
  }
  sheet.err = "";
  sheet.prompt = buildPrompt(sheet.note);
  render();
};
ACT["copy-prompt"] = function () {
  copyText(sheet.prompt);
};
ACT["import-ai"] = function (d) {
  var list = cleanSchede(parseLoose(sheet.paste));
  if (!list) {
    sheet.err = "Non riesco a leggere la risposta. Incolla il JSON completo.";
    render();
    return;
  }
  addAiSchede(list);
};

SHEETS.ai = { html: aiSheetHTML, session: true };

function initCloudAi() {
  try {
    window.claude.use("sample").then(
      function (f) {
        aiFn = f || null;
        if (sheet && sheet.kind === "ai") render();
      },
      function () {}
    );
  } catch (e) {}
}
HOOKS.input.push(function (t) {
  if (t.id === "ai-mail" && t.dataset.sf !== undefined) {
    S.profile.coachEmail = t.value.trim();
    var ml = document.getElementById("ai-mailgo");
    if (ml) ml.href = mailHref();
    saveApp();
  }
  return false;
});
HOOKS.change.push(function (t) {
  if (t.dataset.eq !== undefined) {
    var n = t.dataset.eq,
      i = S.attrezzi.indexOf(n);
    if (t.checked && i < 0) S.attrezzi.push(n);
    if (!t.checked && i >= 0) S.attrezzi.splice(i, 1);
    saveApp();
    return true;
  }
});

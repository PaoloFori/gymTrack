/* Testi per l'IA e finestra-guida: schema JSON di dieta e scheda, prompt di conversione (PDF → JSON), generazione di una dieta, richiesta via email.
   Gli assistenti IA non sono collegati all'app: l'utente copia il prompt, lo incolla nell'assistente e riporta qui la risposta (JSON). */

var AI_WARN_HTML =
  '<div class="banner" style="margin-bottom:12px"><b>Meglio un professionista</b>L\'IA non è un nutrizionista né un personal trainer: le sue proposte sono indicative e possono contenere errori. Per un piano su misura rivolgiti a un professionista e usa questo solo come spunto.</div>';

var SCHEMA_DIETA = `{
  "gymtrack": "dieta",
  "v": 1,
  "nome": "titolo della dieta",
  "periodo": { "dal": "AAAA-MM-GG", "al": "AAAA-MM-GG" },
  "regole": { "carne": { "max": 4 }, "pesce": { "min": 3 }, "tonno": { "max": 1 }, "uova": { "min": 2 }, "latt": { "min": 2 }, "legu": { "min": 2 }, "patate": { "max": 2 }, "rossa": { "max": 2 }, "libero": { "n": 1 } },
  "pasti": [
    {
      "nome": "Colazione",
      "ora": "08:00",
      "piatti": [
        {
          "nome": "Piatto unico",
          "varianti": [
            {
              "alimenti": [
                { "opzioni": [ { "nome": "Fiocchi d'avena", "qt": 40, "u": "g" }, { "nome": "Cornflakes", "qt": 40, "u": "g" } ] },
                { "opzioni": [ { "nome": "Yogurt greco 0%", "qt": 150, "u": "g" }, { "nome": "Skyr", "qt": 150, "u": "g" } ] }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;
var SCHEMA_DIETA_REGOLE = `- "pasti": nell'ordine della giornata (Colazione, Spuntino, Pranzo, Merenda, Cena), solo quelli previsti.
- "ora" (facoltativo): l'orario del pasto "HH:MM", solo se il piano lo indica.
- "piatti": le portate di un pasto ("1° Piatto", "2° Piatto", "Piatto unico").
- "varianti": alternative COMPLETE dello stesso piatto (se il piano dice "Alternativa", ogni alternativa è una variante; altrimenti una sola).
- "alimenti": le voci da mangiare insieme nella variante.
- "opzioni": per ogni voce, prima l'alimento prescritto e poi le sostituzioni equivalenti ("puoi sostituire con…"), ognuna con la propria quantità "qt" (numero) e unità "u" ("g", "ml" o "pz").
- "regole" (facoltativo): solo se il piano indica frequenze settimanali. Chiavi ammesse: carne (bianca e rossa), rossa (solo carne rossa), pesce, tonno, uova, latt (latticini e formaggi), legu (legumi), patate, libero. "min"/"max" sono volte a settimana; "libero": { "n": … } è il numero di pasti liberi (sgarro) a settimana. Cerca queste frequenze in tutto il piano, comprese le note e le tabelle laterali, e se due punti si contraddicono usa il valore più prudente. Se il piano non le indica, omettile: l'app le chiederà.
- "periodo" (facoltativo): le date di validità del piano, se indicate.`;
var SCHEMA_SESSIONE = `{
  "gymtrack": "sessione",
  "v": 1,
  "nome": "Marzo–maggio 2026",
  "obiettivo": "Ipertrofia",
  "giorni": 4,
  "periodo": { "dal": "AAAA-MM-GG", "al": "AAAA-MM-GG" },
  "schede": [
    {
      "nome": "Push",
      "note": "",
      "esercizi": [
        { "nome": "Distensioni manubri panca piana", "nome_en": "dumbbell bench press", "gruppo": "Petto", "serie": 4, "reps": "6/8", "rec": 120, "note": "Panca 20°", "riscal": 0, "sup": false }
      ]
    }
  ]
}`;
var SCHEMA_SESSIONE_REGOLE = `- Ogni scheda è un giorno di allenamento, con gli esercizi nell'ordine in cui vanno eseguiti. "giorni" è il numero di allenamenti a settimana.
- "obiettivo" è uno tra: Ipertrofia, Forza, Dimagrimento, Mantenimento, Ricomposizione (scegli il più adatto, se non è scritto).
- "serie" è un numero intero; "reps" è testo come nel piano (es. "6/8", "10-8-6-X", "almeno 10 min"); "rec" è il recupero in SECONDI (0 se assente).
- "gruppo" è uno tra: Petto, Schiena, Spalle, Bicipiti, Tricipiti, Gambe, Glutei, Addome, Polpacci, Altro.
- "nome_en" (facoltativo) è il nome inglese dell'esercizio, serve a trovare la GIF dimostrativa.
- "note": le indicazioni dell'esercizio (piramidale, rest-pause, ecc.). Riscaldamento e circuiti di attivazione vanno raggruppati in un unico esercizio.
- "sup": true se l'esercizio è in superset con quello successivo. "riscal": numero di serie di riscaldamento (0–3).
- "periodo" (facoltativo): le date di validità della scheda, se indicate.`;
var JSON_ONLY = "Non inventare nulla: se un dato manca, omettilo. Rispondi SOLO con il JSON, in un unico blocco di codice, senza testo prima o dopo.";

function promptConvertDieta() {
  return `Sei un assistente che trasforma un piano alimentare in un file JSON.
Ti allego (o incollo di seguito) il piano alimentare che mi ha dato il mio nutrizionista: PDF e/o testo. Trasformalo in un JSON con ESATTAMENTE questa struttura (i valori sono solo un esempio):

${SCHEMA_DIETA}

Regole:
${SCHEMA_DIETA_REGOLE}

${JSON_ONLY}`;
}
function promptConvertSessione() {
  return `Sei un assistente che trasforma una scheda di allenamento in un file JSON.
Ti allego (o incollo di seguito) la scheda che mi ha dato il mio preparatore: PDF e/o testo. Trasformala in un JSON con ESATTAMENTE questa struttura (i valori sono solo un esempio):

${SCHEMA_SESSIONE}

Regole:
${SCHEMA_SESSIONE_REGOLE}

${JSON_ONLY}`;
}
/* Generazione di una dieta: k = { genMeals, dislikes, allergie }, più i dati di profilo e sessione in corso. */
function promptGenDieta(k) {
  var p = S.profile,
    a = attiva(),
    meals = (k.genMeals && k.genMeals.length ? k.genMeals : ["Colazione", "Pranzo", "Cena"]).join(", ");
  var dati = [
    "età " + (p.eta || "n.d."),
    "altezza " + (p.altezza || "n.d.") + " cm",
    "peso " + (p.peso || "n.d.") + " kg",
    "obiettivo " + (a ? a.obiettivo : "non indicato"),
    "allenamenti a settimana " + (a ? a.giorni : "n.d.")
  ].join("; ");
  return `Sei un assistente che propone uno schema alimentare indicativo (non sei un nutrizionista: la proposta serve solo come spunto).
Crea un piano a "giornata tipo" con più alternative equivalenti per ogni voce, così posso variare durante la settimana.

PROFILO: ${dati}.
PASTI DELLA GIORNATA: ${meals}.
CIBI E SPEZIE CHE NON MI PIACCIONO (non usarli): ${(k.dislikes || "").trim() || "nessuno in particolare"}.
ALLERGIE O INTOLLERANZE (escludile del tutto): ${(k.allergie || "").trim() || "nessuna"}.

Linee guida: pasti completi (cereale, proteina, verdura e un condimento a pranzo e cena); per ogni voce 3–6 alternative isocaloriche con la propria quantità a crudo in grammi; frutta e verdura ogni giorno; pesce, legumi e uova più volte a settimana, carne rossa poco. Indica in "regole" le frequenze settimanali che consigli.

Rispondi con un JSON con ESATTAMENTE questa struttura (i valori sono solo un esempio):

${SCHEMA_DIETA}

Regole:
${SCHEMA_DIETA_REGOLE}

${JSON_ONLY}`;
}
/* Riquadro con un prompt di sola lettura e il tasto per copiarlo. */
function promptCard(id, label, text) {
  return `<div class="field"><label for="${id}">${label}</label><textarea id="${id}" readonly rows="6" class="mono">${esc(text)}</textarea></div><button class="btn small" style="margin-bottom:12px" data-act="copy-ta" data-id="${id}">Copia il prompt</button>`;
}
ACT["copy-ta"] = function (d) {
  var t = document.getElementById(d.id);
  if (t) copyText(t.value);
};

/* ---- testi usati dalla generazione di schede e dall'email (la finestra è in sheet.js) ---- */
function mailText() {
  var a = attiva(),
    p = S.profile,
    eq = {},
    past = [],
    now = Date.now(),
    mins = clamp(parseInt(sheet && sheet.min, 10) || a.minuti || 60, 20, 180);
  Object.keys(EQ).forEach(function (g) {
    var l = EQ[g].filter(function (n) {
      return S.attrezzi.indexOf(n) >= 0;
    });
    if (l.length) eq[g] = l;
  });
  var t = "Ciao" + (sheet && sheet.mail ? "" : "") + ",\nvorrei una nuova scheda di allenamento. Ecco i miei dati.\n\n";
  t +=
    "DATI\n- Nome: " +
    (p.nome || "n.d.") +
    "\n- Età: " +
    (p.eta || "n.d.") +
    "\n- Altezza: " +
    (a.altezza || p.altezza || "n.d.") +
    " cm\n- Peso: " +
    (a.peso || p.peso || "n.d.") +
    " kg\n";
  t += "\nOBIETTIVO\n- " + a.obiettivo + (sheet && sheet.note && sheet.note.trim() ? "\n- Richieste: " + sheet.note.trim() : "") + "\n";
  t +=
    "\nDISPONIBILITÀ\n- Allenamenti a settimana: " +
    a.giorni +
    "\n- Durata di ogni allenamento: circa " +
    mins +
    " minuti\n- Durata della sessione: " +
    a.mesi +
    " mesi\n";
  t += "\nATTREZZATURA DELLA PALESTRA\n";
  var ks = Object.keys(eq);
  if (!ks.length) t += "- (non indicata)\n";
  ks.forEach(function (g) {
    t += "- " + g + ": " + eq[g].join(", ") + "\n";
  });
  S.sessioni.slice(-3).forEach(function (x) {
    x.schede.forEach(function (s) {
      past.push(
        "- " +
          x.nome +
          " · " +
          s.nome +
          ": " +
          s.esercizi
            .map(function (e) {
              var q = topSet(lastOf(e.id, e.nome));
              return e.nome + " " + e.serie + "x" + e.reps + (q ? " (ultimo carico " + q.kg + " kg x " + q.reps + ")" : "");
            })
            .join("; ")
      );
    });
  });
  t += "\nSCHEDE PRECEDENTI\n" + (past.length ? past.join("\n") : "- nessuna") + "\n";
  var n28 = LOG.filter(function (l) {
    return now - l.ts < 28 * 864e5;
  }).length;
  t += "\nANDAMENTO\n- Allenamenti negli ultimi 28 giorni: " + n28 + "." + andamento() + "\n";
  t +=
    "\nPotresti prepararmi " +
    a.giorni +
    " schede (una per ogni giorno), con per ogni esercizio serie, ripetizioni e tempo di recupero? Grazie!\n" +
    (p.nome || "");
  return t;
}

function buildPrompt(note) {
  var a = attiva(),
    p = S.profile,
    eq = {},
    now = Date.now(),
    past = [],
    mins = clamp(parseInt(sheet && sheet.min, 10) || a.minuti || 60, 20, 180);
  a.minuti = mins;
  Object.keys(EQ).forEach(function (g) {
    var l = EQ[g].filter(function (n) {
      return S.attrezzi.indexOf(n) >= 0;
    });
    if (l.length) eq[g] = l;
  });
  S.sessioni.slice(-3).forEach(function (x) {
    x.schede.forEach(function (s) {
      past.push({
        sessione: x.nome,
        scheda: s.nome,
        esercizi: s.esercizi.map(function (e) {
          var t = topSet(lastOf(e.id, e.nome));
          return e.nome + " " + e.serie + "x" + e.reps + (t ? " (ultimo carico " + t.kg + " kg x " + t.reps + ")" : "");
        })
      });
    });
  });
  var n28 = LOG.filter(function (l) {
    return now - l.ts < 28 * 864e5;
  }).length;
  return (
    "Sei un preparatore atletico. Crea le schede di una sessione di allenamento in palestra della durata di " +
    a.mesi +
    " mesi. Ogni scheda è un giorno di allenamento.\n\nPROFILO: obiettivo " +
    a.obiettivo +
    "; età " +
    (p.eta || "n.d.") +
    "; altezza " +
    (a.altezza || "n.d.") +
    " cm; peso " +
    (a.peso || "n.d.") +
    " kg; allenamenti a settimana " +
    a.giorni +
    "; durata di ogni allenamento circa " +
    mins +
    " minuti; negli ultimi 28 giorni ha fatto " +
    n28 +
    " allenamenti." +
    andamento() +
    "\n\nATTREZZATURA DISPONIBILE (per gruppo muscolare): " +
    JSON.stringify(eq) +
    "\nUsa solo esercizi eseguibili con questa attrezzatura, oltre a quelli a corpo libero.\n\nSCHEDE PASSATE: " +
    (past.length ? JSON.stringify(past) : "nessuna") +
    "\nPartendo da queste, mantieni ciò che funziona, varia esercizi o range di ripetizioni e proponi una progressione dei carichi.\n\nRICHIESTE: " +
    ((note || "").trim() || "nessuna") +
    "\n\nVincoli: esattamente " +
    a.giorni +
    " schede; scegli numero di esercizi, serie e recuperi in modo che ogni allenamento duri circa " +
    mins +
    ' minuti (di solito 4-7 esercizi); per un superset metti "sup":true sul primo dei due esercizi (si fanno di seguito senza pausa); "riscal" è il numero di serie di riscaldamento (0-3, solo per i multiarticolari pesanti); "nome_en" è il nome inglese standard dell\'esercizio; ripetizioni come testo (es. "8-10"); recupero in secondi; gruppo tra: ' +
    GR.join(", ") +
    '.\nRispondi solo con JSON in italiano, in questo formato:\n{"note":"una frase di indicazioni per la sessione","schede":[{"nome":"Giorno A · Petto e tricipiti","note":"","esercizi":[{"nome":"Panca piana","nome_en":"Barbell bench press","gruppo":"Petto","serie":4,"reps":"6-8","rec":120,"riscal":1,"sup":false,"note":""}]}]}'
  );
}

/* Dieta, modello dati: categorie degli alimenti, lettura/scrittura del JSON, ricerche. */
var DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
/* g = reparto della spesa */
var DC = {
  carbo: { g: "Cereali, pane e colazione" },
  colaz: { g: "Cereali, pane e colazione" },
  carne: { g: "Carne e uova" },
  uova: { g: "Carne e uova" },
  pesce: { g: "Pesce" },
  latt: { g: "Latticini" },
  legu: { g: "Legumi" },
  verd: { g: "Frutta e verdura" },
  frut: { g: "Frutta e verdura" },
  grassi: { g: "Condimenti e frutta secca" },
  dolci: { g: "Altro" },
  altro: { g: "Altro" }
};
var CATRE = [
  ["legu", /vegetale|tofu|tempeh|seitan|ceci|lenticch|fagioli|piselli|\bfave\b|soia|legumi|edamame|borlotti|cannellini|lupini/],
  [
    "latt",
    /latte|yogurt|ricotta|mozzarella|parmigiano|asiago|grana|formaggio|skyr|feta|stracchino|kefir|burrata|pecorino|quark|scamorza|primo sale|caprino|philadelphia/
  ],
  [
    "pesce",
    /pesce|salmone|tonno|merluzzo|orata|branzino|spigola|gamber|nasello|trota|sgombro|platessa|polpo|calamar|seppia|vongol|cozze|acciug|baccal|sogliola|alici|dentice|mazzancolle|molluschi|crostacei/
  ],
  ["uova", /\buov[ao]\b|\buova\b|albume|albumi|frittata/],
  ["grassi", /\bolio|\bnoci\b|mandorl|nocciol|avocado|burro|arachid|pistacch|\bsemi\b|anacard|frutta secca|pinoli|tahin|olive/],
  [
    "carne",
    /pollo|tacchino|manzo|vitello|maiale|bresaola|prosciutto|fesa|hamburger|agnello|coniglio|\bcarne|bistecca|filetto|macinato|salsiccia|lonza|arrosto|affettat|speck|wurstel/
  ],
  [
    "verd",
    /insalata|spinaci|zucchin|broccol|carot|pomodor|peperon|melanzan|finocch|cavol|cetriol|verdur|bietol|funghi|asparag|radicch|rucola|fagiolini|lattuga|sedano|carciofi|zucca|cipoll|ortaggi|minestrone|porri|\brape\b|catalogna|verza/
  ],
  [
    "frut",
    /\bmel[ae]\b|banan|aranc|kiwi|\bper[ae]\b|fragol|frutti di bosco|mirtill|lamponi|\buva\b|\bpesc[ah]\b|ananas|mandarin|melone|anguria|albicocc|ciliegi|frutta|clementin|pompelmo|prugn|\bfichi\b|cachi|spremuta|succo/
  ],
  [
    "carbo",
    /pasta|\briso\b|farro|\borzo\b|cous|quinoa|gnocchi|patat|\bpane\b|polenta|pizza|piadina|tortill|spaghetti|penne|fusilli|risotto|bulgur|miglio|grano|integrale|farina/
  ],
  [
    "colaz",
    /avena|fette biscottate|muesli|corn ?flakes|cereali|fiocchi|gallette|biscott|cracker|cornetto|brioche|pancake|wasa|grissini|riso soffiato/
  ],
  ["dolci", /ciocc|cacao|gelato|dolce|nutella|zucchero|crostata|torta|miele|marmellata/]
];
function catOf(n) {
  var l = String(n || "").toLowerCase();
  for (var i = 0; i < CATRE.length; i++) if (CATRE[i][1].test(l)) return CATRE[i][0];
  return "altro";
}
/* Chiavi delle regole settimanali (carne, pesce, tonno, uova, latticini, legumi, patate) a cui un alimento contribuisce. */
function optKeys(n) {
  var l = String(n).toLowerCase(),
    k = [];
  if (/tonno/.test(l)) k.push("pesce", "tonno");
  else if (catOf(l) === "pesce") k.push("pesce");
  if (/\buov/.test(l) && !/albume/.test(l)) k.push("uova");
  if (catOf(l) === "latt" && !/latte di soia|bevanda/.test(l)) k.push("latt");
  if (/legumi|ceci|lenticch|fagioli|piselli|\bfave\b/.test(l)) k.push("legu");
  if (/patate|gnocchi/.test(l)) k.push("patate");
  if (catOf(l) === "carne" && !/affettat|vegetale/.test(l)) k.push("carne");
  if (/manzo|bovino|vitello|maiale|agnello|salsiccia|hamburger|cavallo/.test(l) && !/affettat|vegetale/.test(l)) k.push("rossa");
  return k;
}
function titleCase(s) {
  s = s.trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
function normUnit(u) {
  u = String(u || "g").toLowerCase();
  if (/^(gr|g|grammi)$/.test(u)) return "g";
  if (/^(pz|pezzi|pezzo)$/.test(u)) return "pz";
  return u;
}
function nname(s) {
  return String(s)
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-zàèéìòù0-9]+/g, " ")
    .trim();
}
/* JSON della dieta (vedi CLAUDE.md): aggiunge gli id e normalizza i campi. */
function dietFromJson(o) {
  if (!o || !Array.isArray(o.pasti)) throw new Error("JSON della dieta non valido: manca «pasti».");
  var pasti = o.pasti
    .map(function (m) {
      return {
        id: uid(),
        nome: String(m.nome || "Pasto"),
        on: m.on !== false,
        piatti: (m.piatti || []).map(function (p) {
          return {
            id: uid(),
            nome: String(p.nome || "Piatto"),
            varianti: (p.varianti || []).map(function (v) {
              return {
                id: uid(),
                on: v.on !== false,
                alimenti: (v.alimenti || [])
                  .map(function (a) {
                    return {
                      id: uid(),
                      opzioni: (a.opzioni || [])
                        .map(function (x) {
                          return {
                            id: uid(),
                            n: String(x.nome || x.n || ""),
                            qt: Number(x.qt) || 0,
                            u: normUnit(x.u),
                            on: x.on !== false
                          };
                        })
                        .filter(function (x) {
                          return x.n;
                        })
                    };
                  })
                  .filter(function (a) {
                    return a.opzioni.length;
                  })
              };
            })
          };
        })
      };
    })
    .filter(function (m) {
      return m.piatti.length;
    });
  if (!pasti.length) throw new Error("Nessun pasto nel JSON.");
  return {
    pasti: pasti,
    regole: o.regole && typeof o.regole === "object" ? o.regole : {},
    periodo: o.periodo || null,
    nome: o.nome ? String(o.nome) : ""
  };
}
/* ---- ricerche ---- */
function todayI() {
  return (new Date().getDay() + 6) % 7;
}
function dietOf(x) {
  return x && x.dietId
    ? S.diete.find(function (d) {
        return d.id === x.dietId;
      }) || null
    : null;
}
function dietSessions(d) {
  return S.sessioni.filter(function (x) {
    return x.dietId === d.id;
  });
}
function dietActive(d) {
  return dietSessions(d).some(function (x) {
    return !x.chiusa;
  });
}
function curDiet() {
  var a = attiva();
  return a ? dietOf(a) : null;
}
function pastDiets() {
  var c = curDiet();
  return S.diete
    .filter(function (d) {
      return !c || d.id !== c.id;
    })
    .slice()
    .reverse();
}
function dietById(id) {
  return S.diete.find(function (d) {
    return d.id === id;
  });
}
function mealCount(d) {
  var n = 0;
  d.pasti.forEach(function (m) {
    if (m.on) n++;
  });
  return n;
}
/* ---- finestra di creazione/modifica ---- */
function dietFind(k, id) {
  var r = null;
  k.pasti.forEach(function (m) {
    if (m.id === id) r = m;
    m.piatti.forEach(function (p) {
      p.varianti.forEach(function (v) {
        if (v.id === id) r = v;
        v.alimenti.forEach(function (a) {
          if (a.id === id) r = a;
          a.opzioni.forEach(function (o) {
            if (o.id === id) r = o;
          });
        });
      });
    });
  });
  return r;
}
function reId(pasti) {
  pasti.forEach(function (m) {
    m.id = uid();
    m.piatti.forEach(function (p) {
      p.id = uid();
      p.varianti.forEach(function (v) {
        v.id = uid();
        v.alimenti.forEach(function (a) {
          a.id = uid();
          a.opzioni.forEach(function (o) {
            o.id = uid();
          });
        });
      });
    });
  });
  return pasti;
}

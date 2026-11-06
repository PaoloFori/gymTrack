/* Costanti: chiavi di salvataggio, gruppi muscolari, obiettivi, attrezzi, parametri degli avatar. */
var LS = "gymtrack.v2",
  WEEK = 7 * 864e5;
var GR = ["Petto", "Schiena", "Spalle", "Bicipiti", "Tricipiti", "Gambe", "Glutei", "Addome", "Polpacci", "Altro"];
var OBJ = ["Ipertrofia", "Forza", "Dimagrimento", "Mantenimento", "Ricomposizione"];
var EQ = {
  Petto: [
    "Panca piana con bilanciere",
    "Panca inclinata con bilanciere",
    "Panca con manubri",
    "Chest press",
    "Pec deck",
    "Croci ai cavi",
    "Parallele per dip"
  ],
  Schiena: ["Lat machine", "Pulley basso", "Rematore con bilanciere", "Macchina row", "Sbarra per trazioni", "T-bar", "Rack per stacchi"],
  Spalle: ["Shoulder press", "Manubri", "Cavi per alzate", "Reverse pec deck", "Multipower"],
  Bicipiti: ["Bilanciere EZ", "Panca Scott", "Curl ai cavi", "Manubri curl"],
  Tricipiti: ["Push down ai cavi", "Macchina per tricipiti", "Panca piana con bilanciere EZ", "Corda per cavi"],
  Gambe: [
    "Leg press",
    "Leg extension",
    "Leg curl",
    "Hack squat",
    "Multipower per gambe",
    "Rack per squat",
    "Macchina adduttori",
    "Macchina abduttori"
  ],
  Glutei: ["Hip thrust", "Glute machine", "Cavi per kickback"],
  Polpacci: ["Calf in piedi", "Calf seduto"],
  Addome: ["Crunch machine", "Cavi per crunch", "Panca addominali", "Sbarra per gambe alzate"]
};
var CLOUD = !!window.claude;
/* f = grasso, m = muscolo, t = magrezza: valori a inizio sessione (0) e a obiettivo perfetto (1). prop = accessorio, ghost = sagoma «prima». */
var OBJP = {
  Ipertrofia: {
    f0: 0.02,
    f1: 0.1,
    m0: 0,
    m1: 1,
    t0: 1,
    t1: 0,
    thick: 1,
    s0: 12,
    prop: "db",
    txt: "Ipertrofia: l'avatar parte magro ed esile e mette massa, con spalle, petto e braccia sempre più grossi."
  },
  Forza: {
    f0: 0.1,
    f1: 0.3,
    m0: 0,
    m1: 1,
    t0: 0.6,
    t1: 0,
    thick: 1.28,
    s0: 12,
    prop: "bar",
    txt: "Forza: l'avatar parte debole e diventa compatto e potente, con arti e tronco spessi, fino al bilanciere sopra la testa."
  },
  Dimagrimento: {
    f0: 1,
    f1: 0,
    m0: 0.05,
    m1: 0.6,
    t0: 0,
    t1: 0,
    thick: 0.95,
    s0: 14,
    prop: "tape",
    ghost: 1,
    txt: "Dimagrimento: l'avatar parte in sovrappeso e si asciuga fino a essere snello e definito. La sagoma sbiadita è com'eri all'inizio."
  },
  Mantenimento: {
    f0: 0.5,
    f1: 0.08,
    m0: 0.1,
    m1: 0.55,
    t0: 0,
    t1: 0,
    thick: 1,
    s0: 10,
    prop: "medal",
    txt: "Mantenimento: l'avatar parte fuori allenamento e arriva a un fisico sano, equilibrato e costante."
  },
  Ricomposizione: {
    f0: 0.6,
    f1: 0,
    m0: 0,
    m1: 0.9,
    t0: 0.3,
    t1: 0,
    thick: 1,
    s0: 12,
    prop: "",
    ghost: 1,
    txt: "Ricomposizione: l'avatar parte morbido e senza tono e perde grasso mettendo muscolo. La sagoma sbiadita è il tuo punto di partenza."
  }
};
var AV = {
  umano: "Uomo",
  donna: "Donna",
  animale: "Orso",
  lupo: "Lupo",
  gorilla: "Gorilla",
  leone: "Leone",
  toro: "Toro",
  gatto: "Gatto",
  cane: "Cane",
  alieno: "Alieno"
};
var AVK = ["umano", "donna", "gatto", "cane", "alieno", "animale", "lupo", "gorilla", "leone", "toro"];

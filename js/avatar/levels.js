/* Nomi dei livelli (le «evoluzioni» dell'avatar) per obiettivo: sono 5 e cambiano con la forma raggiunta. */
var LVM = [0, 15, 35, 60, 85];
var LVN = {
  Ipertrofia: ["Fuscello", "Pulcino da palestra", "Palestrato", "Armadio a due ante", "Colosso"],
  Forza: ["Pivello", "Ferro in mano", "Sasso", "Macigno", "Titano d'acciaio"],
  Dimagrimento: ["Morbidone", "Sgonfiotto", "Scattante", "Guizzante", "Fulmine"],
  Mantenimento: ["Pigrone", "Si rimette in moto", "Costante", "Equilibrista", "Zen inossidabile"],
  Ricomposizione: ["Bozzolo", "Crisalide", "Metamorfosi", "Farfalla", "Fenice"]
};
/* Nome mostrato quando si saltano troppi allenamenti (l'avatar ingrassa). */
var LVO = {
  Ipertrofia: "Muscoli in sciopero",
  Forza: "Ferro arrugginito",
  Dimagrimento: "Ricaduta golosa",
  Mantenimento: "Modalità divano",
  Ricomposizione: "Bozzolo ammaccato"
};
function levels(ob) {
  var n = LVN[ob] || LVN.Ipertrofia;
  return LVM.map(function (m, i) {
    return { m: m, n: n[i] };
  });
}
/* Indice (0–4) dell'evoluzione raggiunta con la forma P (0–100). */
function stageOf(P) {
  var i = 0;
  LVM.forEach(function (m, k) {
    if (P >= m) i = k;
  });
  return i;
}
function livello(g, ob) {
  if (g.fat > 0.3) return LVO[ob] || "Fuori forma";
  return levels(ob)[stageOf(g.P)].n;
}
function nextLevel(P, ob) {
  var L = levels(ob);
  for (var i = 0; i < L.length; i++) if (L[i].m > P) return L[i];
  return null;
}

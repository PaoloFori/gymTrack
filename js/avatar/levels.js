/* Nomi dei livelli per obiettivo. */
/* ---------- livelli e obiettivi ---------- */
var LVM = [0, 15, 35, 60, 85];
var LVN = {
  Ipertrofia: ["Esile", "Muscoli in crescita", "Palestrato", "Massiccio", "Colosso"],
  Forza: ["Debole", "Allenato", "Potente", "Powerlifter", "Titano"],
  Dimagrimento: ["Appesantito", "In calo", "Asciutto", "Definito", "Scolpito"],
  Mantenimento: ["Fuori allenamento", "Di nuovo in moto", "Costante", "In equilibrio", "Inossidabile"],
  Ricomposizione: ["Da trasformare", "In trasformazione", "Tonico", "Atletico", "Trasformato"]
};
var LVO = {
  Ipertrofia: "Fuori forma",
  Forza: "Calo di forza",
  Dimagrimento: "In ricaduta",
  Mantenimento: "Fuori ritmo",
  Ricomposizione: "Fuori forma"
};
function levels(ob) {
  var n = LVN[ob] || LVN.Ipertrofia;
  return LVM.map(function (m, i) {
    return { m: m, n: n[i] };
  });
}
function livello(g, ob) {
  if (g.fat > 0.3) return LVO[ob] || "Fuori forma";
  var L = levels(ob),
    i = 0;
  L.forEach(function (l, k) {
    if (g.P >= l.m) i = k;
  });
  return L[i].n;
}
function nextLevel(P, ob) {
  var L = levels(ob);
  for (var i = 0; i < L.length; i++) if (L[i].m > P) return L[i];
  return null;
}

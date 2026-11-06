/* Stato globale (S = dati salvati, LOG = allenamenti, view/sheet = interfaccia) e interrogazioni di base. */
var hm = "sess",
  dTab = "piano",
  dOpen = null,
  dCur = null,
  selMode = false,
  selIds = [],
  supOpen = false,
  anScope = "all";
var S = normalize(null),
  LOG = [];
var calM = 0,
  calSel = null,
  view = { name: "home" },
  edit = false,
  sheet = null,
  session = null,
  timer = null,
  armed = "",
  tick = null;
var appDoc = null,
  logCol = null,
  mode = "local",
  saveT = null,
  saving = false,
  dirty = false,
  toastT = null,
  aiFn = null,
  aiCtl = null;
function normalize(st) {
  var d = {
    profile: { foto: "", nome: "", eta: "", altezza: "", peso: "" },
    sessioni: [],
    attrezzi: [],
    pesi: [],
    diete: [],
    tema: { pal: "blu", mode: "auto" },
    lastBackup: 0
  };
  if (!st || typeof st !== "object") return d;
  st.profile = Object.assign({}, d.profile, st.profile || {});
  st.sessioni = Array.isArray(st.sessioni) ? st.sessioni : [];
  st.attrezzi = Array.isArray(st.attrezzi) ? st.attrezzi : [];
  st.pesi = Array.isArray(st.pesi) ? st.pesi : [];
  st.diete = Array.isArray(st.diete) ? st.diete : [];
  st.tema = st.tema && typeof st.tema === "object" ? Object.assign({ pal: "blu", mode: "auto" }, st.tema) : { pal: "blu", mode: "auto" };
  /* diete: i vecchi dati (senza pasti) non sono compatibili; il collegamento vive ora nella sessione (dietId) */
  st.diete = st.diete.filter(function (x) {
    return x && Array.isArray(x.pasti);
  });
  st.diete.forEach(function (x) {
    (x.sess || []).forEach(function (id) {
      var q = st.sessioni.find(function (z) {
        return z.id === id;
      });
      if (q && !q.dietId) q.dietId = x.id;
    });
    delete x.sess;
  });
  st.lastBackup = Number(st.lastBackup) || 0;
  st.sessioni.forEach(function (x) {
    x.schede = Array.isArray(x.schede) ? x.schede : [];
  });
  delete st.schede;
  delete st.avatar;
  return st;
}
/* ---------- sessione, avatar, progressi ---------- */
function attiva() {
  return S.sessioni.find(function (x) {
    return !x.chiusa;
  });
}
function endOf(a) {
  var d = new Date(a.start);
  d.setMonth(d.getMonth() + (a.mesi || 2));
  return d.getTime();
}
function durWeeks(a) {
  return (endOf(a) - a.start) / WEEK;
}
function getScheda(a, id) {
  return (
    a &&
    a.schede.find(function (x) {
      return x.id === id;
    })
  );
}
function logPeso(kg) {
  kg = num(kg);
  if (!(kg > 0)) return false;
  var t = Date.now(),
    d = sod(t);
  S.pesi = S.pesi.filter(function (x) {
    return sod(x.ts) !== d;
  });
  S.pesi.push({ ts: t, kg: kg });
  S.pesi.sort(function (a, b) {
    return a.ts - b.ts;
  });
  S.pesi = S.pesi.slice(-400);
  return true;
}

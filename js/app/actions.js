/* Smistamento delle azioni (click sui bottoni con data-act) e azioni di navigazione/finestre comuni. */
function act(a, d, el) {
  try {
    var f = ACT[a];
    if (f) f(d, el, a);
  } catch (e) {
    showErr(e && e.message ? e.message : String(e));
  }
}
function closeSheet() {
  if (aiCtl) aiCtl.abort();
  sheet = null;
  render();
}

ACT["tab"] = function (d) {
  go(d.v);
};
ACT["back"] = function (d) {
  if (view.name === "wex") view = { name: "workout" };
  else if (view.name === "sess") view = { name: view.from || "sessioni" };
  else if (view.name === "scheda") view = { name: "corrente" };
  else if (view.name === "corrente") view = { name: view.from === "home" ? "home" : "sessioni" };
  else if (view.name === "dietad") view = { name: view.from === "home" ? "home" : "dieta" };
  else view = { name: "sessioni" };
  edit = false;
  render();
  window.scrollTo(0, 0);
};
ACT["sel-mode"] = function (d) {
  selMode = !selMode;
  selIds = [];
  armed = "";
  render();
};
ACT["close-sheet"] = function (d) {
  closeSheet();
};
ACT["close-sheet-bg"] = function (d) {
  if (d.direct) closeSheet();
};
ACT["save-sheet"] = function (d) {
  var def = sheet && SHEETS[sheet.kind];
  if (def && def.save) def.save(sheet);
  else closeSheet();
};

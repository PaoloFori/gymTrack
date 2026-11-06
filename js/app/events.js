/* Ascolto degli eventi globali: click sui bottoni, campi di input, errori, ritorno in primo piano. */
document.addEventListener("click", function (e) {
  var t = e.target.closest("[data-act]");
  if (!t) return;
  if (t.dataset.act === "close-sheet-bg") t.dataset.direct = e.target === t ? "1" : "";
  act(t.dataset.act, t.dataset, t);
});
/* I campi delle finestre con data-sf="campo" scrivono sullo stato: sheet[campo]. I moduli possono intercettare prima via HOOKS. */
function runHooks(list, e) {
  var t = e.target;
  if (!t || !t.dataset) return;
  for (var i = 0; i < list.length; i++) if (list[i](t, e)) return;
  if (t.dataset.sf !== undefined && sheet) sheet[t.dataset.sf] = t.type === "checkbox" ? t.checked : t.value;
}
document.addEventListener("input", function (e) {
  runHooks(HOOKS.input, e);
});
document.addEventListener("change", function (e) {
  runHooks(HOOKS.change, e);
});
window.addEventListener("error", function (e) {
  showErr(e.message || "errore");
});
window.addEventListener("unhandledrejection", function (e) {
  showErr(e.reason && e.reason.message ? e.reason.message : "operazione non riuscita");
});
document.addEventListener(
  "error",
  function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && t.className.indexOf("gif") >= 0) t.style.visibility = "hidden";
    else if (t && t.tagName === "IMG" && t.closest && t.closest(".gifrow")) t.style.visibility = "hidden";
  },
  true
);
document.addEventListener("visibilitychange", function () {
  if (!document.hidden && session) wakeOn();
  if (!document.hidden && view.name === "profilo") refreshAuto();
});

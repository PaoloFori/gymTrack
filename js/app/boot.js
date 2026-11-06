/* Avvio dell'app. */
loadLocal();
applyTheme();
restoreSess();
render();
initCloud();
if (!CLOUD) {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  } catch (e) {}
  autoRestoreIfEmpty();
  refreshAuto();
}

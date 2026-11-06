/* Salvataggio locale, cloud, copie automatiche in IndexedDB, backup manuale. */
var autoList = [],
  snapT = null,
  lsEmpty = true;
function idb(cb) {
  try {
    var r = indexedDB.open("gymtrack", 1);
    r.onupgradeneeded = function () {
      r.result.createObjectStore("bk");
    };
    r.onsuccess = function () {
      cb(null, r.result);
    };
    r.onerror = function () {
      cb(r.error);
    };
  } catch (e) {
    cb(e);
  }
}
function idbPut(k, v) {
  idb(function (e, db) {
    if (e) return;
    try {
      db.transaction("bk", "readwrite").objectStore("bk").put(v, k);
    } catch (x) {}
  });
}
function idbDel(k) {
  idb(function (e, db) {
    if (e) return;
    try {
      db.transaction("bk", "readwrite").objectStore("bk").delete(k);
    } catch (x) {}
  });
}
function idbAll(cb) {
  idb(function (e, db) {
    if (e) return cb([]);
    try {
      var o = [],
        c = db.transaction("bk", "readonly").objectStore("bk").openCursor();
      c.onsuccess = function () {
        var cu = c.result;
        if (cu) {
          o.push({ k: cu.key, v: cu.value });
          cu.continue();
        } else cb(o);
      };
      c.onerror = function () {
        cb([]);
      };
    } catch (x) {
      cb([]);
    }
  });
}
function snapNow() {
  var day = new Date().toISOString().slice(0, 10),
    rec = {
      ts: Date.now(),
      n: LOG.length,
      ns: S.sessioni.length,
      txt: JSON.stringify({ v: 2, S: S, LOG: LOG })
    };
  idbPut("d-" + day, rec);
  idbPut("latest", rec);
  idbAll(function (all) {
    var days = all
      .filter(function (x) {
        return String(x.k).indexOf("d-") === 0;
      })
      .map(function (x) {
        return x.k;
      })
      .sort();
    days.slice(0, Math.max(0, days.length - 7)).forEach(idbDel);
  });
}
function scheduleSnap() {
  clearTimeout(snapT);
  snapT = setTimeout(snapNow, 2500);
}
function refreshAuto() {
  idbAll(function (all) {
    var l = all
      .filter(function (x) {
        return String(x.k).indexOf("d-") === 0;
      })
      .sort(function (a, b) {
        return a.k < b.k ? 1 : -1;
      });
    var sig = l
      .map(function (x) {
        return x.k + x.v.ts;
      })
      .join();
    if (
      sig !==
      autoList
        .map(function (x) {
          return x.k + x.v.ts;
        })
        .join()
    ) {
      autoList = l;
      if (view.name === "profilo" && !sheet) render();
    }
  });
}
function autoRestoreIfEmpty() {
  if (!lsEmpty) return;
  idbAll(function (all) {
    var l = all.filter(function (x) {
      return x.k === "latest";
    })[0];
    if (!l || !l.v || !(l.v.n || l.v.ns)) return;
    try {
      var o = JSON.parse(l.v.txt);
      S = normalize(o.S);
      LOG = Array.isArray(o.LOG) ? o.LOG : [];
      saveLocal();
      restoreSess();
      render();
      toast("Dati recuperati dal backup automatico");
    } catch (e) {}
  });
}
function loadLocal() {
  try {
    var raw = localStorage.getItem(LS);
    if (raw) {
      lsEmpty = false;
      var o = JSON.parse(raw);
      S = normalize(o.S);
      LOG = Array.isArray(o.LOG) ? o.LOG : [];
    }
  } catch (e) {}
}
function saveLocal() {
  try {
    localStorage.setItem(LS, JSON.stringify({ S: S, LOG: LOG.slice(0, 400) }));
  } catch (e) {}
  if (!CLOUD) scheduleSnap();
}
function saveApp() {
  saveLocal();
  dirty = true;
  clearTimeout(saveT);
  saveT = setTimeout(flush, 500);
}
function flush() {
  if (!appDoc) return;
  if (saving) {
    saveT = setTimeout(flush, 300);
    return;
  }
  saving = true;
  dirty = false;
  appDoc
    .set({ state: S, updated: Date.now() })
    .catch(function () {})
    .then(function () {
      saving = false;
      if (dirty) flush();
    });
}
async function initCloud() {
  try {
    var c = window.claude;
    if (!c || !c.use) return;
    var r = await Promise.all([c.use("db"), c.use("user"), c.use("sample")]);
    aiFn = r[2] || null;
    if (!r[0] || !r[1]) {
      if (sheet && sheet.kind === "ai") render();
      return;
    }
    var id = await r[1].id();
    if (!id) return;
    appDoc = r[0].doc("data/users/" + id + "/app");
    logCol = appDoc.collection("log");
    var snap = await appDoc.get();
    if (snap.exists && snap.data() && snap.data().state) S = normalize(clone(snap.data().state));
    var ls = await logCol.orderBy("ts", "desc").limit(400).get();
    if (ls.docs.length || snap.exists)
      LOG = ls.docs.map(function (x) {
        return clone(x.data());
      });
    mode = "cloud";
    saveLocal();
    if (!session) restoreSess();
    render();
    if (!snap.exists) flush();
  } catch (e) {
    appDoc = null;
    logCol = null;
  }
}
function exportBk() {
  var txt = JSON.stringify({ v: 2, S: S, LOG: LOG }),
    name = "gymtrack-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  function stamp() {
    S.lastBackup = Date.now();
    saveApp();
    render();
  }
  if (!CLOUD) {
    try {
      var f = new File([txt], name, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        navigator.share({ files: [f], title: "Backup GymTrack" }).then(
          function () {
            stamp();
            toast("Backup salvato");
          },
          function () {}
        );
        return;
      }
    } catch (e) {}
    var u = URL.createObjectURL(new Blob([txt], { type: "application/json" })),
      l = document.createElement("a");
    l.href = u;
    l.download = name;
    document.body.appendChild(l);
    l.click();
    l.remove();
    setTimeout(function () {
      URL.revokeObjectURL(u);
    }, 2000);
    stamp();
    toast("Backup scaricato");
    return;
  }
  try {
    navigator.clipboard.writeText(txt).then(
      function () {
        stamp();
        toast("Backup copiato");
      },
      function () {
        toast("Copia non consentita qui");
      }
    );
  } catch (e) {
    toast("Copia non consentita qui");
  }
}
function importBk() {
  var o = parseLoose(val("bk"));
  if (!o || !o.S) {
    toast("Backup non valido");
    return;
  }
  if (!confirmed("bk")) return;
  S = normalize(o.S);
  LOG = Array.isArray(o.LOG) ? o.LOG : [];
  saveApp();
  if (logCol)
    LOG.slice(0, 400).forEach(function (l) {
      logCol
        .doc(l.id)
        .set(l)
        .catch(function () {});
    });
  view = { name: "home" };
  render();
  toast("Backup ripristinato");
}
function backupDue() {
  if (mode === "cloud" || !LOG.length) return 0;
  var n = LOG.filter(function (l) {
      return l.ts > (S.lastBackup || 0);
    }).length,
    ref = S.lastBackup || LOG[LOG.length - 1].ts;
  return n >= 10 || (n > 0 && Date.now() - ref > 30 * 864e5) ? n : 0;
}
function backupBanner() {
  var n = backupDue();
  if (!n) return "";
  return (
    '<div class="banner"><b>Fai un backup</b>Hai ' +
    n +
    (n === 1 ? " allenamento" : " allenamenti") +
    ' non ancora salvati in un backup: se cancelli i dati del browser li perdi.<br><button class="btn primary small" style="margin-top:8px" data-act="export-bk">Scarica backup</button></div>'
  );
}

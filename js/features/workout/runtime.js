/* Allenamento in corso: suoni, notifiche, schermo acceso, timer di recupero, salvataggio. */
/* ---------- allenamento ---------- */
var actx = null,
  wl = null,
  wlOn = false;
function unlockAudio() {
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = actx || new AC();
    if (actx.state === "suspended") actx.resume();
  } catch (e) {}
}
function beep() {
  try {
    unlockAudio();
    if (!actx) return;
    [0, 0.28].forEach(function (d) {
      var o = actx.createOscillator(),
        g = actx.createGain();
      o.frequency.value = 880;
      g.gain.value = 0.2;
      o.connect(g);
      g.connect(actx.destination);
      o.start(actx.currentTime + d);
      o.stop(actx.currentTime + d + 0.2);
    });
  } catch (e) {}
}
function notifState() {
  return typeof Notification === "undefined" ? "no" : Notification.permission;
}
function askNotif() {
  try {
    if (notifState() === "default")
      Notification.requestPermission().then(
        function () {
          render();
        },
        function () {}
      );
  } catch (e) {}
}
function notify(t, b, tag) {
  try {
    if (notifState() !== "granted") return;
    var o = {
      body: b,
      icon: "icons/icon-192.png",
      tag: tag || "gymtrack-rest",
      renotify: true,
      vibrate: [200, 100, 200]
    };
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration)
      navigator.serviceWorker.getRegistration().then(
        function (r) {
          if (r) r.showNotification(t, o);
          else new Notification(t, o);
        },
        function () {
          new Notification(t, o);
        }
      );
    else new Notification(t, o);
  } catch (e) {}
}
function restDone() {
  try {
    if (navigator.vibrate) navigator.vibrate([250, 120, 250]);
  } catch (e) {}
  beep();
  notify("Recupero finito", "Tocca per la prossima serie");
}
function wakeOn() {
  try {
    if (navigator.wakeLock && !wl)
      navigator.wakeLock.request("screen").then(
        function (x) {
          wl = x;
          x.addEventListener("release", function () {
            wl = null;
          });
        },
        function () {}
      );
  } catch (e) {}
}
function wakeOff() {
  try {
    if (wl) wl.release();
    wl = null;
  } catch (e) {}
}
function saveSess() {
  try {
    if (session) localStorage.setItem(LS + ".s", JSON.stringify(session));
    else localStorage.removeItem(LS + ".s");
  } catch (e) {}
}
function restoreSess() {
  try {
    var o = JSON.parse(localStorage.getItem(LS + ".s") || "null"),
      a = attiva();
    if (o && a && o.sid === a.id && Date.now() - o.t0 < 8 * 36e5 && getScheda(a, o.schedaId)) {
      session = o;
      view = { name: "workout" };
      clearInterval(tick);
      tick = setInterval(updateTimer, 500);
      wakeOn();
    } else if (o && Date.now() - o.t0 >= 8 * 36e5) localStorage.removeItem(LS + ".s");
  } catch (e) {}
}
function startWorkout(id) {
  var a = attiva(),
    s = getScheda(a, id);
  if (!s) return;
  unlockAudio();
  askNotif();
  wakeOn();
  session = {
    sid: a.id,
    schedaId: s.id,
    schedaNome: s.nome,
    t0: Date.now(),
    ex: s.esercizi.map(function (e) {
      var le = lastEntry(e.id, e.nome),
        prev = le ? le.sets : null,
        n = Math.max(1, parseInt(e.serie, 10) || 3),
        r0 = (String(e.reps).match(/\d+/) || [""])[0],
        sets = [],
        i;
      for (i = 0; i < (e.riscal || 0); i++) sets.push({ kg: "", reps: r0, done: false, w: true });
      for (i = 0; i < n; i++) {
        var p = prev && (prev[i] || prev[prev.length - 1]);
        sets.push({ kg: p ? String(p.kg) : "", reps: p ? String(p.reps) : r0, done: false });
      }
      return {
        completed: false,
        id: e.id,
        nome: e.nome,
        serie: e.serie,
        reps: e.reps,
        rec: Number(e.rec) || 0,
        note: e.note,
        gif: e.gif || "",
        sup: !!e.sup,
        riscal: e.riscal || 0,
        prev: prev,
        prevTs: le ? le.ts : 0,
        sets: sets
      };
    })
  };
  view = { name: "workout" };
  timer = null;
  saveSess();
  window.scrollTo(0, 0);
  render();
  clearInterval(tick);
  tick = setInterval(updateTimer, 500);
}
function updateTimer() {
  if ((view.name !== "workout" && view.name !== "wex") || !session) {
    clearInterval(tick);
    return;
  }
  var el = document.getElementById("elapsed");
  if (el) el.textContent = fmtDur(Date.now() - session.t0);
  var box = document.getElementById("restbox");
  if (!box) return;
  if (!timer) {
    box.innerHTML = "";
    return;
  }
  var left = Math.ceil((timer.end - Date.now()) / 1000);
  if (left <= 0 && !timer.over) {
    timer.over = Date.now();
    restDone();
  }
  if (timer.over && Date.now() - timer.over > 5000) {
    timer = null;
    box.innerHTML = "";
    return;
  }
  var txt = timer.over ? "Via!" : Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
  box.innerHTML =
    '<div class="rest' +
    (timer.over ? " end" : "") +
    '"><span class="l">Recupero</span><b>' +
    txt +
    '</b><span style="flex:1"></span><button class="btn small" data-act="skip-rest">Salta</button></div>';
}
function finishWorkout() {
  var n = 0;
  session.ex.forEach(function (e) {
    e.sets.forEach(function (x) {
      if (x.done) n++;
    });
  });
  if (!n) {
    toast("Segna almeno una serie come fatta");
    return;
  }
  if (!confirmed("ff")) return;
  doFinish({});
}
function doFinish(k) {
  var out = [];
  session.ex.forEach(function (e) {
    var sets = e.sets
      .filter(function (x) {
        return x.done;
      })
      .map(function (x) {
        var o = { kg: num(x.kg), reps: Math.round(num(x.reps)) };
        if (x.w) o.w = true;
        return o;
      });
    if (sets.length) out.push({ id: e.id, nome: e.nome, sets: sets });
  });
  var a = attiva(),
    g0 = a ? progress(a) : null,
    prs = findPRs(out);
  var entry = {
    id: uid(),
    ts: Date.now(),
    sid: session.sid,
    schedaId: session.schedaId,
    schedaNome: session.schedaNome,
    durMin: Math.max(1, Math.round((Date.now() - session.t0) / 60000)),
    durSec: Math.round((Date.now() - session.t0) / 1000),
    ex: out,
    fat: 0,
    nota: "",
    prs: prs
  };
  LOG.unshift(entry);
  saveLocal();
  if (logCol)
    logCol
      .doc(entry.id)
      .set(entry)
      .catch(function () {
        toast("Salvato solo su questo dispositivo");
      });
  var msg = "Allenamento salvato";
  if (a) {
    var g1 = progress(a);
    msg += g1.pend && !g0.pend ? " · settimana completa: boost d'aura!" : " · l'avatar cresce";
  }
  session = null;
  saveSess();
  wakeOff();
  timer = null;
  view = { name: "corrente" };
  edit = false;
  sheet = prs.length ? { kind: "pr", prs: prs } : null;
  render();
  window.scrollTo(0, 0);
  toast(msg);
}

ACT["start"] = function (d) {
  startWorkout(d.id);
};
ACT["open-ex"] = function (d) {
  view = { name: "wex", i: Number(d.e) };
  render();
  window.scrollTo(0, 0);
};
ACT["ex-done"] = function (d) {
  var xd = session.ex[view.i];
  if (
    xd &&
    xd.sets.every(function (q) {
      return q.done;
    })
  ) {
    xd.completed = true;
    saveSess();
    view = { name: "workout" };
    render();
    window.scrollTo(0, 0);
  }
};
ACT["set-done"] = function (d) {
  var cur = attiva(),
    s = cur && getScheda(cur, d.id);
  unlockAudio();
  var ex0 = session.ex[d.e],
    st = ex0.sets[d.s];
  if (st.done) return;
  st.done = true;
  if (
    ex0.sets.every(function (q) {
      return q.done;
    })
  ) {
    timer = null;
    toast("Esercizio finito: premi Fatto");
  } else if (ex0.sup && session.ex[Number(d.e) + 1] && !st.w) {
    timer = null;
    toast("Superset: passa a " + session.ex[Number(d.e) + 1].nome);
  } else if (st.w) timer = { end: Date.now() + Math.min(ex0.rec || 45, 45) * 1000 };
  else if (ex0.rec > 0) timer = { end: Date.now() + ex0.rec * 1000 };
  saveSess();
  render();
};
ACT["add-set"] = function (d) {
  var ss = session.ex[d.e].sets,
    lp = ss[ss.length - 1];
  ss.push({ kg: lp ? lp.kg : "", reps: lp ? lp.reps : "", done: false, added: true });
  saveSess();
  render();
};
ACT["rm-set"] = function (d) {
  var rs = session.ex[d.e].sets,
    rl = rs[rs.length - 1];
  if (rl && rl.added && !rl.done) {
    rs.pop();
    saveSess();
    render();
  } else toast("Puoi togliere solo le serie che hai aggiunto");
};
ACT["skip-rest"] = function (d) {
  timer = null;
  updateTimer();
};
ACT["finish"] = function (d) {
  finishWorkout();
};
ACT["cancel-workout"] = function (d) {
  if (!confirmed("cw")) return;
  session = null;
  saveSess();
  wakeOff();
  timer = null;
  view = { name: "corrente" };
  render();
};

HOOKS.input.push(function (t) {
  if (!t.dataset.f || !session) return false;
  session.ex[t.dataset.e].sets[t.dataset.s][t.dataset.f] = t.value;
  saveSess();
  return true;
});

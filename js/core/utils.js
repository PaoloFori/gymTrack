/* Utilità generali: id, escape HTML, numeri, date, messaggi, conferma a due tocchi. */
function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function num(v) {
  var n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function kgf(n) {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}
function sod(t) {
  var d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function wsOf(t) {
  var d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}
function fd(t) {
  return new Date(t).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}
function fdl(t) {
  return new Date(t).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
}
function rel(ts) {
  var d = Math.round((sod(Date.now()) - sod(ts)) / 864e5);
  return d <= 0 ? "oggi" : d === 1 ? "ieri" : d + " giorni fa";
}
function clone(o) {
  return JSON.parse(JSON.stringify(o));
}
function fmtRec(sec) {
  sec = Number(sec) || 0;
  return sec < 60 ? sec + "″" : Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
}
function fmtDur(ms) {
  var t = Math.max(0, Math.floor(ms / 1000)),
    h = Math.floor(t / 3600),
    m = Math.floor(t / 60) % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(t % 60).padStart(2, "0");
}
function toast(m) {
  var t = document.getElementById("toast");
  t.textContent = m;
  t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(function () {
    t.hidden = true;
  }, 2600);
}
function confirmed(key) {
  if (armed === key) {
    armed = "";
    return true;
  }
  armed = key;
  render();
  setTimeout(function () {
    if (armed === key) {
      armed = "";
      render();
    }
  }, 3500);
  return false;
}
/* ---------- azioni ---------- */
function val(id) {
  var e = document.getElementById(id);
  return e ? e.value : "";
}
function move(arr, i, d) {
  var j = i + d;
  if (j < 0 || j >= arr.length) return;
  var t = arr[i];
  arr[i] = arr[j];
  arr[j] = t;
}
function parseLoose(t) {
  t = String(t || "");
  try {
    return JSON.parse(t);
  } catch (e) {}
  var i = t.indexOf("{"),
    j = t.lastIndexOf("}");
  if (i >= 0 && j > i) {
    try {
      return JSON.parse(t.slice(i, j + 1));
    } catch (e) {}
  }
  return null;
}
function showErr(m) {
  var e = document.getElementById("err");
  if (!e) return;
  e.textContent = "Errore: " + m;
  e.hidden = false;
  clearTimeout(showErr.t);
  showErr.t = setTimeout(function () {
    e.hidden = true;
  }, 9000);
}

/* Copia un testo negli appunti; se il browser non lo permette, lo seleziona perché si possa copiare a mano. */
function copyText(txt, okMsg) {
  function manual() {
    var t = document.querySelector(".sheet textarea[readonly]");
    if (t) {
      t.focus();
      t.select();
    }
    toast("Seleziona il testo e copialo a mano");
  }
  try {
    navigator.clipboard.writeText(txt).then(function () {
      toast(okMsg || "Testo copiato");
    }, manual);
  } catch (e) {
    manual();
  }
}

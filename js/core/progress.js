/* Progresso di una sessione: forma, grasso, aura; simulazione per sessioni già concluse. */
function stimaSettimane(c) {
  var h = num(c.altezza) || 175,
    w = num(c.peso) || 75,
    bmi = w / Math.pow(h / 100, 2),
    o = c.obiettivo;
  if (o === "Dimagrimento") return clamp(Math.round(Math.max(0, w - 22.5 * Math.pow(h / 100, 2)) / 0.5), 8, 40);
  if (o === "Forza") return 20 + (bmi < 18.5 ? 4 : 0);
  if (o === "Mantenimento") return 12;
  if (o === "Ricomposizione") return 28 + (bmi > 27 ? 4 : 0);
  return 24 + (bmi < 18.5 ? 6 : 0);
}
function progress(a) {
  var D = durWeeks(a),
    target = Number(a.giorni) || 4,
    end = endOf(a),
    now = Date.now(),
    over = now >= end,
    ws0 = wsOf(a.start);
  var M = Math.max(1, Math.round(target * D)),
    n = over ? Math.ceil((end - ws0) / WEEK) : Math.round((wsOf(now) - ws0) / WEEK),
    c = [],
    tot = 0;
  for (var i = 0; i <= n; i++) c.push(0);
  LOG.forEach(function (l) {
    if (l.sid === a.id && l.ts >= a.start && l.ts <= end) {
      tot++;
      var k = Math.floor((l.ts - ws0) / WEEK);
      if (k >= 0 && k <= n) c[k]++;
    }
  });
  function tj(j) {
    var s0 = ws0 + j * WEEK,
      lo = Math.max(a.start, s0),
      hi = Math.min(end, s0 + WEEK);
    return clamp(Math.ceil((target * (hi - lo)) / WEEK - 0.01), 1, target);
  }
  var B = 0,
    A = 0,
    lastW = null,
    minB = -3 * target;
  for (var j = 0; j < n; j++) {
    var t = tj(j),
      cc = Math.min(c[j], t),
      g = 2 * cc - t,
      perfect = cc >= t;
    B = clamp(B + g, minB, M);
    if (perfect) A++;
    else A = cc === 0 ? 0 : Math.max(0, A - 1);
    lastW = { c: cc, t: t, g: g, perfect: perfect };
  }
  var tc = over ? 0 : tj(n),
    cc2 = over ? 0 : Math.min(c[n], tc),
    pend = !over && cc2 >= tc,
    Bd = over ? B : clamp(B + cc2, minB, M);
  return {
    B: Bd,
    M: M,
    P: (100 * clamp(Bd, 0, M)) / M,
    p: Math.pow(clamp(Bd, 0, M) / M, 0.75),
    fat: clamp(-Bd / (2 * target), 0, 1),
    aura: A + (pend ? 1 : 0),
    pend: pend,
    thisC: cc2,
    thisT: tc,
    lastW: lastW,
    over: over,
    end: end,
    D: D,
    target: target,
    tot: tot,
    weeks: n
  };
}
/* Simula l'andamento di una sessione già finita: «total» allenamenti distribuiti uniformemente su «W» settimane. */
function simFinal(target, W, total) {
  var M = Math.max(1, Math.round(target * W)),
    base = Math.floor(total / W),
    extra = total - base * W,
    B = 0,
    A = 0,
    minB = -3 * target;
  for (var j = 0; j < W; j++) {
    var c = base + (Math.floor(((j + 1) * extra) / W) > Math.floor((j * extra) / W) ? 1 : 0),
      cc = Math.min(c, target),
      g = 2 * cc - target;
    B = clamp(B + g, minB, M);
    if (cc >= target) A++;
    else A = cc === 0 ? 0 : Math.max(0, A - 1);
  }
  var b = clamp(B, 0, M);
  return { P: (100 * b) / M, p: Math.pow(b / M, 0.75), fat: clamp(-B / (2 * target), 0, 1), aura: A };
}

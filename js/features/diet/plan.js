/* Piano settimanale (anche con cottura unica) e lista della spesa. */
/* ---- piano settimanale ---- */
function itemRole(item) {
  var c = {};
  item.opzioni.forEach(function (o) {
    var k = catOf(o.n);
    k = k === "colaz" ? "carbo" : k;
    c[k] = (c[k] || 0) + 1;
  });
  var best =
    Object.keys(c).sort(function (a, b) {
      return c[b] - c[a];
    })[0] || "altro";
  return best === "carbo" || best === "verd" || best === "grassi" || best === "frut" || best === "dolci" ? best : "prot";
}
function activeOpts(item) {
  return item.opzioni.filter(function (o) {
    return o.on && o.qt > 0;
  });
}
function makePlan(d, seed) {
  seed = seed || 0;
  var R = d.regole || {},
    cnt = {},
    use = {},
    last = {},
    plan = [],
    cook = d.cook || { mode: "due" },
    meals = d.pasti.filter(function (m) {
      return m.on;
    }),
    pref = d.pref || "indiff";
  var li = meals.findIndex(function (m) {
      return /pranzo/i.test(m.nome);
    }),
    di = meals.findIndex(function (m) {
      return /cena/i.test(m.nome);
    });
  var batch = cook.mode === "uno" && li >= 0 && di >= 0,
    picks = {}; /* picks[giorno][pasto] = [{role, name, entry}] */
  /* pasti liberi (sgarro): regole.libero.n a settimana, a cena (o all'ultimo pasto), in giorni distanziati */
  var nFree = Math.min(14, (R.libero && Number(R.libero.n)) || 0),
    freeMi =
      di >= 0
        ? meals.findIndex(function (m) {
            return /cena/i.test(m.nome);
          })
        : meals.length - 1,
    freeAt = {};
  [5, 2, 6, 0, 3, 1, 4].forEach(function (fd, i) {
    if (i < nFree) freeAt[fd] = freeMi;
  });
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
    return h;
  }
  function pickVar(p, day, mi) {
    var vs = p.varianti.filter(function (v) {
      return (
        v.on &&
        v.alimenti.some(function (a) {
          return activeOpts(a).length;
        })
      );
    });
    if (!vs.length) return null;
    var best = null,
      bs = -1e9;
    vs.forEach(function (v, i) {
      var s = -(use[v.id] || 0) * 10 - ((i + day + mi + seed) % vs.length) * 0.5;
      if (s > bs) {
        bs = s;
        best = v;
      }
    });
    use[best.id] = (use[best.id] || 0) + 1;
    return best;
  }
  function score(o, day, dayNames, bonus) {
    var s = bonus || 0;
    optKeys(o.n).forEach(function (k) {
      var r = R[k];
      if (!r) return;
      var c = cnt[k] || 0;
      if (r.max != null && c >= r.max) s -= 1000;
      if (r.min != null) {
        var tg = (r.min * (day + 1)) / 7;
        if (c < tg) s += (tg - c) * 10 + 5;
      } else if (r.max != null) {
        var tm = ((r.max - 1) * (day + 1)) / 7;
        if (c < tm) s += (tm - c) * 6;
        s -= (c / r.max) * 2;
      }
    });
    var ok = optKeys(o.n);
    if (pref !== "indiff") {
      if (ok.indexOf(pref) >= 0) s += 4;
      else if (ok.indexOf(pref === "carne" ? "pesce" : "carne") >= 0) s -= 2;
    }
    s -= (use[o.id] || 0) * 3;
    if (last[o.id] === day - 1) s -= 4;
    if (dayNames[nname(o.n)]) s -= 6;
    return s + ((hash(o.n) + day + seed) % 7) * 0.05;
  }
  for (var day = 0; day < 7; day++) {
    var dayNames = {},
      dayPlan = [];
    picks[day] = {};
    meals.forEach(function (m, mi) {
      var entries = [],
        mine = [];
      if (freeAt[day] === mi) {
        picks[day][mi] = [];
        dayPlan.push({ t: m.nome, v: [{ n: "Pasto libero", qt: 0, u: "", libero: true, nota: "con moderazione, a buon senso" }] });
        return;
      }
      m.piatti.forEach(function (p) {
        var v = pickVar(p, day, mi);
        if (!v) return;
        v.alimenti.forEach(function (item) {
          var opts = activeOpts(item);
          if (!opts.length) return;
          var role = itemRole(item),
            chosen = null,
            inh = null;
          /* cottura unica: il secondo pasto della coppia riprende l'alimento già cucinato */
          if (batch) {
            var srcDay = null,
              srcMeal = null;
            if (cook.dir === "pranzo" && mi === di) {
              srcDay = day;
              srcMeal = li;
            } else if (cook.dir !== "pranzo" && mi === li && day > 0) {
              srcDay = day - 1;
              srcMeal = di;
            }
            if (srcMeal !== null && (role === "carbo" || role === "prot" || role === "verd")) {
              var pool = (picks[srcDay][srcMeal] || []).filter(function (q) {
                return q.role === role && !q.used;
              });
              for (var q = 0; q < pool.length && !chosen; q++) {
                var hit = opts.find(function (o) {
                  return nname(o.n) === pool[q].name;
                });
                if (hit) {
                  chosen = hit;
                  inh = pool[q];
                  inh.used = true;
                }
              }
            }
          }
          if (!chosen) {
            var bs = -1e9;
            opts.forEach(function (o) {
              var bonus = 0;
              if (batch && (role === "carbo" || role === "prot" || role === "verd")) {
                var dm = null,
                  dd = null;
                if (cook.dir === "pranzo" && mi === li) {
                  dm = di;
                  dd = day;
                } else if (cook.dir !== "pranzo" && mi === di && day < 6) {
                  dm = li;
                  dd = day + 1;
                }
                if (dm !== null) {
                  var dest = meals[dm];
                  dest.piatti.forEach(function (pp) {
                    pp.varianti.forEach(function (vv) {
                      vv.alimenti.forEach(function (aa) {
                        if (
                          itemRole(aa) === role &&
                          activeOpts(aa).some(function (z) {
                            return nname(z.n) === nname(o.n);
                          })
                        )
                          bonus = 7;
                      });
                    });
                  });
                }
              }
              var s = score(o, day, dayNames, bonus);
              if (s > bs) {
                bs = s;
                chosen = o;
              }
            });
          }
          optKeys(chosen.n).forEach(function (k) {
            cnt[k] = (cnt[k] || 0) + 1;
          });
          use[chosen.id] = (use[chosen.id] || 0) + 1;
          last[chosen.id] = day;
          dayNames[nname(chosen.n)] = 1;
          var e = { n: chosen.n, qt: chosen.qt, u: chosen.u };
          entries.push(e);
          mine.push({ role: role, name: nname(chosen.n), entry: e, used: false });
          if (inh) {
            e.nota = cook.dir === "pranzo" ? "già pronto: cucinato a pranzo" : "già pronto: cucinato ieri sera";
            e.pair = inh.entry;
            inh.entry.pair = e;
            inh.entry.first = true;
          }
        });
      });
      picks[day][mi] = mine;
      dayPlan.push({ t: m.nome, v: entries });
    });
    plan.push(dayPlan);
  }
  /* note di cottura sul primo pasto della coppia */
  plan.forEach(function (dp) {
    dp.forEach(function (m) {
      m.v.forEach(function (e) {
        if (e.first && e.pair) {
          e.nota =
            "cucina " +
            fmtQ(e.qt + e.pair.qt, e.u) +
            " in totale (anche per " +
            (cook.dir === "pranzo" ? "la cena di oggi" : "il pranzo di domani") +
            ")";
        }
      });
    });
  });
  plan.forEach(function (dp) {
    dp.forEach(function (m) {
      m.v.forEach(function (e) {
        delete e.pair;
        delete e.first;
      });
    });
  });
  return plan;
}
function makeSpesa(d, old) {
  var tot = {},
    ticks = {};
  (old || []).forEach(function (x) {
    ticks[x.k] = x.preso;
  });
  d.plan.forEach(function (day) {
    day.forEach(function (m) {
      m.v.forEach(function (it) {
        if (it.libero) return;
        var k = nname(it.n) + "|" + it.u,
          t = tot[k] || (tot[k] = { k: k, n: it.n, u: it.u, q: 0 });
        t.q += it.qt;
      });
    });
  });
  return Object.keys(tot)
    .map(function (k) {
      var t = tot[k];
      return { k: k, n: t.n, cat: catOf(t.n), q: t.q, u: t.u, preso: !!ticks[k] };
    })
    .sort(function (a, b) {
      return DC[a.cat].g < DC[b.cat].g ? -1 : DC[a.cat].g > DC[b.cat].g ? 1 : 0;
    });
}
function fmtQ(q, u) {
  q = Math.round(q * 10) / 10;
  if (u === "g" && q >= 1000) return kgf(q / 1000) + " kg";
  if (u === "ml" && q >= 1000) return kgf(q / 1000) + " l";
  return kgf(q) + " " + (u || "");
}

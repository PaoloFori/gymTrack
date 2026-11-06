/* Disegno SVG degli avatar, in stile cartoon «chibi»: testa grande, occhi lucidi, contorni scuri.
   Un solo scheletro (rig) per tutte le specie; ogni specie aggiunge orecchie, muso, coda ecc.
   Il corpo si interpola da «fuori obiettivo» a «obiettivo perfetto» (grasso F, muscolo Mu, magrezza T, vedi avState);
   l'abbigliamento cambia con l'evoluzione (stage 0–4); l'aura a fiamme dipende dagli allenamenti settimanali completi. */

var SK = "#2b2233"; // colore dei contorni
Object.keys(OBJP).forEach(function (k) {
  OBJP[k].name = k;
});
var svgN = 0;
/* Colori per specie: bc = pelo/pelle, bs = pancia/muso, bd = dettagli scuri. */
var PAL = {
  umano: { bc: "#f2c29b", bs: "#f8dcc3", hair: "#3b2a1d" },
  donna: { bc: "#f6cba8", bs: "#fbe3d0", hair: "#7a3b1d" },
  animale: { bc: "#a3683e", bs: "#ebcca3", bd: "#5b3720" },
  lupo: { bc: "#8e9aab", bs: "#e8edf4", bd: "#4a5565" },
  gorilla: { bc: "#4a5060", bs: "#a9afbd", bd: "#262a33" },
  leone: { bc: "#e8b04a", bs: "#f8e3ac", bd: "#a8671c", md: "#b8691b" },
  toro: { bc: "#7a5440", bs: "#e2cdb2", bd: "#3a281d" },
  gatto: { bc: "#f09a4d", bs: "#fff0dd", bd: "#b0601f" },
  cane: { bc: "#d9a066", bs: "#fbeacc", bd: "#8a5a30" },
  alieno: { bc: "#8ee26b", bs: "#c9f5b5", bd: "#3d8f3a" }
};
/* Proporzioni per specie: hs testa, bw busto, aw braccia, lw gambe. */
var SPEC = {
  umano: { hs: 1, bw: 1, aw: 1, lw: 1 },
  donna: { hs: 1, bw: 1, aw: 0.9, lw: 0.92 },
  animale: { hs: 1.02, bw: 1.08, aw: 1.05, lw: 1.05 },
  lupo: { hs: 1, bw: 0.98, aw: 0.95, lw: 0.95 },
  gorilla: { hs: 0.95, bw: 1.18, aw: 1.35, lw: 1.05 },
  leone: { hs: 1, bw: 1.02, aw: 1, lw: 1 },
  toro: { hs: 1, bw: 1.12, aw: 1.12, lw: 1.05 },
  gatto: { hs: 1.04, bw: 0.86, aw: 0.82, lw: 0.82 },
  cane: { hs: 1.02, bw: 0.95, aw: 0.92, lw: 0.92 },
  alieno: { hs: 1.1, bw: 0.8, aw: 0.7, lw: 0.7 }
};
/* Colore del completo per obiettivo. */
var OC = { Ipertrofia: "#e5473b", Forza: "#f0a31a", Dimagrimento: "#19b3a6", Mantenimento: "#3fae5e", Ricomposizione: "#8a5cf0" };

/* Stato del corpo: interpolato tra p=0 (completamente fuori obiettivo) e p=1 (obiettivo perfetto). */
function avState(O, ctx, st) {
  var h = num(ctx.altezza) || 175,
    w = num(ctx.peso) || 75,
    bmi = w / Math.pow(h / 100, 2);
  var pr = clamp(st.p || 0, 0, 1),
    fg = clamp(st.fat || 0, 0, 1),
    adj = clamp((bmi - 23) / 12, -0.25, 0.25);
  return {
    pr: pr,
    fg: fg,
    F: clamp(lerp(O.f0, O.f1, pr) + adj * (1 - pr * 0.6) + fg * 0.9, 0, 1.3),
    Mu: clamp(lerp(O.m0, O.m1, pr) * (1 - fg * 0.5), 0, 1),
    T: clamp(lerp(O.t0, O.t1, pr) * (1 - fg), 0, 1),
    k: O.thick,
    sl: lerp(O.s0, 0, pr) + fg * 8,
    sad: fg > 0.25,
    sc: lerp(0.86, 1, pr) * clamp(0.94 + ((h - 165) / 30) * 0.08, 0.9, 1.06),
    stage: stageOf(100 * Math.pow(pr, 1 / 0.75))
  };
}

function n1(v) {
  return (+v).toFixed(1);
}
function ell(cx, cy, rx, ry, fill, sw) {
  return `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="${fill}" stroke="${SK}" stroke-width="${sw || 2.4}"/>`;
}
function cir(cx, cy, r, fill, sw) {
  return `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}" fill="${fill}" stroke="${SK}" stroke-width="${sw || 2.4}"/>`;
}
function pth(d, fill, sw) {
  return `<path d="${d}" fill="${fill}" stroke="${SK}" stroke-width="${sw || 2.4}" stroke-linejoin="round" stroke-linecap="round"/>`;
}
/* Arto con contorno: una linea scura larga sotto, una colorata più stretta sopra. */
function limb(x1, y1, x2, y2, w, fill) {
  return `<g stroke-linecap="round"><line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${SK}" stroke-width="${n1(w + 4.8)}"/><line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${fill}" stroke-width="${n1(w)}"/></g>`;
}
function dumbbell(x, y) {
  return `<line x1="${n1(x - 9)}" y1="${n1(y)}" x2="${n1(x + 9)}" y2="${n1(y)}" stroke="${SK}" stroke-width="4" stroke-linecap="round"/><rect x="${n1(x - 14)}" y="${n1(y - 8)}" width="7" height="16" rx="2" fill="#8b95a3" stroke="${SK}" stroke-width="1.6"/><rect x="${n1(x + 7)}" y="${n1(y - 8)}" width="7" height="16" rx="2" fill="#8b95a3" stroke="${SK}" stroke-width="1.6"/>`;
}

/* ---- aura a fiamme (stile Dragon Ball): più boost = fiamme più alte e luminose; si accende solo con le settimane perfette ---- */
function flamePts(cx, by, W, H, spikes, j) {
  var N = spikes * 2,
    pts = [[cx - W, by]];
  for (var i = 0; i <= N; i++) {
    var th = Math.PI - (Math.PI * i) / N,
      tall = i % 2 === 1 ? 1 : 0.7,
      wob = 1 + 0.09 * Math.sin(i * 1.7 + j * 2.1),
      r = tall * wob * (1 + 0.28 * Math.sin(th));
    pts.push([cx + Math.cos(th) * W * Math.min(r, 1.08), by - Math.sin(th) * H * r]);
  }
  pts.push([cx + W, by]);
  return pts.map((p) => n1(p[0]) + "," + n1(p[1])).join(" ");
}
function auraSVG(k, anim) {
  if (!k) return "";
  svgN++;
  var n = Math.min(k, 10),
    H = Math.min(70 + n * 13, 190),
    W = Math.min(50 + n * 7, 112),
    sp = 5 + Math.round(n / 2),
    cols = n >= 7 ? ["#5fc8ff", "#b9ebff", "#ffffff"] : n >= 4 ? ["#ff9d00", "#ffd92e", "#fff6bd"] : ["#ffc247", "#ffe587", "#fffbe0"],
    id = "ag" + svgN,
    o = `<defs><radialGradient id="${id}" cx="50%" cy="60%" r="55%"><stop offset="0.2" stop-color="${cols[1]}" stop-opacity="0.75"/><stop offset="1" stop-color="${cols[0]}" stop-opacity="0"/></radialGradient></defs><ellipse cx="100" cy="${n1(250 - H * 0.45)}" rx="${n1(W * 1.1)}" ry="${n1(H * 0.62)}" fill="url(#${id})"/>`;
  [1, 0.76, 0.5].forEach((s, i) => {
    var v = [0, 1, 2].map((j) => flamePts(100, 250, W * s, H * s, sp, j + i));
    o += `<polygon points="${v[0]}" fill="${cols[i]}" opacity="${[0.62, 0.8, 0.9][i]}">${anim ? `<animate attributeName="points" values="${[v[0], v[1], v[2], v[0]].join(";")}" dur="${[1.1, 0.9, 0.7][i]}s" repeatCount="indefinite"/>` : ""}</polygon>`;
  });
  return o;
}

/* ---- accessori di obiettivo: manubri (ipertrofia), bilanciere (forza), metro (dimagrimento), medaglia (mantenimento) ---- */
function propsSVG(O, A, H) {
  var o = "",
    f = clamp((A.pr - 0.72) / 0.28, 0, 1);
  if (O.prop === "db" && f > 0.3) o += dumbbell(H.xl, H.hy) + dumbbell(H.xr, H.hy);
  if (O.prop === "bar" && f > 0.3) {
    var xl = H.xl,
      xr = H.xr,
      y = H.hy - 4;
    o += `<line x1="${n1(xl - 46)}" y1="${n1(y)}" x2="${n1(xr + 46)}" y2="${n1(y)}" stroke="${SK}" stroke-width="6" stroke-linecap="round"/><line x1="${n1(xl - 46)}" y1="${n1(y)}" x2="${n1(xr + 46)}" y2="${n1(y)}" stroke="#aab3c0" stroke-width="3" stroke-linecap="round"/>`;
    [-1, 1].forEach((d) => {
      var bx = d < 0 ? xl - 38 : xr + 38;
      o += `<rect x="${n1(bx - 6)}" y="${n1(y - 22)}" width="12" height="44" rx="4" fill="#5a6472" stroke="${SK}" stroke-width="2"/><rect x="${n1(bx + d * 13 - 4)}" y="${n1(y - 15)}" width="8" height="30" rx="3" fill="#8b95a3" stroke="${SK}" stroke-width="2"/>`;
    });
  }
  if (O.prop === "tape" && A.pr > 0.45) {
    var tw = H.ww + 4;
    o += `<rect x="${n1(100 - tw)}" y="${n1(H.wy - 10)}" width="${n1(tw * 2)}" height="9" rx="3" fill="#f2c200" stroke="${SK}" stroke-width="1.8"/>`;
    for (var i = -3; i <= 3; i++)
      o += `<line x1="${n1(100 + (i * tw) / 3.4)}" y1="${n1(H.wy - 10)}" x2="${n1(100 + (i * tw) / 3.4)}" y2="${n1(H.wy - 5)}" stroke="#7a6200" stroke-width="1.2"/>`;
    o += `<path d="M${n1(100 + tw - 6)} ${n1(H.wy - 1)} q4 14 0 24 l7 0 q4 -12 0 -24z" fill="#f2c200" stroke="${SK}" stroke-width="1.8"/>`;
  }
  if (O.prop === "medal" && A.pr > 0.65) {
    o += `<path d="M91 ${n1(H.cy - 24)} L100 ${n1(H.cy - 2)} L109 ${n1(H.cy - 24)}" fill="none" stroke="#c2362b" stroke-width="5" stroke-linejoin="round"/><circle cx="100" cy="${n1(H.cy + 4)}" r="9" fill="#f0c040" stroke="${SK}" stroke-width="2"/><path d="M100 ${n1(H.cy - 1)} l2.2 4.4 4.8 .6 -3.5 3.3 .9 4.7 -4.4 -2.3 -4.4 2.3 .9 -4.7 -3.5 -3.3 4.8 -.6z" fill="#fff3c2"/>`;
  }
  return o;
}

/* ---- abbigliamento: evolve con lo stage (0 = sformato e triste … 4 = completo da campione) ---- */
function outfitFor(O, stage) {
  var c = OC[O.name] || "#e5473b",
    dk = "#2b2f3a";
  var t = [
    { top: "loose", topC: "#b9bfca", bot: "#8d95a3", shoe: "#c9ced8" },
    { top: "tee", topC: c, bot: "#394150", shoe: "#dfe3ea" },
    { top: "tank", topC: c, bot: "#2d3442", shoe: c, band: c },
    { top: "tank", topC: dk, bot: c, shoe: c, band: c, trim: c }
  ][Math.min(stage, 3)];
  if (stage >= 4) {
    var hero = {
      Ipertrofia: { top: "bare", bot: c, shoe: "#fff", band: "#f0c040", trim: "#f0c040" },
      Forza: { top: "singlet", topC: "#23232b", bot: "#23232b", shoe: c, belt: true, trim: c },
      Dimagrimento: { top: "tank", topC: c, bot: "#16757d", shoe: "#fff", band: c, trim: "#fff" },
      Mantenimento: { top: "tee", topC: c, bot: "#2f7a49", shoe: "#fff", band: c },
      Ricomposizione: { top: "tank", topC: c, bot: "#4a2fa3", shoe: "#fff", band: "#f0c040", trim: "#f0c040" }
    };
    t = hero[O.name] || hero.Ipertrofia;
  }
  return t;
}
function torsoPath(g, off, swAdj) {
  var T0 = g.T0 - off * 0.3,
    T1 = g.T1 + off * 0.4,
    sw = g.sw + off + (swAdj || 0),
    bw = g.bw + off,
    ww = g.ww + off,
    L = (x) => n1(100 - x),
    R = (x) => n1(100 + x);
  return `M${L(sw)} ${n1(T0 + 6)} C${L(sw + 1)} ${n1(T0 + 34)} ${L(bw + 2)} ${n1(T1 - 46)} ${L(bw)} ${n1(T1 - 24)} C${L(bw - 1)} ${n1(T1 - 8)} ${L(ww - 6)} ${n1(T1)} ${L(ww - 12)} ${n1(T1)} L${R(ww - 12)} ${n1(T1)} C${R(ww - 6)} ${n1(T1)} ${R(bw - 1)} ${n1(T1 - 8)} ${R(bw)} ${n1(T1 - 24)} C${R(bw + 2)} ${n1(T1 - 46)} ${R(sw + 1)} ${n1(T0 + 34)} ${R(sw)} ${n1(T0 + 6)} Q100 ${n1(T0 - 6)} ${L(sw)} ${n1(T0 + 6)}Z`;
}
function topSVG(of, g) {
  if (of.top === "bare") return "";
  var adj = of.top === "tank" ? -6 : of.top === "singlet" ? -9 : 0,
    off = of.top === "loose" ? 9 : 3.5,
    o = pth(torsoPath(g, off, adj), of.topC);
  if (of.top === "loose")
    o += `<path d="M${n1(100 - g.ww)} ${n1(g.T1 - 8)} q${n1(g.ww)} 8 ${n1(g.ww * 2)} 0" fill="none" stroke="${SK}" stroke-opacity=".35" stroke-width="1.6"/>`;
  if (of.trim) o += `<path d="${torsoPath(g, off - 1.6, adj)}" fill="none" stroke="${of.trim}" stroke-width="2.4" stroke-opacity=".9"/>`;
  if (of.top === "tank" || of.top === "singlet")
    o += `<path d="M${n1(100 - 11)} ${n1(g.T0 - 2)} Q100 ${n1(g.T0 + 20)} ${n1(100 + 11)} ${n1(g.T0 - 2)}" fill="${g.skin}" stroke="${SK}" stroke-width="2"/>`;
  return o;
}
function bottomSVG(of, g, lx, lt) {
  var o = `<rect x="${n1(100 - g.ww - 3)}" y="${n1(g.T1 - 8)}" width="${n1(g.ww * 2 + 6)}" height="20" rx="5" fill="${of.bot}" stroke="${SK}" stroke-width="2.4"/>`;
  [-1, 1].forEach((d) => {
    o += `<rect x="${n1(100 + d * lx - (lt + 5) / 2)}" y="${n1(g.T1 - 2)}" width="${n1(lt + 5)}" height="22" rx="7" fill="${of.bot}" stroke="${SK}" stroke-width="2.4"/>`;
  });
  return o;
}

/* ---- parti della testa per specie ---- */
function tailSVG(kind, g, pal, gh) {
  var bc = gh ? "#7b8794" : pal.bc,
    y = g.T1 - 8,
    x = 100 + g.ww;
  var t = {
    lupo: pth(`M${x} ${y} C${x + 46} ${y + 8} ${x + 52} ${y - 40} ${x + 26} ${y - 52} C${x + 34} ${y - 30} ${x + 22} ${y - 14} ${x} ${y - 14}Z`, bc),
    cane: pth(
      `M${x} ${y - 4} C${x + 26} ${y - 8} ${x + 34} ${y - 30} ${x + 24} ${y - 52} C${x + 16} ${y - 34} ${x + 8} ${y - 22} ${x - 2} ${y - 16}Z`,
      bc
    ),
    gatto: pth(
      `M${x - 4} ${y} C${x + 40} ${y + 6} ${x + 56} ${y - 30} ${x + 36} ${y - 62} C${x + 28} ${y - 40} ${x + 22} ${y - 20} ${x - 2} ${y - 14}Z`,
      bc
    ),
    leone:
      `<path d="M${x} ${y} C${x + 40} ${y + 6} ${x + 46} ${y - 30} ${x + 30} ${y - 46}" fill="none" stroke="${SK}" stroke-width="9" stroke-linecap="round"/><path d="M${x} ${y} C${x + 40} ${y + 6} ${x + 46} ${y - 30} ${x + 30} ${y - 46}" fill="none" stroke="${bc}" stroke-width="5" stroke-linecap="round"/>` +
      (gh ? "" : cir(x + 30, y - 48, 9, pal.md)),
    toro: `<path d="M${x} ${y} Q${x + 26} ${y + 6} ${x + 22} ${y + 34}" fill="none" stroke="${SK}" stroke-width="7" stroke-linecap="round"/><path d="M${x} ${y} Q${x + 26} ${y + 6} ${x + 22} ${y + 34}" fill="none" stroke="${pal.bd || bc}" stroke-width="3.4" stroke-linecap="round"/>`,
    animale: cir(x + 4, y + 2, 9, bc)
  }[kind];
  if (!t) return "";
  /* la coda ondeggia (solo nelle versioni animate) */
  return t;
}
/* Ritorna { back, front, hair } per la specie; g = geometria della testa. */
function headParts(kind, g, pal, A) {
  var cx = 100,
    hy = g.hy,
    R = g.R,
    pr = A.pr,
    b = "",
    f = "",
    hairTop = "";
  if (kind === "umano" || kind === "donna") {
    var hc = pal.hair;
    f += ell(cx - R * 0.98, hy + 4, R * 0.15, R * 0.2, pal.bc) + ell(cx + R * 0.98, hy + 4, R * 0.15, R * 0.2, pal.bc);
    if (kind === "donna") {
      b += pth(
        `M${cx - R * 1.1} ${hy} C${cx - R * 1.3} ${hy + R * 1.5} ${cx - R * 0.5} ${hy + R * 1.7} ${cx} ${hy + R * 1.5} C${cx + R * 0.5} ${hy + R * 1.7} ${cx + R * 1.3} ${hy + R * 1.5} ${cx + R * 1.1} ${hy}Z`,
        hc
      );
      hairTop =
        pth(
          `M${cx - R * 1.04} ${hy + 2} C${cx - R * 1.12} ${hy - R * 1.3} ${cx + R * 1.12} ${hy - R * 1.3} ${cx + R * 1.04} ${hy + 2} C${cx + R * 0.9} ${hy - R * 0.5} ${cx + R * 0.2} ${hy - R * 0.55} ${cx - R * 0.25} ${hy - R * 0.2} C${cx - R * 0.5} ${hy - R * 0.5} ${cx - R * 0.8} ${hy - R * 0.4} ${cx - R * 1.04} ${hy + 2}Z`,
          hc
        ) + cir(cx + R * 0.82, hy - R * 0.62, R * 0.12, "#ff6fa5", 1.8);
    } else {
      hairTop = pth(
        `M${cx - R * 1.02} ${hy} C${cx - R * 1.1} ${hy - R * 1.25} ${cx + R * 1.1} ${hy - R * 1.25} ${cx + R * 1.02} ${hy} C${cx + R * 0.8} ${hy - R * 0.45} ${cx + R * 0.55} ${hy - R * 0.7} ${cx + R * 0.3} ${hy - R * 0.45} C${cx + R * 0.15} ${hy - R * 0.8} ${cx - R * 0.3} ${hy - R * 0.7} ${cx - R * 0.45} ${hy - R * 0.42} C${cx - R * 0.7} ${hy - R * 0.6} ${cx - R * 0.9} ${hy - R * 0.4} ${cx - R * 1.02} ${hy}Z`,
        hc
      );
    }
  } else if (kind === "animale") {
    b +=
      cir(cx - R * 0.78, hy - R * 0.8, R * 0.3, pal.bc) +
      cir(cx + R * 0.78, hy - R * 0.8, R * 0.3, pal.bc) +
      cir(cx - R * 0.78, hy - R * 0.8, R * 0.15, pal.bs, 0) +
      cir(cx + R * 0.78, hy - R * 0.8, R * 0.15, pal.bs, 0);
    f += ell(cx, hy + R * 0.36, R * 0.46, R * 0.35, pal.bs) + ell(cx, hy + R * 0.22, R * 0.14, R * 0.1, "#2b1b16", 1.6);
  } else if (kind === "lupo") {
    [-1, 1].forEach((d) => {
      b +=
        pth(`M${cx + d * R * 0.96} ${hy - R * 0.2} L${cx + d * R * 0.66} ${hy - R * 1.42} L${cx + d * R * 0.08} ${hy - R * 0.82}Z`, pal.bc) +
        `<path d="M${cx + d * R * 0.82} ${hy - R * 0.45} L${cx + d * R * 0.66} ${hy - R * 1.08} L${cx + d * R * 0.36} ${hy - R * 0.75}Z" fill="${pal.bs}"/>`;
      f += pth(`M${cx + d * R * 0.98} ${hy + R * 0.2} L${cx + d * R * 0.62} ${hy + R * 0.34} L${cx + d * R * 0.92} ${hy + R * 0.58}Z`, pal.bs, 1.8);
    });
    f += ell(cx, hy + R * 0.4, R * 0.44, R * 0.32, pal.bs) + ell(cx, hy + R * 0.26, R * 0.14, R * 0.1, "#1c1c24", 1.6);
  } else if (kind === "gorilla") {
    f += ell(cx - R * 1.0, hy + 4, R * 0.15, R * 0.2, pal.bc) + ell(cx + R * 1.0, hy + 4, R * 0.15, R * 0.2, pal.bc);
    b += pth(`M${cx - R * 0.9} ${hy - R * 0.6} Q${cx} ${hy - R * 1.55} ${cx + R * 0.9} ${hy - R * 0.6}Z`, pal.bc);
    f += pth(
      `M${cx - R * 0.74} ${hy - R * 0.1} C${cx - R * 0.8} ${hy + R * 0.8} ${cx + R * 0.8} ${hy + R * 0.8} ${cx + R * 0.74} ${hy - R * 0.1} C${cx + R * 0.4} ${hy - R * 0.42} ${cx - R * 0.4} ${hy - R * 0.42} ${cx - R * 0.74} ${hy - R * 0.1}Z`,
      pal.bs,
      1.8
    );
    f +=
      `<path d="M${cx - R * 0.66} ${hy - R * 0.28} Q${cx} ${hy - R * 0.55} ${cx + R * 0.66} ${hy - R * 0.28}" fill="none" stroke="${pal.bd}" stroke-width="${n1(R * 0.14)}" stroke-linecap="round"/>` +
      ell(cx - R * 0.1, hy + R * 0.32, R * 0.05, R * 0.04, "#262a33", 0) +
      ell(cx + R * 0.1, hy + R * 0.32, R * 0.05, R * 0.04, "#262a33", 0);
  } else if (kind === "leone") {
    var mr = R * (1.12 + 0.2 * pr),
      nm = 10;
    for (var q = 0; q < nm; q++) {
      var an = (q / nm) * 6.2832;
      b += cir(cx + Math.cos(an) * mr * 0.9, hy + Math.sin(an) * mr * 0.9, R * (0.4 + 0.08 * pr), pal.md);
    }
    b += cir(cx, hy, mr, pal.md, 0) + cir(cx - R * 0.72, hy - R * 0.92, R * 0.24, pal.bc) + cir(cx + R * 0.72, hy - R * 0.92, R * 0.24, pal.bc);
    f +=
      ell(cx, hy + R * 0.38, R * 0.42, R * 0.32, pal.bs) +
      pth(`M${cx - R * 0.13} ${hy + R * 0.14} h${R * 0.26} l${-R * 0.13} ${R * 0.15}z`, "#d97a82", 1.6);
  } else if (kind === "toro") {
    [-1, 1].forEach((d) => {
      b +=
        pth(
          `M${cx + d * R * 0.46} ${hy - R * 0.8} Q${cx + d * R * 1.5} ${hy - R * 0.72} ${cx + d * R * 1.32} ${hy - R * 1.8} Q${cx + d * R * 1.08} ${hy - R * 1.02} ${cx + d * R * 0.3} ${hy - R * 0.5}Z`,
          "#f1e7d2"
        ) + ell(cx + d * R * 1.06, hy - R * 0.25, R * 0.4, R * 0.2, pal.bc);
    });
    f +=
      ell(cx, hy + R * 0.42, R * 0.56, R * 0.38, pal.bs) +
      ell(cx - R * 0.2, hy + R * 0.42, R * 0.07, R * 0.05, "#3a281d", 0) +
      ell(cx + R * 0.2, hy + R * 0.42, R * 0.07, R * 0.05, "#3a281d", 0) +
      `<path d="M${cx - R * 0.12} ${hy + R * 0.7} a${R * 0.12} ${R * 0.12} 0 1 0 ${R * 0.24} 0" fill="none" stroke="#f0c040" stroke-width="2.4"/>`;
  } else if (kind === "gatto") {
    [-1, 1].forEach((d) => {
      b +=
        pth(`M${cx + d * R * 0.92} ${hy - R * 0.32} L${cx + d * R * 0.78} ${hy - R * 1.42} L${cx + d * R * 0.12} ${hy - R * 0.86}Z`, pal.bc) +
        `<path d="M${cx + d * R * 0.78} ${hy - R * 0.55} L${cx + d * R * 0.72} ${hy - R * 1.1} L${cx + d * R * 0.34} ${hy - R * 0.82}Z" fill="#f6a9b4"/>`;
    });
    f +=
      ell(cx, hy + R * 0.4, R * 0.4, R * 0.28, pal.bs, 0) +
      pth(`M${cx - R * 0.09} ${hy + R * 0.2} h${R * 0.18} l${-R * 0.09} ${R * 0.1}z`, "#f27d95", 1.4);
    [-1, 1].forEach((d) => {
      [-0.1, 0.12].forEach((o) => {
        f += `<line x1="${n1(cx + d * R * 0.52)}" y1="${n1(hy + R * (0.34 + o))}" x2="${n1(cx + d * R * 1.12)}" y2="${n1(hy + R * (0.28 + o * 2))}" stroke="${SK}" stroke-width="1.4" stroke-linecap="round"/>`;
      });
    });
    f += `<path d="M${cx - R * 0.14} ${hy - R * 0.82} v${R * 0.22} M${cx} ${hy - R * 0.88} v${R * 0.28} M${cx + R * 0.14} ${hy - R * 0.82} v${R * 0.22}" stroke="${pal.bd}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (kind === "cane") {
    [-1, 1].forEach((d) => {
      b += `<g transform="rotate(${d * 14} ${n1(cx + d * R * 0.9)} ${n1(hy - R * 0.4)})">${ell(cx + d * R * 0.95, hy + R * 0.15, R * 0.3, R * 0.58, "#9a6232")}</g>`;
    });
    f += ell(cx, hy + R * 0.42, R * 0.5, R * 0.36, pal.bs) + ell(cx, hy + R * 0.26, R * 0.17, R * 0.11, "#2b1b16", 1.6);
    if (A.pr > 0.55) f += ell(cx + R * 0.02, hy + R * 0.92, R * 0.14, R * 0.2, "#ff7d8e", 1.6);
    f += `<circle cx="${n1(cx - R * 0.4)}" cy="${n1(hy - R * 0.03)}" r="${n1(R * 0.3)}" fill="${pal.bd}" opacity=".55"/>`;
  } else if (kind === "alieno") {
    [-1, 1].forEach((d) => {
      b +=
        `<line x1="${n1(cx + d * R * 0.34)}" y1="${n1(hy - R * 1.02)}" x2="${n1(cx + d * R * 0.62)}" y2="${n1(hy - R * 1.62)}" stroke="${SK}" stroke-width="5.4" stroke-linecap="round"/><line x1="${n1(cx + d * R * 0.34)}" y1="${n1(hy - R * 1.02)}" x2="${n1(cx + d * R * 0.62)}" y2="${n1(hy - R * 1.62)}" stroke="${pal.bd}" stroke-width="2.4" stroke-linecap="round"/>` +
        cir(cx + d * R * 0.64, hy - R * 1.68, R * 0.15, "#ff7bd5", 2);
    });
  }
  return { back: b, front: f, hair: hairTop };
}

/* ---- occhi, sopracciglia, bocca: l'espressione dipende da forma e fatica ---- */
function faceSVG(kind, A, g) {
  var cx = 100,
    hy = g.hy,
    R = g.R,
    o = "",
    alien = kind === "alieno",
    ex = R * (alien ? 0.42 : 0.4),
    ey = hy - R * 0.02,
    er = R * (alien ? 0.3 : 0.2),
    tired = A.pr < 0.12 && !A.aura,
    happy = A.pr > 0.55 && !A.sad;
  [-1, 1].forEach((d) => {
    var x = cx + d * ex;
    if (alien) {
      o += `<ellipse cx="${n1(x)}" cy="${n1(ey + R * 0.04)}" rx="${n1(er * 0.78)}" ry="${n1(er * 1.3)}" fill="#1b1030" stroke="${SK}" stroke-width="2" transform="rotate(${d * -22} ${n1(x)} ${n1(ey)})"/><circle cx="${n1(x + er * 0.2)}" cy="${n1(ey - er * 0.45)}" r="${n1(er * 0.28)}" fill="#fff"/>`;
    } else {
      o +=
        ell(x, ey, er * 0.95, er * 1.18, "#fff", 2) +
        `<circle cx="${n1(x + d * -er * 0.05)}" cy="${n1(ey + er * 0.12)}" r="${n1(er * 0.7)}" fill="#1c1424"/><circle cx="${n1(x + er * 0.24)}" cy="${n1(ey - er * 0.3)}" r="${n1(er * 0.27)}" fill="#fff"/><circle cx="${n1(x - er * 0.22)}" cy="${n1(ey + er * 0.42)}" r="${n1(er * 0.12)}" fill="#fff"/>`;
      if (tired)
        o += pth(`M${n1(x - er * 1.0)} ${n1(ey - er * 0.2)} Q${n1(x)} ${n1(ey - er * 1.5)} ${n1(x + er * 1.0)} ${n1(ey - er * 0.2)}Z`, g.skin, 2);
    }
    if (kind !== "gorilla" && !alien) o += ell(cx + d * R * 0.66, hy + R * 0.32, R * 0.15, R * 0.09, "#ff7f9a", 0).replace("/>", ' opacity=".4"/>');
    /* sopracciglia: aggrottate se determinato, all'insù se triste */
    if (!alien && (A.sad || A.pr > 0.5)) {
      var yo = ey - er * (A.sad ? 1.3 : 1.95),
        yi = ey - er * (A.sad ? 1.95 : 1.3);
      o += `<path d="M${n1(x + d * er * 1.05)} ${n1(yo)} L${n1(x - d * er * 1.05)} ${n1(yi)}" stroke="${SK}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
    }
  });
  var my = hy + R * (kind === "gorilla" || kind === "cane" || kind === "toro" ? 0.72 : 0.6),
    mw = R * 0.2;
  if (A.sad)
    o += `<path d="M${n1(cx - mw)} ${n1(my + 3)} Q${cx} ${n1(my - 4)} ${n1(cx + mw)} ${n1(my + 3)}" stroke="${SK}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${n1(cx + ex + er * 0.5)} ${n1(ey + er * 1.4)} q3 6 0 9 q-3 -3 0 -9z" fill="#7ec8ff" stroke="${SK}" stroke-width="1.2"/>`;
  else if (happy && A.pr > 0.8)
    o += `<path d="M${n1(cx - mw * 1.5)} ${n1(my - 2)} Q${cx} ${n1(my + R * 0.5)} ${n1(cx + mw * 1.5)} ${n1(my - 2)}Z" fill="#8a2a38" stroke="${SK}" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="100" cy="${n1(my + R * 0.2)}" rx="${n1(mw * 0.7)}" ry="${n1(R * 0.09)}" fill="#ff8da1"/>`;
  else if (kind === "gatto")
    o += `<path d="M${n1(cx - mw * 0.9)} ${n1(my)} Q${n1(cx - mw * 0.45)} ${n1(my + 6)} ${cx} ${n1(my)} Q${n1(cx + mw * 0.45)} ${n1(my + 6)} ${n1(cx + mw * 0.9)} ${n1(my)}" stroke="${SK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  else
    o += `<path d="M${n1(cx - mw)} ${n1(my)} Q${cx} ${n1(my + (happy ? 8 : 4))} ${n1(cx + mw)} ${n1(my)}" stroke="${SK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if (tired && !A.sad)
    o += `<path d="M${n1(cx + R * 1.05)} ${n1(hy - R * 0.5)} q4 7 0 11 q-4 -4 0 -11z" fill="#9fd8ff" stroke="${SK}" stroke-width="1.2"/>`;
  return o;
}

/* ---- scheletro: tutte le specie ---- */
function rig(kind, A, O, gh) {
  var sp = SPEC[kind] || SPEC.umano,
    pal = PAL[kind] || PAL.umano,
    fem = kind === "donna",
    alien = kind === "alieno",
    F = A.F,
    M = A.Mu,
    T = A.T,
    k = A.k,
    pr = A.pr,
    f = clamp((pr - 0.72) / 0.28, 0, 1),
    GH = "#7b8794",
    bc = gh ? GH : pal.bc,
    bs = gh ? GH : pal.bs,
    of = outfitFor(O, A.stage),
    o = "";
  if (fem && of.top === "bare") of = Object.assign({}, of, { top: "tank", topC: of.trim || "#e5473b" });
  var R = (33 + F * 3) * sp.hs,
    hy = 84 + A.sl * 0.6,
    T0 = hy + R * 0.82,
    T1 = 188;
  var sw = (lerp(20, 41, M) + F * 5 - T * 2.5) * sp.bw * (fem ? 0.86 : 1),
    ww = (lerp(18, 21, M) + F * 19 - T * 3) * sp.bw * (fem ? 0.92 : 1),
    bw = ww + F * 15 + 3,
    at = (lerp(7.5, 17, M) + F * 3 - T * 2) * k * sp.aw,
    lt = (lerp(13, 25, M) + F * 7 - T * 2.5) * k * sp.lw,
    lx = ww * 0.5 + 6;
  var g = { T0: T0, T1: T1, sw: sw, bw: bw, ww: ww, hy: hy, R: R, skin: bc };
  /* coda dietro al corpo */
  if (!gh) {
    var tl = tailSVG(kind, g, pal, gh),
      tx = 100 + ww,
      ty = T1 - 8,
      sw2 = kind === "cane" ? 0.5 : 1.6;
    o += A.anim && tl ? `<g>${smT("rotate", [`-9 ${n1(tx)} ${n1(ty)}`, `9 ${n1(tx)} ${n1(ty)}`, `-9 ${n1(tx)} ${n1(ty)}`], sw2)}${tl}</g>` : tl;
  }
  /* gambe e scarpe */
  [-1, 1].forEach((d) => {
    o += limb(100 + d * lx, T1 - 6, 100 + d * (lx + 1), 232, lt, bc);
    o += `<ellipse cx="${n1(100 + d * (lx + 4))}" cy="241" rx="${n1(lt * 0.7 + 5)}" ry="8" fill="${gh ? GH : of.shoe}" stroke="${SK}" stroke-width="2.4"/>`;
  });
  var hp = headParts(kind, g, pal, A);
  if (!gh && fem) o += hp.back; // capelli lunghi dietro al corpo
  /* busto, pancia, muscoli */
  o += pth(torsoPath(g, 0), bc);
  if (!gh && !alien && kind !== "umano" && kind !== "donna")
    o += `<ellipse cx="100" cy="${n1(T1 - 34)}" rx="${n1(ww * 0.72 + F * 7)}" ry="${n1(22 + F * 6)}" fill="${bs}"/>`;
  if (!gh && of.top === "bare" && M > 0.3) {
    var ab = clamp((M - 0.3) * 1.4, 0, 1);
    o += `<path d="M${n1(100 - sw * 0.7)} ${n1(T0 + 22)} Q${n1(100 - sw * 0.35)} ${n1(T0 + 38)} 98 ${n1(T0 + 30)} M${n1(100 + sw * 0.7)} ${n1(T0 + 22)} Q${n1(100 + sw * 0.35)} ${n1(T0 + 38)} 102 ${n1(T0 + 30)} M100 ${n1(T0 + 20)} V${n1(T0 + 32)}" stroke="#000" stroke-opacity=".28" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (F < 0.5)
      for (var i = 0; i < 3; i++)
        o += `<rect x="92" y="${n1(T0 + 40 + i * 13)}" width="7" height="10" rx="3" fill="#000" opacity="${n1(0.16 * ab)}"/><rect x="101" y="${n1(T0 + 40 + i * 13)}" width="7" height="10" rx="3" fill="#000" opacity="${n1(0.16 * ab)}"/>`;
  }
  if (!gh) o += topSVG(of, g) + bottomSVG(of, g, lx, lt);
  else o += bottomSVG({ bot: GH }, g, lx, lt);
  /* braccia */
  var hands = {},
    hr = 7.5 + M * 3.5;
  [-1, 1].forEach((d) => {
    var sx = 100 + d * (sw + 1 - M * 5), // spalle più larghe del busto se esile
      sy = T0 + 14,
      pz = {
        D: { ex: sx + d * (8 + F * 5), ey: sy + 24, hx: sx + d * (10 + F * 6), hy: sy + 48 },
        X: { ex: 100 + d * (sw + 22), ey: sy - 4, hx: 100 + d * (sw + 14), hy: sy - 34 },
        U: { ex: sx + d * 4, ey: sy + 22, hx: sx - d * 3, hy: sy },
        M: { ex: sx + d * 14, ey: sy + 22, hx: 100 + d * 7, hy: hy + R * 0.5 }
      };
    hands[d] = { x: lerp(pz.D.hx, pz.X.hx, f), y: lerp(pz.D.hy, pz.X.hy, f) };
    if (M > 0.28 || of.top === "tank" || of.top === "bare" || of.top === "singlet")
      o += `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="${n1(at * 0.95)}" fill="${bc}"/>`;
    o += armSVG(A, d, sx, sy, pz, f, {
      w: at,
      hr: hr,
      fill: gh ? GH : bc,
      bic: M > 0.35 ? { dx: d * at * 0.2, rx: at * 0.72, ry: at * 1.05 } : null,
      band: gh ? "" : of.band
    });
  });
  if (!gh && !A.anim) o += propsSVG(O, A, { xl: hands[-1].x, xr: hands[1].x, hy: hands[1].y, wy: T1 - 6, ww: ww, cy: T0 + 40 });
  /* testa */
  if (!gh && !fem) o += hp.back;
  if (F > 0.7) o += ell(100, hy + R * 0.9, R * 0.66, R * 0.3, bc, 2.4);
  var rx = R * (1 + F * 0.06) * (alien ? 0.95 : 1),
    ry = R * (alien ? 1.15 : 1);
  o += `<ellipse cx="100" cy="${n1(hy)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="${bc}" stroke="${SK}" stroke-width="2.6"/>`;
  g.hy = hy;
  if (!gh) o += hp.front + faceSVG(kind, A, g) + hp.hair;
  return { o: o, G: { hx: 100, hy: hy, hr: R, wy: T1 - 6, ww: ww + 6, sy: T0 + 8, sw: sw, by: 236 } };
}

function avatarSVG(kind, st, ctx) {
  ctx = ctx || S.profile;
  st = st || {};
  var O = OBJP[ctx.obiettivo] || OBJP.Ipertrofia,
    A = avState(O, ctx, st),
    aura = st.aura || 0;
  A.aura = aura;
  A.anim = st.anim && !reducedMotion() ? st.anim : "";
  var fig = rig(kind, A, O, false),
    G = fig.G,
    ghost = "";
  if (O.ghost && A.pr > 0.25) {
    var A0 = avState(O, ctx, { p: 0, fat: 0 });
    A0.aura = 0;
    ghost = `<g opacity=".16" transform="translate(100 250) scale(${A0.sc.toFixed(3)}) translate(-100 -250)">${rig(kind, A0, O, true).o}</g>`;
  }
  var cape = "",
    acc = "";
  if (aura >= 5)
    cape = pth(
      `M${n1(100 - G.sw + 2)} ${n1(G.sy + 2)} L${n1(100 + G.sw - 2)} ${n1(G.sy + 2)} L${n1(100 + G.sw + 24)} 238 Q100 252 ${n1(100 - G.sw - 24)} 238Z`,
      "#c93a32"
    );
  if (aura >= 1)
    acc += `<path d="M${n1(G.hx - G.hr * 0.98)} ${n1(G.hy - G.hr * 0.3)} Q100 ${n1(G.hy - G.hr * 0.8)} ${n1(G.hx + G.hr * 0.98)} ${n1(G.hy - G.hr * 0.3)}" fill="none" stroke="${SK}" stroke-width="10" stroke-linecap="round"/><path d="M${n1(G.hx - G.hr * 0.98)} ${n1(G.hy - G.hr * 0.3)} Q100 ${n1(G.hy - G.hr * 0.8)} ${n1(G.hx + G.hr * 0.98)} ${n1(G.hy - G.hr * 0.3)}" fill="none" stroke="#f0c040" stroke-width="6" stroke-linecap="round"/>`;
  if (aura >= 3)
    acc += `<rect x="${n1(100 - G.ww - 2)}" y="${n1(G.wy - 14)}" width="${n1(G.ww * 2 + 4)}" height="9" rx="3" fill="#f0c040" stroke="${SK}" stroke-width="2.2"/><rect x="95" y="${n1(G.wy - 16)}" width="10" height="13" rx="2" fill="#fff3c2" stroke="${SK}" stroke-width="2"/>`;
  if (aura >= 7)
    acc += pth(
      `M${n1(G.hx - G.hr * 0.7)} ${n1(G.hy - G.hr * 0.95)} L${n1(G.hx - G.hr * 0.8)} ${n1(G.hy - G.hr * 1.75)} L${n1(G.hx - G.hr * 0.3)} ${n1(G.hy - G.hr * 1.3)} L${G.hx} ${n1(G.hy - G.hr * 1.9)} L${n1(G.hx + G.hr * 0.3)} ${n1(G.hy - G.hr * 1.3)} L${n1(G.hx + G.hr * 0.8)} ${n1(G.hy - G.hr * 1.75)} L${n1(G.hx + G.hr * 0.7)} ${n1(G.hy - G.hr * 0.95)}Z`,
      "#f0c040"
    );
  var body = A.anim ? `<g>${smT("translate", ["0 0", "0 -1.6", "0 0"], 2.4)}${fig.o}</g>` : fig.o;
  var heart =
    A.anim === "diet"
      ? `<g transform="translate(${(G.hx + G.hr * 1.3).toFixed(1)} ${(G.hy - G.hr * 1.3).toFixed(1)})" opacity="0">${sm("opacity", A_HRT, 18)}<path d="M0 4 C-9 -3 -5 -10 0 -5 C5 -10 9 -3 0 4z" fill="#34b36b" stroke="${SK}" stroke-width="1.2"/></g>`
      : "";
  return `<svg viewBox="-30 0 260 260" role="img" aria-label="Avatar"><ellipse cx="100" cy="252" rx="${n1(52 + (aura ? 14 : 0))}" ry="6" fill="#000" opacity=".14"/>${auraSVG(aura, !!A.anim)}${ghost}<g transform="translate(100 250) scale(${A.sc.toFixed(3)}) translate(-100 -250)">${cape}${body}${acc}${heart}</g></svg>`;
}

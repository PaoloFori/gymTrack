/* Disegno SVG degli avatar: aura, palette, corpo (uomo/donna e animali), accessori. */
var svgN = 0;
function auraSVG(a) {
  if (!a) return "";
  svgN++;
  var id = "ag" + svgN,
    k = Math.min(a, 10),
    rx = Math.min(58 + k * 7, 124),
    ry = Math.min(84 + k * 8, 126),
    cx = 100,
    cy = 140;
  var o =
    '<defs><radialGradient id="' +
    id +
    '" cx="50%" cy="50%" r="50%"><stop offset="0.3" class="a-stop" stop-opacity="' +
    Math.min(0.8, 0.25 + 0.07 * k).toFixed(2) +
    '"/><stop offset="1" class="a-stop" stop-opacity="0"/></radialGradient></defs>';
  o += '<ellipse class="a-glow" cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="url(#' + id + ')"/>';
  for (var i = 0; i < Math.min(3, Math.ceil(k / 2)); i++)
    o +=
      '<ellipse class="a-ring" cx="' +
      cx +
      '" cy="' +
      cy +
      '" rx="' +
      (rx * (0.6 + 0.14 * i)).toFixed(1) +
      '" ry="' +
      (ry * (0.6 + 0.14 * i)).toFixed(1) +
      '" stroke-opacity="' +
      (0.6 - 0.14 * i).toFixed(2) +
      '"/>';
  for (var q = 0, n = Math.min(k * 2, 16); q < n; q++) {
    var ang = q * 2.399963,
      rr = 0.5 + (0.42 * ((q * 37) % 10)) / 10;
    o +=
      '<circle class="a-spark" cx="' +
      (cx + Math.cos(ang) * rx * rr).toFixed(1) +
      '" cy="' +
      (cy + Math.sin(ang) * ry * rr).toFixed(1) +
      '" r="' +
      (1.2 + ((q * 13) % 5) * 0.5).toFixed(1) +
      '"/>';
  }
  return o;
}
var PAL = {
  umano: { bc: "#e3aa7e", bs: "#f4d3b6", hc: "#33261b" },
  donna: { bc: "#f0c3a0", bs: "#fbe3d0", hc: "#6a3b1e" },
  animale: { bc: "#8b5a3c", bs: "#e0bf9a", bd: "#4a2f1d" },
  lupo: { bc: "#7f8997", bs: "#e3e8ee", bd: "#3b424c" },
  gorilla: { bc: "#3f4552", bs: "#939aa8", bd: "#20242c" },
  leone: { bc: "#d8a243", bs: "#f3dca4", bd: "#8a5a17", md: "#9b5a1a" },
  toro: { bc: "#6d4b3b", bs: "#dcc8ad", bd: "#32221a" }
};
/* Stato del corpo: grasso F, muscolo Mu, magrezza T, tutti interpolati tra «completamente fuori obiettivo» (p=0) e «obiettivo perfetto» (p=1). */
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
    sc: lerp(0.86, 1, pr) * clamp(0.94 + ((h - 165) / 30) * 0.08, 0.9, 1.06)
  };
}
function n1(v) {
  return (+v).toFixed(1);
}
function dumbbell(x, y, k) {
  return `<line x1="${n1(x - 9)}" y1="${n1(y)}" x2="${n1(x + 9)}" y2="${n1(y)}" stroke="#5a6472" stroke-width="3" stroke-linecap="round"/><rect class="a-metal" x="${n1(x - 13)}" y="${n1(y - 8)}" width="6" height="16" rx="2"/><rect class="a-metal" x="${n1(x + 7)}" y="${n1(y - 8)}" width="6" height="16" rx="2"/>`;
}
function propsSVG(O, A, H) {
  var o = "",
    f = clamp((A.pr - 0.72) / 0.28, 0, 1);
  if (O.prop === "db" && f > 0.3) o += dumbbell(H.xl, H.hy, 1) + dumbbell(H.xr, H.hy, 1);
  if (O.prop === "bar" && f > 0.3) {
    var xl = H.xl,
      xr = H.xr,
      y = H.hy - 4;
    o += `<line x1="${n1(xl - 44)}" y1="${n1(y)}" x2="${n1(xr + 44)}" y2="${n1(y)}" stroke="#5a6472" stroke-width="4" stroke-linecap="round"/>`;
    [-1, 1].forEach(function (d) {
      var bx = d < 0 ? xl - 36 : xr + 36;
      o += `<rect class="a-metal" x="${n1(bx - 5)}" y="${n1(y - 19)}" width="10" height="38" rx="3"/><rect class="a-metal" x="${n1(bx + d * 11 - 4)}" y="${n1(y - 13)}" width="8" height="26" rx="2"/>`;
    });
  }
  if (O.prop === "tape" && A.pr > 0.45) {
    var tw = H.ww + 3;
    o += `<rect class="a-tape" x="${n1(100 - tw)}" y="${n1(H.wy - 9)}" width="${n1(tw * 2)}" height="8" rx="2"/>`;
    for (var i = -3; i <= 3; i++)
      o += `<line x1="${n1(100 + (i * tw) / 3.4)}" y1="${n1(H.wy - 9)}" x2="${n1(100 + (i * tw) / 3.4)}" y2="${n1(H.wy - 5)}" stroke="#7a6200" stroke-width="1"/>`;
    o += `<path class="a-tape" d="M${n1(100 + tw - 6)} ${n1(H.wy - 1)} q4 12 0 22 l6 0 q4 -10 0 -22z"/>`;
  }
  if (O.prop === "medal" && A.pr > 0.65) {
    var cy = H.cy;
    o += `<path d="M${n1(100 - 9)} ${n1(cy - 22)} L100 ${n1(cy - 2)} L${n1(100 + 9)} ${n1(cy - 22)}" fill="none" stroke="#c2362b" stroke-width="5" stroke-linejoin="round"/><circle cx="100" cy="${n1(cy + 3)}" r="8" fill="#e0b13a" stroke="#9a7416" stroke-width="1.5"/><path d="M100 ${n1(cy - 2)} l2 4 4 .5 -3 3 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -3 4 -.5z" fill="#fff3c2"/>`;
  }
  return o;
}
function faceSVG(A, x, y, r, dx, eyeY, gh) {
  if (gh) return "";
  var o = "",
    ey = y + eyeY,
    br = A.sad ? 1 : A.pr > 0.5 ? -1 : 0;
  o += `<circle class="a-eye" cx="${n1(x - dx)}" cy="${n1(ey)}" r="1.8"/><circle class="a-eye" cx="${n1(x + dx)}" cy="${n1(ey)}" r="1.8"/>`;
  if (br === 0)
    o += `<path class="a-brow" d="M${n1(x - dx - 3)} ${n1(ey - 5)} H${n1(x - dx + 3)} M${n1(x + dx - 3)} ${n1(ey - 5)} H${n1(x + dx + 3)}"/>`;
  else
    o += `<path class="a-brow" d="M${n1(x - dx - 3)} ${n1(ey - 5 - br * 2.2)} L${n1(x - dx + 3)} ${n1(ey - 5 + br * 2.2)} M${n1(x + dx + 3)} ${n1(ey - 5 - br * 2.2)} L${n1(x + dx - 3)} ${n1(ey - 5 + br * 2.2)}"/>`;
  var my = ey + r * 0.5,
    sm = A.sad ? -3.5 : clamp((A.pr - 0.25) * 7, 0, 5);
  o += `<path class="a-mouth" d="M${n1(x - 5)} ${n1(my)} Q${n1(x)} ${n1(my + sm + (A.sad ? 0 : 1))} ${n1(x + 5)} ${n1(my)}"/>`;
  if (A.sad || (A.pr < 0.12 && !A.aura)) o += `<path class="a-sweat" d="M${n1(x + r + 3)} ${n1(y - 8)} q3 5 0 8 q-3 -3 0 -8z"/>`;
  return o;
}
function drawHuman(kind, A, O, gh) {
  var fem = kind === "donna",
    F = A.F,
    M = A.Mu,
    T = A.T,
    k = A.k,
    pr = A.pr,
    f = clamp((pr - 0.72) / 0.28, 0, 1),
    o = "",
    det = "";
  var sw = (lerp(24, 50, M) * (1 - 0.15 * T) + F * 4) * (fem ? 0.8 : 1),
    ww = (lerp(19, 23, M) + F * 17 - T * 3) * (fem ? 0.92 : 1),
    hip = ww + (fem ? 8 : 2) + F * 3;
  var at = (lerp(5, 14, M) + F * 4.5 - T * 1.5) * k * (fem ? 0.85 : 1),
    lt = (lerp(9, 17, M) + F * 8 - T * 2) * k * (fem ? 0.88 : 1);
  var sY = 70 + A.sl * 0.5,
    hY = 44 + A.sl,
    lx = hip * 0.5 + 3,
    hr = 15 + F * 1.5,
    cxs = Math.max(sw * 0.95, ww * 1.05 + F * 6);
  o += `<g class="a-bodys" stroke-width="${n1(lt)}"><line x1="${n1(100 - lx)}" y1="170" x2="${n1(100 - lx - 3)}" y2="244"/><line x1="${n1(100 + lx)}" y1="170" x2="${n1(100 + lx + 3)}" y2="244"/></g>`;
  if (!gh && M > 0.5) det += `<path class="a-shl" d="M${n1(100 - lx - 3)} 190 q4 8 1 20 M${n1(100 + lx + 3)} 190 q-4 8 -1 20"/>`;
  o += `<ellipse class="a-shoe" cx="${n1(100 - lx - 5)}" cy="247" rx="${n1(lt * 0.9 + 3)}" ry="6"/><ellipse class="a-shoe" cx="${n1(100 + lx + 5)}" cy="247" rx="${n1(lt * 0.9 + 3)}" ry="6"/>`;
  if (fem)
    o += `<path class="a-hair" d="M${n1(100 - hr * 1.1)} ${n1(hY)} Q${n1(100 - hr * 1.4)} ${n1(hY + hr * 2.4)} ${n1(100 - hr * 0.5)} ${n1(hY + hr * 2.6)} L${n1(100 + hr * 0.5)} ${n1(hY + hr * 2.6)} Q${n1(100 + hr * 1.4)} ${n1(hY + hr * 2.4)} ${n1(100 + hr * 1.1)} ${n1(hY)}Z"/>`;
  o += `<rect class="a-body" x="${n1(100 - 6 - M * 3 * k)}" y="${n1(hY + 8)}" width="${n1(12 + M * 6 * k)}" height="${n1(sY - hY)}"/>`;
  o += `<path class="a-body" d="M${n1(100 - sw)} ${n1(sY)} Q${n1(100 - cxs)} ${n1(sY + 34)} ${n1(100 - ww)} 140 L${n1(100 + ww)} 140 Q${n1(100 + cxs)} ${n1(sY + 34)} ${n1(100 + sw)} ${n1(sY)} Q100 ${n1(sY - 8)} ${n1(100 - sw)} ${n1(sY)}Z"/>`;
  if (!gh && M > 0.3 && !fem)
    det += `<path class="a-line" d="M${n1(100 - sw * 0.7)} ${n1(sY + 14)} Q${n1(100 - sw * 0.35)} ${n1(sY + 29)} 99 ${n1(sY + 21)} M${n1(100 + sw * 0.7)} ${n1(sY + 14)} Q${n1(100 + sw * 0.35)} ${n1(sY + 29)} 101 ${n1(sY + 21)} M100 ${n1(sY + 12)} V${n1(sY + 24)}"/>`;
  if (!gh && M > 0.38 && F < 0.45) {
    var ab = clamp((M - 0.3) * 1.4, 0, 1);
    for (var i = 0; i < 3; i++)
      det += `<rect class="a-shade" style="opacity:${n1(0.14 * ab)}" x="${n1(100 - 9)}" y="${n1(sY + 36 + i * 12)}" width="8" height="9" rx="3"/><rect class="a-shade" style="opacity:${n1(0.14 * ab)}" x="101" y="${n1(sY + 36 + i * 12)}" width="8" height="9" rx="3"/>`;
  }
  o += det;
  o += `<rect class="${fem ? "a-cloth" : "a-dark"}" x="${n1(100 - hip - 2)}" y="139" width="${n1(2 * hip + 4)}" height="${n1(fem ? 36 : 34)}" rx="6"/>`;
  if (F > 0.12) {
    o += `<ellipse class="a-body" cx="100" cy="${n1(130 + F * 2)}" rx="${n1(ww + F * 11)}" ry="${n1(13 + F * 8)}"/>`;
    if (!gh && F > 0.4)
      o += `<path class="a-shl" d="M${n1(100 - ww - F * 9)} ${n1(134 + F * 4)} Q100 ${n1(142 + F * 14)} ${n1(100 + ww + F * 9)} ${n1(134 + F * 4)}"/><circle cx="100" cy="${n1(128 + F * 3)}" r="1.5" fill="#000" opacity=".25"/>`;
  }
  if (!gh && fem)
    o += `<path class="a-cloth" d="M${n1(100 - sw * 0.62)} ${n1(sY + 12)} Q100 ${n1(sY + 4)} ${n1(100 + sw * 0.62)} ${n1(sY + 12)} L${n1(100 + sw * 0.55)} ${n1(sY + 34)} Q100 ${n1(sY + 40)} ${n1(100 - sw * 0.55)} ${n1(sY + 34)}Z"/>`;
  var hands = {};
  [-1, 1].forEach(function (d) {
    var sx = 100 + d * (sw - 2),
      sy = sY + 4,
      ex = lerp(sx + d * (6 + F * 6), 100 + d * (sw + 22), f),
      ey = lerp(sY + 40, sY + 18, f),
      hx = lerp(sx + d * (8 + F * 7), 100 + d * (sw + 14), f),
      hy = lerp(sY + 78, sY - 22, f);
    hands[d] = { x: hx, y: hy };
    if (A.anim) {
      var pz = {
        D: { ex: sx + d * (6 + F * 6), ey: sY + 40, hx: sx + d * (8 + F * 7), hy: sY + 78 },
        U: { ex: sx + d * (4 + F * 5), ey: sY + 36, hx: sx - d * 2, hy: sY + 8 },
        M: { ex: sx + d * 12, ey: sY + 30, hx: 100 + d * 5, hy: hY + 9 }
      };
      var k2 = animArm(A, d, sx, sy, pz, at, at * 0.62 + 1.5, M > 0.35 ? { dx: d * at * 0.2, rx: at * 0.72, ry: at * 1.05 } : null);
      if (M > 0.25) o += `<circle class="a-body" cx="${n1(sx)}" cy="${n1(sy)}" r="${n1(at * 0.95)}"/>`;
      o += k2.poly + k2.bic + k2.hand + k2.tool + k2.apple;
      return;
    }
    o += `<polyline class="a-bodys" stroke-width="${n1(at)}" points="${n1(sx)},${n1(sy)} ${n1(ex)},${n1(ey)} ${n1(hx)},${n1(hy)}"/>`;
    if (M > 0.25) o += `<circle class="a-body" cx="${n1(sx)}" cy="${n1(sy)}" r="${n1(at * 0.95)}"/>`;
    if (M > 0.35)
      o += `<ellipse class="a-body" cx="${n1((sx + ex) / 2 + d * at * 0.2)}" cy="${n1((sy + ey) / 2)}" rx="${n1(at * 0.72)}" ry="${n1(at * 1.05)}"/>`;
    o += `<circle class="a-body" cx="${n1(hx)}" cy="${n1(hy)}" r="${n1(at * 0.62 + 1.5)}"/>`;
  });
  if (!A.anim) o += propsSVG(O, A, { xl: hands[-1].x, xr: hands[1].x, hy: hands[1].y, wy: 140, ww: ww, cy: sY + 34 });
  o += `<circle class="a-body" cx="${n1(100 - hr)}" cy="${n1(hY + 1)}" r="3"/><circle class="a-body" cx="${n1(100 + hr)}" cy="${n1(hY + 1)}" r="3"/><circle class="a-body" cx="100" cy="${n1(hY)}" r="${n1(hr)}"/>`;
  if (F > 0.7) o += `<ellipse class="a-body" cx="100" cy="${n1(hY + hr * 0.85)}" rx="${n1(hr * 0.8)}" ry="${n1(hr * 0.35)}"/>`;
  if (!gh) {
    var hy0 = hY - hr * 0.2;
    o += fem
      ? `<path class="a-hair" d="M${n1(100 - hr - 1)} ${n1(hY + 2)} A${n1(hr + 1)} ${n1(hr + 1)} 0 0 1 ${n1(100 + hr + 1)} ${n1(hY + 2)} Q${n1(100 + hr * 0.3)} ${n1(hY - hr * 0.7)} ${n1(100 - hr * 0.7)} ${n1(hY + 2)}Z"/>`
      : `<path class="a-hair" d="M${n1(100 - hr)} ${n1(hy0)} A${n1(hr)} ${n1(hr)} 0 0 1 ${n1(100 + hr)} ${n1(hy0)} Q100 ${n1(hY - hr * 0.7)} ${n1(100 - hr)} ${n1(hy0)}Z"/>`;
    A.aura = A.aura || 0;
  }
  o += faceSVG(A, 100, hY, hr, 5, -1, gh);
  return { o: o, G: { hx: 100, hy: hY, hr: hr, wy: 140, ww: hip + 4, sy: sY, sw: sw, by: 206 } };
}
function drawBeast(kind, A, O, gh) {
  var wolf = kind === "lupo",
    gor = kind === "gorilla",
    lion = kind === "leone",
    bull = kind === "toro",
    F = A.F,
    M = A.Mu,
    T = A.T,
    k = A.k,
    pr = A.pr,
    f = clamp((pr - 0.72) / 0.28, 0, 1),
    o = "";
  var vm = gor ? 1.16 : wolf ? 0.9 : bull ? 1.08 : lion ? 0.98 : 1;
  var rx2 = (lerp(28, 48, M) + F * 17 - T * 4) * vm,
    ry = lerp(32, 46, M) + F * 8 - T * 3,
    cy2 = 152,
    r = lerp(21, 26, M) * (gor ? 0.88 : 1) + F * 1.5,
    hy2 = cy2 - ry - r * 0.55 + A.sl * 0.6;
  var aw = (lerp(8, 21, M) + F * 4) * (gor ? 1.25 : 1) * k,
    lg = (lerp(11, 22, M) + F * 7) * k;
  if (wolf)
    o += `<path class="a-bodys" stroke-width="${n1(lerp(6, 11, M))}" d="M${n1(100 + rx2 * 0.7)} ${n1(cy2 + ry * 0.5)} Q${n1(100 + rx2 * 1.5)} ${n1(cy2 + ry * 0.7)} ${n1(100 + rx2 * 1.25)} ${n1(cy2 - ry * 0.4)}"/>`;
  if (lion)
    o += `<path d="M${n1(100 + rx2 * 0.7)} ${n1(cy2 + ry * 0.4)} Q${n1(100 + rx2 * 1.5)} ${n1(cy2 + ry * 0.6)} ${n1(100 + rx2 * 1.3)} ${n1(cy2 - ry * 0.2)}" fill="none" stroke="var(--bc)" stroke-width="5" stroke-linecap="round"/><circle cx="${n1(100 + rx2 * 1.3)}" cy="${n1(cy2 - ry * 0.25)}" r="${n1(6 + M * 3)}" fill="var(--md)"/>`;
  if (bull)
    o += `<path d="M${n1(100 + rx2 * 0.8)} ${n1(cy2 + ry * 0.3)} Q${n1(100 + rx2 * 1.25)} ${n1(cy2 + ry * 0.2)} ${n1(100 + rx2 * 1.2)} ${n1(cy2 + ry * 0.9)}" fill="none" stroke="var(--bd)" stroke-width="3" stroke-linecap="round"/>`;
  o += `<g class="a-bodys" stroke-width="${n1(lg)}"><line x1="${n1(100 - rx2 * 0.5)}" y1="${n1(cy2 + ry * 0.5)}" x2="${n1(100 - rx2 * 0.55)}" y2="238"/><line x1="${n1(100 + rx2 * 0.5)}" y1="${n1(cy2 + ry * 0.5)}" x2="${n1(100 + rx2 * 0.55)}" y2="238"/></g>`;
  o += `<ellipse class="a-shoe" cx="${n1(100 - rx2 * 0.58)}" cy="244" rx="${n1(lg * 0.95)}" ry="7"/><ellipse class="a-shoe" cx="${n1(100 + rx2 * 0.58)}" cy="244" rx="${n1(lg * 0.95)}" ry="7"/>`;
  if (bull && M > 0.35) o += `<ellipse class="a-body" cx="100" cy="${n1(cy2 - ry * 0.75)}" rx="${n1(rx2 * 0.75)}" ry="${n1(ry * 0.45)}"/>`;
  o += `<ellipse class="a-body" cx="100" cy="${cy2}" rx="${n1(rx2)}" ry="${n1(ry)}"/>`;
  if (F > 0.3) o += `<ellipse class="a-body" cx="100" cy="${n1(cy2 + ry * 0.45)}" rx="${n1(rx2 * (0.9 + F * 0.08))}" ry="${n1(ry * 0.55)}"/>`;
  o += `<ellipse class="a-soft" cx="100" cy="${n1(cy2 + 6)}" rx="${n1(rx2 * (gor ? 0.72 : 0.6))}" ry="${n1(ry * 0.62)}"/>`;
  if (!gh && M > 0.4)
    o +=
      `<path class="a-line" d="M100 ${n1(cy2 - ry * 0.55)} V${n1(cy2 + ry * 0.5)}"/>` +
      (M > 0.55 && F < 0.5
        ? `<path class="a-line" d="M${n1(100 - rx2 * 0.4)} ${n1(cy2 - ry * 0.1)} H${n1(100 + rx2 * 0.4)} M${n1(100 - rx2 * 0.38)} ${n1(cy2 + ry * 0.22)} H${n1(100 + rx2 * 0.38)}"/>`
        : "");
  var hands = {};
  [-1, 1].forEach(function (d) {
    var sx = 100 + d * rx2 * 0.8,
      sy = cy2 - ry * 0.45,
      ex = lerp(100 + d * (rx2 + 4), 100 + d * (rx2 + 24), f),
      ey = lerp(cy2 + ry * 0.05, cy2 - ry * 0.6, f),
      hx = lerp(100 + d * (rx2 + 6), 100 + d * (rx2 + 14), f),
      hy = lerp(cy2 + ry * 0.5, cy2 - ry - 14, f);
    hands[d] = { x: hx, y: hy };
    if (A.anim) {
      var pz = {
        D: { ex: 100 + d * (rx2 + 4), ey: cy2 + ry * 0.05, hx: 100 + d * (rx2 + 6), hy: cy2 + ry * 0.5 },
        U: { ex: 100 + d * (rx2 + 2), ey: cy2 - ry * 0.15, hx: 100 + d * rx2 * 0.78, hy: cy2 - ry * 0.4 },
        M: { ex: 100 + d * rx2 * 0.9, ey: cy2 - ry * 0.25, hx: 100 + d * r * 0.3, hy: hy2 + r * 0.45 }
      };
      var k2 = animArm(A, d, sx, sy, pz, aw, aw * 0.62, null);
      o += k2.poly + k2.hand + k2.tool + k2.apple;
      return;
    }
    o += `<polyline class="a-bodys" stroke-width="${n1(aw)}" points="${n1(sx)},${n1(sy)} ${n1(ex)},${n1(ey)} ${n1(hx)},${n1(hy)}"/><circle class="a-body" cx="${n1(hx)}" cy="${n1(hy)}" r="${n1(aw * 0.62)}"/>`;
  });
  if (!A.anim)
    o += propsSVG(O, A, {
      xl: hands[-1].x,
      xr: hands[1].x,
      hy: hands[1].y,
      wy: cy2 + ry * 0.55,
      ww: rx2 * 0.9,
      cy: cy2 - ry * 0.1
    });
  /* testa e tratti della specie */
  if (lion) {
    var nm = 7 + Math.round(pr * 5);
    for (var q = 0; q < nm; q++) {
      var an = (q / nm) * 6.2832;
      o += `<circle class="a-mane" cx="${n1(100 + Math.cos(an) * r * (1.05 + pr * 0.25))}" cy="${n1(hy2 + Math.sin(an) * r * (1.05 + pr * 0.25))}" r="${n1(r * (0.42 + pr * 0.12))}"/>`;
    }
    o += `<circle class="a-mane" cx="100" cy="${n1(hy2)}" r="${n1(r * (1.12 + pr * 0.2))}"/>`;
  }
  if (wolf)
    [-1, 1].forEach(function (d) {
      o += `<path class="a-body" d="M${n1(100 + d * r * 0.9)} ${n1(hy2 - r * 0.2)} L${n1(100 + d * r * 0.62)} ${n1(hy2 - r * 1.75)} L${n1(100 + d * r * 0.05)} ${n1(hy2 - r * 0.85)}Z"/>`;
    });
  else if (gor)
    [-1, 1].forEach(function (d) {
      o += `<circle class="a-body" cx="${n1(100 + d * r * 0.98)}" cy="${n1(hy2)}" r="${n1(r * 0.26)}"/>`;
    });
  else if (bull)
    [-1, 1].forEach(function (d) {
      o += `<ellipse class="a-body" cx="${n1(100 + d * r * 1.05)}" cy="${n1(hy2 - r * 0.3)}" rx="${n1(r * 0.42)}" ry="${n1(r * 0.2)}"/>`;
      o += `<path class="a-horn" d="M${n1(100 + d * r * 0.5)} ${n1(hy2 - r * 0.75)} Q${n1(100 + d * r * 1.45)} ${n1(hy2 - r * 0.7)} ${n1(100 + d * r * 1.35)} ${n1(hy2 - r * 1.75)} Q${n1(100 + d * r * 1.1)} ${n1(hy2 - r * 1.0)} ${n1(100 + d * r * 0.3)} ${n1(hy2 - r * 0.45)}Z"/>`;
    });
  else
    [-1, 1].forEach(function (d) {
      o +=
        `<circle class="a-body" cx="${n1(100 + d * r * 0.78)}" cy="${n1(hy2 - r * 0.8)}" r="${n1(r * 0.36)}"/>` +
        (lion ? "" : `<circle class="a-soft" cx="${n1(100 + d * r * 0.78)}" cy="${n1(hy2 - r * 0.8)}" r="${n1(r * 0.18)}"/>`);
    });
  o += `<circle class="a-body" cx="100" cy="${n1(hy2)}" r="${n1(r)}"/>`;
  var sn = wolf ? 0.55 : 0.5;
  o += `<ellipse class="a-soft" cx="100" cy="${n1(hy2 + r * (wolf ? 0.5 : 0.38))}" rx="${n1(r * sn)}" ry="${n1(r * (wolf ? 0.46 : 0.34))}"/>`;
  o += lion
    ? `<path d="M${n1(100 - r * 0.15)} ${n1(hy2 + r * 0.12)} h${n1(r * 0.3)} l${n1(-r * 0.15)} ${n1(r * 0.16)}z" fill="#c9737a"/>`
    : `<ellipse class="a-dark" cx="100" cy="${n1(hy2 + r * (wolf ? 0.36 : 0.22))}" rx="${n1(r * (wolf ? 0.17 : 0.15))}" ry="${n1(r * (wolf ? 0.12 : 0.1))}"/>`;
  if (bull) o += `<circle cx="100" cy="${n1(hy2 + r * 0.55)}" r="${n1(r * 0.16)}" fill="none" stroke="#e0b13a" stroke-width="1.8"/>`;
  if (gor) o += `<rect class="a-dark" x="${n1(100 - r * 0.62)}" y="${n1(hy2 - r * 0.38)}" width="${n1(r * 1.24)}" height="${n1(r * 0.14)}" rx="2"/>`;
  o += faceSVG(A, 100, hy2, r, r * 0.38, -r * 0.12 - 1.8 + 1.8, gh);
  return {
    o: o,
    G: {
      hx: 100,
      hy: hy2,
      hr: r,
      wy: cy2 + ry * 0.55,
      ww: rx2 * 0.95,
      sy: cy2 - ry * 0.45,
      sw: rx2 * 0.85,
      by: cy2 + ry + 8
    }
  };
}
function avatarSVG(kind, st, ctx) {
  ctx = ctx || S.profile;
  st = st || {};
  var O = OBJP[ctx.obiettivo] || OBJP.Ipertrofia,
    A = avState(O, ctx, st),
    aura = st.aura || 0,
    pal = PAL[kind] || PAL.umano,
    human = kind === "umano" || kind === "donna";
  A.aura = aura;
  A.anim = st.anim && !reducedMotion() ? st.anim : "";
  var style = Object.keys(pal)
    .map(function (c) {
      return "--" + c + ":" + pal[c];
    })
    .join(";");
  var fig = human ? drawHuman(kind, A, O, false) : drawBeast(kind, A, O, false),
    G = fig.G,
    ghost = "";
  if (O.ghost && A.pr > 0.25) {
    var A0 = avState(O, ctx, { p: 0, fat: 0 });
    A0.aura = 0;
    var gf = human ? drawHuman(kind, A0, O, true) : drawBeast(kind, A0, O, true);
    ghost = '<g class="a-ghost" transform="translate(100 250) scale(' + A0.sc.toFixed(3) + ') translate(-100 -250)">' + gf.o + "</g>";
  }
  var cape = "",
    acc = "";
  if (aura >= 5)
    cape =
      '<path class="a-cape" d="M' +
      (100 - G.sw + 4) +
      " " +
      G.sy +
      " L" +
      (100 + G.sw - 4) +
      " " +
      G.sy +
      " L" +
      (100 + G.sw + 18) +
      " " +
      G.by +
      " Q100 " +
      (G.by + 12) +
      " " +
      (100 - G.sw - 18) +
      " " +
      G.by +
      'Z"/>';
  if (aura >= 1)
    acc +=
      '<rect class="a-band" x="' +
      (G.hx - G.hr).toFixed(1) +
      '" y="' +
      (G.hy - G.hr * 0.62).toFixed(1) +
      '" width="' +
      (G.hr * 2).toFixed(1) +
      '" height="' +
      (G.hr * 0.26).toFixed(1) +
      '" rx="2"/>';
  if (aura >= 3)
    acc +=
      '<rect class="a-belt" x="' +
      (100 - G.ww).toFixed(1) +
      '" y="' +
      (G.wy - 6).toFixed(1) +
      '" width="' +
      (G.ww * 2).toFixed(1) +
      '" height="8" rx="2"/><rect class="a-dark" x="96" y="' +
      (G.wy - 7).toFixed(1) +
      '" width="8" height="10" rx="2"/>';
  if (aura >= 7)
    acc +=
      '<path class="a-crown" d="M' +
      (G.hx - G.hr * 0.7).toFixed(1) +
      " " +
      (G.hy - G.hr * 0.95).toFixed(1) +
      " L" +
      (G.hx - G.hr * 0.75).toFixed(1) +
      " " +
      (G.hy - G.hr * 1.65).toFixed(1) +
      " L" +
      (G.hx - G.hr * 0.3).toFixed(1) +
      " " +
      (G.hy - G.hr * 1.25).toFixed(1) +
      " L" +
      G.hx +
      " " +
      (G.hy - G.hr * 1.8).toFixed(1) +
      " L" +
      (G.hx + G.hr * 0.3).toFixed(1) +
      " " +
      (G.hy - G.hr * 1.25).toFixed(1) +
      " L" +
      (G.hx + G.hr * 0.75).toFixed(1) +
      " " +
      (G.hy - G.hr * 1.65).toFixed(1) +
      " L" +
      (G.hx + G.hr * 0.7).toFixed(1) +
      " " +
      (G.hy - G.hr * 0.95).toFixed(1) +
      'Z"/>';
  return (
    '<svg viewBox="-30 0 260 260" role="img" aria-label="Avatar" style="' +
    style +
    '"><ellipse class="a-ground" cx="100" cy="252" rx="70" ry="5"/>' +
    auraSVG(aura) +
    ghost +
    '<g transform="translate(100 250) scale(' +
    A.sc.toFixed(3) +
    ') translate(-100 -250)">' +
    cape +
    (A.anim ? "<g>" + smT("translate", ["0 0", "0 -1.6", "0 0"], 2.4) + fig.o + "</g>" : fig.o) +
    acc +
    (A.anim === "diet"
      ? '<g transform="translate(' +
        (G.hx + G.hr * 1.5).toFixed(1) +
        " " +
        (G.hy - G.hr * 1.6).toFixed(1) +
        ')" opacity="0">' +
        sm("opacity", A_HRT, 18) +
        '<path d="M0 4 C-9 -3 -5 -10 0 -5 C5 -10 9 -3 0 4z" fill="#34b36b"/></g>'
      : "") +
    "</g></svg>"
  );
}

/* Animazione SMIL dell'avatar: si allena e, con la dieta, mangia sano. */
var SEQ_T = ["D", "U", "D"];
var SEQ_R = ["D", "U", "D", "U", "D", "U", "D", "M", "M", "M", "D", "M", "M", "M", "D", "M", "M", "D", "D"];
var SEQ_L = ["D", "D", "U", "D", "U", "D", "D", "D", "D", "D", "D", "D", "D", "D", "D", "D", "D", "D", "D"];
var A_DBR = [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var A_APL = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0];
var A_APS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.8, 0.8, 0.8, 0.6, 0.55, 0.55, 0.4, 0.3, 0, 0];
var A_HRT = [0, 0, 0, 0, 0, 0, 0, 0, 0.9, 1, 0, 0, 0.9, 1, 0, 0.9, 1, 0.5, 0];
function sm(attr, vals, dur, begin) {
  return (
    '<animate attributeName="' +
    attr +
    '" values="' +
    vals.join(";") +
    '" dur="' +
    dur +
    's" begin="' +
    (begin || 0) +
    's" repeatCount="indefinite"/>'
  );
}
function smT(type, vals, dur, begin) {
  return (
    '<animateTransform attributeName="transform" type="' +
    type +
    '" values="' +
    vals.join(";") +
    '" dur="' +
    dur +
    's" begin="' +
    (begin || 0) +
    's" repeatCount="indefinite"/>'
  );
}
function reducedMotion() {
  try {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (e) {
    return false;
  }
}
/* Un braccio (con contorno): fermo nella posa tra «giù» (D) e «braccia alzate» (X), oppure animato:
   si allena (U = manubrio al petto) e, con la dieta, mangia una mela (M = mano alla bocca). */
function armSVG(A, d, sx, sy, pz, f, o) {
  var diet = A.anim === "diet",
    anim = !!A.anim,
    seq = !anim ? null : diet ? (d > 0 ? SEQ_R : SEQ_L) : SEQ_T,
    dur = diet ? 18 : 2.4,
    bg = diet ? 0 : d > 0 ? -1.2 : 0,
    rest = anim
      ? pz.D
      : { ex: lerp(pz.D.ex, pz.X.ex, f), ey: lerp(pz.D.ey, pz.X.ey, f), hx: lerp(pz.D.hx, pz.X.hx, f), hy: lerp(pz.D.hy, pz.X.hy, f) },
    P = anim ? seq.map((k) => pz[k]) : [rest],
    pts = (p) => n1(sx) + "," + n1(sy) + " " + n1(p.ex) + "," + n1(p.ey) + " " + n1(p.hx) + "," + n1(p.hy),
    an = (attr, fn) => (anim ? sm(attr, P.map(fn), dur, bg) : ""),
    poly = (stroke, w) =>
      `<polyline points="${pts(rest)}" fill="none" stroke="${stroke}" stroke-width="${n1(w)}" stroke-linecap="round" stroke-linejoin="round">${an("points", pts)}</polyline>`,
    out = poly(SK, o.w + 4.8) + poly(o.fill, o.w);
  if (o.bic)
    out += `<ellipse cx="${n1((sx + rest.ex) / 2 + o.bic.dx)}" cy="${n1((sy + rest.ey) / 2)}" rx="${n1(o.bic.rx)}" ry="${n1(o.bic.ry)}" fill="${o.fill}">${an("cx", (p) => n1((sx + p.ex) / 2 + o.bic.dx))}${an("cy", (p) => n1((sy + p.ey) / 2))}</ellipse>`;
  var hand = (r, extra) =>
    `<circle cx="${n1(rest.hx)}" cy="${n1(rest.hy)}" r="${n1(r)}" ${extra}>${an("cx", (p) => n1(p.hx))}${an("cy", (p) => n1(p.hy))}</circle>`;
  out += hand(o.hr, `fill="${o.fill}" stroke="${SK}" stroke-width="2.4"`);
  if (o.band) out += hand(o.hr - 1.2, `fill="none" stroke="${o.band}" stroke-width="3.4" stroke-opacity=".95"`);
  if (anim) {
    var pos = P.map((p) => n1(p.hx) + " " + n1(p.hy));
    out += `<g transform="translate(${pos[0]})">${smT("translate", pos, dur, bg)}${diet && d > 0 ? sm("opacity", A_DBR, dur, bg) : ""}${dumbbell(0, 0)}</g>`;
    if (diet && d > 0)
      out += `<g opacity="0" transform="translate(${pos[0]})">${smT("translate", pos, dur, bg)}${sm("opacity", A_APL, dur, bg)}<g transform="translate(0 -6)"><g>${smT(
        "scale",
        A_APS.map((v) => v + " " + v),
        dur,
        bg
      )}<circle r="7" fill="#d63a3a" stroke="${SK}" stroke-width="1.8"/><path d="M0 -6 q1 -4 4 -5" stroke="#5a3a1a" stroke-width="1.5" fill="none"/><path d="M1 -7 q4 -3 6 0 q-3 3 -6 0z" fill="#3fb06b" stroke="${SK}" stroke-width="1"/></g></g></g>`;
  }
  return out;
}

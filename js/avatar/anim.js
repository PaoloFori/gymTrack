/* Animazione SMIL dell'avatar: si allena e, con la dieta, mangia sano. */
/* Accessori legati all'obiettivo: manubri, bilanciere, metro da sarta, medaglia. */
/* ---- animazione (SMIL): si allena (con la dieta anche mangia sano) ---- */
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
/* Un braccio animato: poses = { D: giù, U: manubrio al petto, M: mano alla bocca }. */
function animArm(A, d, sx, sy, poses, w, handR, bic) {
  var diet = A.anim === "diet",
    seq = diet ? (d > 0 ? SEQ_R : SEQ_L) : SEQ_T,
    dur = diet ? 18 : 2.4,
    bg = diet ? 0 : d > 0 ? -1.2 : 0;
  var P = seq.map(function (k) {
      return poses[k];
    }),
    b = poses.D,
    o = {};
  var pts = P.map(function (p) {
    return n1(sx) + "," + n1(sy) + " " + n1(p.ex) + "," + n1(p.ey) + " " + n1(p.hx) + "," + n1(p.hy);
  });
  o.poly = '<polyline class="a-bodys" stroke-width="' + n1(w) + '" points="' + pts[0] + '">' + sm("points", pts, dur, bg) + "</polyline>";
  o.bic = bic
    ? '<ellipse class="a-body" cx="' +
      n1((sx + b.ex) / 2 + bic.dx) +
      '" cy="' +
      n1((sy + b.ey) / 2) +
      '" rx="' +
      n1(bic.rx) +
      '" ry="' +
      n1(bic.ry) +
      '">' +
      sm(
        "cx",
        P.map(function (p) {
          return n1((sx + p.ex) / 2 + bic.dx);
        }),
        dur,
        bg
      ) +
      sm(
        "cy",
        P.map(function (p) {
          return n1((sy + p.ey) / 2);
        }),
        dur,
        bg
      ) +
      "</ellipse>"
    : "";
  o.hand =
    '<circle class="a-body" cx="' +
    n1(b.hx) +
    '" cy="' +
    n1(b.hy) +
    '" r="' +
    n1(handR) +
    '">' +
    sm(
      "cx",
      P.map(function (p) {
        return n1(p.hx);
      }),
      dur,
      bg
    ) +
    sm(
      "cy",
      P.map(function (p) {
        return n1(p.hy);
      }),
      dur,
      bg
    ) +
    "</circle>";
  var pos = P.map(function (p) {
    return n1(p.hx) + " " + n1(p.hy);
  });
  o.tool =
    '<g transform="translate(' +
    pos[0] +
    ')">' +
    smT("translate", pos, dur, bg) +
    (diet && d > 0 ? sm("opacity", A_DBR, dur, bg) : "") +
    dumbbell(0, 0, 1) +
    "</g>";
  o.apple = "";
  if (diet && d > 0)
    o.apple =
      '<g opacity="0" transform="translate(' +
      pos[0] +
      ')">' +
      smT("translate", pos, dur, bg) +
      sm("opacity", A_APL, dur, bg) +
      '<g transform="translate(0 -6)"><g>' +
      smT(
        "scale",
        A_APS.map(function (v) {
          return v + " " + v;
        }),
        dur,
        bg
      ) +
      '<circle r="6.5" fill="#d63a3a"/><path d="M0 -6 q1 -4 4 -5" stroke="#5a3a1a" stroke-width="1.3" fill="none"/><path d="M1 -7 q4 -3 6 0 q-3 3 -6 0z" fill="#3fb06b"/></g></g></g>';
  return o;
}

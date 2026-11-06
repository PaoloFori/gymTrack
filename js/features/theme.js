/* Tema app: palette di colori, aspetto chiaro/scuro, finestra di scelta. */
/* ---------- tema ---------- */
var PALS = [
  { id: "blu", n: "Blu", h: 227, l: 52 },
  { id: "smeraldo", n: "Smeraldo", h: 155, l: 33 },
  { id: "arancio", n: "Arancio", h: 22, l: 43 },
  { id: "viola", n: "Viola", h: 268, l: 50 },
  { id: "rosso", n: "Rosso", h: 355, l: 47 },
  { id: "rosa", n: "Rosa", h: 322, l: 46 },
  { id: "turchese", n: "Turchese", h: 187, l: 32 },
  { id: "oro", n: "Oro", h: 42, l: 34 },
  { id: "grafite", n: "Grafite", h: 215, g: 1, l: 24, ld: 86 }
];
function hsl(h, s, l) {
  return "hsl(" + h + "," + s + "%," + l + "%)";
}
function palVars(p, dark) {
  var h = p.h,
    g = p.g ? 0 : 1;
  return dark
    ? {
        bg: hsl(h, 28 * g, 8),
        surface: hsl(h, 24 * g, 12.5),
        surface2: hsl(h, 22 * g, 17.5),
        ink: hsl(h, 25 * g, 93),
        muted: hsl(h, 12 * g, 65),
        line: hsl(h, 20 * g, 23),
        accent: hsl(h, p.g ? 0 : 88, p.ld || 72),
        "accent-ink": hsl(h, 40 * g, 8)
      }
    : {
        bg: hsl(h, 22 * g, 94),
        surface: hsl(h, 20 * g, 99),
        surface2: hsl(h, 25 * g, 89),
        ink: hsl(h, 30 * g, 12),
        muted: hsl(h, 12 * g, 38),
        line: hsl(h, 20 * g, 83),
        accent: hsl(h, p.g ? 0 : 74, p.l || 46),
        "accent-ink": "#fff"
      };
}
function isDark() {
  var m = (S.tema || {}).mode;
  return m === "dark" || (m !== "light" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}
function applyTheme() {
  var T = S.tema || {},
    p =
      PALS.find(function (x) {
        return x.id === T.pal;
      }) || PALS[0],
    dark = isDark(),
    v = palVars(p, dark),
    r = document.documentElement;
  Object.keys(v).forEach(function (k) {
    r.style.setProperty("--" + k, v[k]);
  });
  r.setAttribute("data-theme", dark ? "dark" : "light");
  r.style.colorScheme = dark ? "dark" : "light";
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", v.accent);
}
try {
  if (window.matchMedia)
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if ((S.tema || {}).mode === "auto") applyTheme();
    });
} catch (e) {}
function temaSheet() {
  var T = S.tema,
    dark = isDark(),
    b =
      '<div class="meta" style="margin:0 0 6px;font-weight:600">Aspetto</div><div class="seg" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:14px">' +
      [
        ["auto", "Automatico"],
        ["light", "Chiaro"],
        ["dark", "Scuro"]
      ]
        .map(function (m) {
          return '<button data-act="tema-mode" data-m="' + m[0] + '" aria-pressed="' + (T.mode === m[0]) + '">' + m[1] + "</button>";
        })
        .join("") +
      "</div>";
  b +=
    '<div class="meta" style="margin:0 0 6px;font-weight:600">Colori</div><div class="swg">' +
    PALS.map(function (p) {
      var v = palVars(p, dark);
      return (
        '<button class="sw" data-act="tema-pal" data-p="' +
        p.id +
        '" aria-pressed="' +
        (T.pal === p.id) +
        '" style="background:' +
        v.surface +
        ";color:" +
        v.ink +
        '"><i style="background:' +
        v.bg +
        '"><b style="background:' +
        v.accent +
        '"></b></i><span>' +
        p.n +
        "</span></button>"
      );
    }).join("") +
    "</div>";
  return sheetShell("Tema app", b, '<button class="btn primary wide" data-act="close-sheet">Fatto</button>');
}

ACT["tema-mode"] = function (d) {
  S.tema.mode = d.m;
  saveApp();
  applyTheme();
  render();
};
ACT["tema-pal"] = function (d) {
  S.tema.pal = d.p;
  saveApp();
  applyTheme();
  render();
};
ACT["open-tema"] = function (d) {
  sheet = { kind: "tema" };
  render();
};

SHEETS.tema = { html: temaSheet };

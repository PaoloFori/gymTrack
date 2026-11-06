/* Ricerca e visualizzazione delle GIF degli esercizi. */
function gifTok(q) {
  return String(q || "")
    .toLowerCase()
    .split(/[^a-z0-9\u00e0-\u00fa-]+/)
    .filter(function (t) {
      return t.length > 1 || ITEN[t];
    });
}
function gifSearch(q, lim) {
  var toks = gifTok(q)
    .map(function (t) {
      return ITEN[t] || [t];
    })
    .filter(function (a) {
      return a.join("") !== "";
    });
  if (!toks.length) return [];
  var full = [],
    part = [];
  GIFS.forEach(function (g) {
    var n = g[1].toLowerCase(),
      m = 0;
    toks.forEach(function (alts) {
      if (
        alts.some(function (a) {
          return a && n.indexOf(a) >= 0;
        })
      )
        m++;
    });
    if (m === toks.length) full.push(g);
    else if (m && m >= Math.ceil(toks.length / 2) && toks.length > 1) part.push({ g: g, m: m });
  });
  full.sort(function (a, b) {
    return a[1].length - b[1].length;
  });
  part.sort(function (a, b) {
    return b.m - a.m || a.g[1].length - b.g[1].length;
  });
  return full
    .concat(
      part.map(function (x) {
        return x.g;
      })
    )
    .slice(0, lim || 8);
}
function matchGif(nomeEn) {
  var n = String(nomeEn || "")
    .trim()
    .toLowerCase();
  if (!n) return "";
  for (var i = 0; i < GIFS.length; i++) if (GIFS[i][1].toLowerCase() === n) return GIFS[i][2];
  var r = gifSearch(n, 1)[0];
  return r &&
    r[1].length <= n.length + 14 &&
    gifTok(n).every(function (t) {
      return r[1].toLowerCase().indexOf(t) >= 0;
    })
    ? r[2]
    : "";
}
function gifImg(file, cls) {
  return file
    ? '<img class="gif ' + (cls || "") + '" src="' + GBASE + "videos/" + esc(file) + '" loading="lazy" alt="Dimostrazione dell\'esercizio">'
    : "";
}
function gifThumb(file) {
  return '<img src="' + GBASE + "images/" + esc(String(file).replace(/\.gif$/, ".jpg")) + '" loading="lazy" alt="">';
}

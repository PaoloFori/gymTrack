# GymTrack — guida per chi lavora sul codice

GymTrack è una **PWA statica** (nessun server, nessuna build, nessuna dipendenza a runtime) per telefono: tiene traccia di
allenamenti, diete e di un **avatar** che cresce con l'impegno. Tutto è in italiano. I dati stanno solo sul dispositivo
(localStorage + copie in IndexedDB). Va servita su HTTPS (GitHub Pages) per avere service worker e notifiche.

## Cosa fa l'app

- **Sessioni** (1–12 mesi): ognuna ha obiettivo, allenamenti a settimana, avatar, schede e opzionalmente una dieta (`dietId`).
  Ne esiste al massimo **una in corso** (`attiva()`); le altre sono concluse (`chiusa: true`) e formano lo storico.
- **Avatar** (10 specie, stile cartoon), disegnato in SVG da codice: il corpo si interpola tra «fuori obiettivo» (p=0) e «obiettivo perfetto» (p=1);
  nomi dei livelli, accessori e animazione dipendono da obiettivo, aura e dieta.
- **Allenamento**: lista esercizi → dettaglio esercizio con serie e timer di recupero → «Fatto» → «Fine scheda» (salva subito).
- **Dieta**: da JSON → scelta pasti → scelta alimenti e quantità → piano settimanale + lista della spesa; cottura normale o
  «una volta al giorno» (cena e pranzo successivo con gli stessi cereali/verdure, quantità totale da cucinare).
- **Import JSON** di schede (sessione corrente o passata con avatar calcolato), **copia** di sessioni e diete.
- **IA** (nessun assistente è collegato): l'app prepara **prompt** da incollare in un assistente esterno e riceve in risposta un
  JSON — per convertire un PDF in JSON, per generare schede, per proporre una dieta. Ogni generazione mostra l'avviso
  «l'IA non è un nutrizionista né un personal trainer». Se `window.claude` è disponibile (ambiente Claude) la generazione parte direttamente.
- **Home**: profilo (si apre dalla Home), **scheda suprema** (nome solo interno, nell'app si chiama «Il tuo campione»: avatar animato + rimandi a sessione e dieta correnti + collegamento) e **calendario** in fondo.
- **Analisi**: statistiche per sessione (+ dieta collegata) / tutto, record di tutte le sessioni, peso, storico. **Tema** a 9 palette.

## Struttura del repository

Nessun bundler né moduli ES: ogni file in `js/` è uno **script classico** che condivide lo scope globale. L'ordine di
caricamento è quello degli `<script>` in `index.html` (le funzioni si chiamano a runtime, quindi conta solo che gli statement
di primo livello trovino ciò che usano). Il codice è formattato con **Prettier** (`.prettierrc`, `.prettierignore`).

```
index.html            scheletro e elenco degli script
sw.js                 service worker (cache offline) — elenca tutti i file da mettere in cache
css/                  base.css (variabili, layout, componenti, barra, finestre) · avatar.css · workout.css · diet.css · stats.css
js/
  core/               fondamenta, senza interfaccia
    constants.js        chiavi di salvataggio, gruppi muscolari, obiettivi (OBJ, OBJP), attrezzi (EQ), avatar (AV, AVK)
    gifdata.js          dataset GIF (nomi/file) e dizionario italiano→inglese per la ricerca
    registry.js         ACT, SHEETS, HOOKS: registri (VIEWS, ACT, SHEETS, HOOKS) in cui i moduli si «iscrivono» (vedi sotto)
    utils.js            uid, esc, clamp, date, toast, confirmed, parseLoose, copyText…
    state.js            stato globale (S, LOG, view, sheet, session…), normalize, attiva(), getScheda()
    storage.js          salvataggio locale/cloud, copie in IndexedDB, backup manuale, banner di promemoria
    progress.js         progress(a) (forma, grasso, aura), stimaSettimane, simFinal
  avatar/             levels.js (nomi delle evoluzioni e stage) · draw.js (SVG: rig, specie, abbigliamento, aura a fiamme) · anim.js (animazione SMIL)
  ui/                 schermate e finestre generiche
    shell.js            hdr, TABS, go() con swipe, barra in basso, sheetShell, sheetHTML, render()
    home.js             Home: profilo, scheda suprema (supremaCard), calendario in fondo
    analysis.js         Analisi: ambito (tutto/sessione), statistiche, record, peso, storico
    sessions.js         pagina Sessioni (corrente + storico) e griglie con selezione
    session.js          dettaglio sessione corrente/passata, scheda, storico allenamenti
    session-sheets.js   finestre nuova sessione / scheda / esercizio e relative azioni
    profile.js          pagina Profilo (aperta dalla Home): dati personali, notifiche, backup
    calendar.js · charts.js   riquadro calendario (calCard); grafici, record, peso
  features/           funzioni di dominio, ognuna con modello, viste e azioni
    gifs.js · history.js · theme.js
    workout/            runtime.js (timer, notifiche, salvataggio) · ui.js (lista esercizi e dettaglio)
    diet/               model.js (categorie, JSON) · plan.js (piano e spesa) · ui.js (viste) · source.js (da dove arriva: JSON/IA/copia) · sheet.js (pasti → alimenti → cottura)
    ai/                 prompts.js (schemi JSON e prompt) · sheet.js (finestra «Schede con IA», email)
    import.js           caricamento schede da JSON e creazione sessione corrente/passata
  app/                actions.js (smistamento delle azioni) · events.js (listener globali) · boot.js (avvio)
private/              IGNORATA da git: JSON personali di schede e diete (non pubblicare)
```

### Registri (come si aggiunge una funzione)
Niente grossi `switch`: ogni modulo registra ciò che gestisce in `core/registry.js`.

- `VIEWS["nome"] = function () { return html }` — schermata (`view.name`); `render()` chiama `VIEWS[view.name]`.
- `ACT["nome"] = function (d, el, nome) {…}` — azione dei bottoni con `data-act="nome"` (`d` = `dataset`). `act()` in `app/actions.js` la chiama
  dentro un try/catch che mostra l'errore. L'azione deve cambiare lo stato e chiamare `render()`.
- `SHEETS[kind] = { html(k), save(k)?, session? }` — finestra modale; `sheet.kind` sceglie la voce, `session: true` = serve una sessione in corso.
- `HOOKS.input.push(fn)` / `HOOKS.change.push(fn)` — gestori di campi (`fn(target, evento)` → `true` se gestito). Se nessuno risponde,
  `app/events.js` scrive `sheet[data-sf] = valore` (campi con `data-sf="campo"` nelle finestre).

### Regole per modificare
- **Nuovo file** → aggiungilo a `index.html` **e** all'array `FILES` di `sw.js` (se è una cartella nuova anche al `cp` in `.github/workflows/pages.yml`).
- **Ogni rilascio** → alza `VERSION` in `sw.js`, altrimenti i telefoni restano sulla cache vecchia.
- Il codice nuovo usa template literal e arrow function dove rende più leggibile; il vecchio è ES5 con `var`. Non serve riscriverlo, ma non mescolare nella stessa funzione.
- Interfaccia = HTML in stringa: usa sempre `esc()` per testi dell'utente.
- Formatta con `npx prettier --write "js/**/*.js" "css/*.css"` (esclude `gifdata.js`).

## Architettura dell'interfaccia

- **Stato globale** (`core/state.js`): `S` (dati persistenti), `LOG` (allenamenti fatti), `view` (schermata), `sheet` (finestra aperta o `null`),
  `session` (allenamento in corso), `timer`, `armed`, `selMode`/`selIds` (selezione per eliminare), `supOpen` (scheda suprema aperta), `anScope` (ambito dell'Analisi: `"all"` o id sessione).
- **`render()`** ricostruisce `#app`, `#bar` e `#sheetwrap` da zero a ogni cambiamento (nessun diffing): dopo aver cambiato lo stato si chiama `render()`.
  Timer di recupero e cronometro si aggiornano a parte (`updateTimer`).
- **Conferma a due tocchi**: `confirmed(chiave)` imposta `armed` e ritorna `false` al primo tocco (il testo del bottone cambia), `true` al secondo.
- **Viste** (`view.name`): le quattro schede di `TABS` — `home`, `sessioni`, `dieta`, `analisi` — più `profilo` (si apre dalla Home, evidenzia Home), `corrente` (sessione in corso), `sess` (sessione passata,
  con `view.from` = scheda di provenienza, usata da «indietro» e da `tabOf()`), `scheda`, `workout`, `wex` (dettaglio esercizio), `dietad` (dettaglio dieta). `tabOf()` dice quale icona evidenziare; `go(v)` cambia scheda con
  animazione direzionale e lo swipe orizzontale usa lo stesso `go`.
- **Finestre** (`sheet.kind`): `sess`, `scheda`, `es`, `ai`, `graf`, `pr`, `tema`, `dieta` (`step`: `src` → `gen` → `genout` | `pasti` → `alim` → `cucina`),
  `impsess` (`step`: `src` → `q` → `cur` | `past`).
- **Tema**: `applyTheme()` calcola i colori da tinta+luminosità (`palVars`) e li scrive come variabili CSS inline su `<html>`; imposta sempre `data-theme`.

## Modello dei dati

`S` (salvato in `localStorage["gymtrack.v2"]` con `LOG`; `normalize()` ripara/migra):

```js
S = {
  profile: { foto, nome, eta, altezza, peso, coachEmail },
  sessioni: [ sessione ], diete: [ dieta ], attrezzi: [ nome ], pesi: [ { ts, kg } ],
  tema: { pal: "blu", mode: "auto|light|dark" }, lastBackup: ts
}
sessione = {
  id, nome, tipo,               // tipo = avatar: umano|donna|gatto|cane|alieno|animale(orso)|lupo|gorilla|leone|toro
  start, mesi, giorni,          // inizio (ts), durata in mesi, allenamenti a settimana
  obiettivo,                    // Ipertrofia|Forza|Dimagrimento|Mantenimento|Ricomposizione
  altezza, eta, peso, chiusa, chiuseTs,
  finale: { P, n, aura, fat, p },   // fotografia dell'avatar alla chiusura (solo se chiusa)
  schede: [ { id, nome, note, esercizi: [ { id, nome, gruppo, serie, reps, rec, note, riscal, sup, gif } ] } ],
  dietId,                       // collegamento alla dieta ("" = nessuna)
  fatti                         // solo sessioni importate come passate: n. di allenamenti dichiarati
}
LOG[i] = { id, ts, sid, schedaId, schedaNome, durMin, durSec, ex: [ { id, nome, sets: [ { kg, reps, w? } ] } ], prs }
```
(`w: true` = serie di riscaldamento, esclusa da volume e record; `reps` dell'esercizio è testo libero, es. «6/8» o «10-8-6-X»; `rec` in secondi.)

Allenamento in corso: `session = { sid, schedaId, schedaNome, t0, ex: [ { …esercizio, completed, prev, sets: [ { kg, reps, done, w?, added? } ] } ] }`,
salvato in `localStorage["gymtrack.v2.s"]`. Una serie `done` non si annulla; `added` marca le serie aggiunte dall'utente (le sole eliminabili).

**Progresso e avatar** (`progress(a)`): ogni settimana completa vale `2·fatti − previsti`; il saldo `B` è limitato tra `−3·giorni` e `M = giorni·settimane`;
`P = 100·B/M` (forma), `p = (B/M)^0.75` (interpolazione del corpo), `fat` = grasso da allenamenti saltati, `aura` = settimane perfette consecutive.
`simFinal()` ripete il calcolo per una sessione passata di cui si conosce solo il totale degli allenamenti.

**Dieta**:

```js
dieta = {
  id, nome, creata, periodo: { dal, al }|null,
  regole: { carne:{max}, pesce:{min}, tonno:{max}, uova:{min}, latt:{min}, legu:{min}, patate:{max} },
  cook: { mode: "due"|"uno", dir: "sera"|"pranzo" },
  seed,                          // cambia a ogni «Rigenera» per variare il piano
  pasti: [ { id, nome, on, piatti: [ { id, nome, varianti: [ { id, on, alimenti: [ { id, opzioni: [ { id, n, qt, u, on } ] } ] } ] } ] } ],
  plan:  [ 7 giorni × [ { t: nomePasto, v: [ { n, qt, u, nota? } ] } ] ],
  spesa: [ { k, n, cat, q, u, preso } ]
}
```
Una *variante* è un'alternativa completa del piatto; un *alimento* è una voce con più *opzioni* equivalenti (la prima è la prescritta). Il collegamento sta nella sessione
(`sessione.dietId`): la dieta è **corrente** se collegata alla sessione in corso, **passata** altrimenti; più sessioni possono puntare alla stessa.

- **Piano** (`makePlan`): per ogni giorno e pasto sceglie una variante (la meno usata) e per ogni alimento un'opzione con un punteggio: bonus per avvicinarsi ai minimi
  settimanali, esclusione al superamento dei massimi, penalità per ripetizioni e per lo stesso cibo due volte nel giorno. Con `cook.mode === "uno"` le coppie
  cena→pranzo del giorno dopo (`dir "sera"`) o pranzo→cena (`dir "pranzo"`) riusano lo stesso cereale/proteina/verdura quando il secondo pasto ha quell'opzione attiva,
  e il primo riceve la nota «cucina X in totale».
- **Spesa** (`makeSpesa`): somma per nome+unità e raggruppa per reparto (`DC`). Nessuna marca consigliata.

## JSON e IA

L'app **non legge PDF**: accetta solo JSON, perché la conversione da PDF/testo la fa un assistente IA su richiesta dell'utente. Per questo in `features/ai/prompts.js` ci sono
gli schemi (`SCHEMA_DIETA`, `SCHEMA_SESSIONE`) e i prompt (`promptConvertDieta`, `promptConvertSessione`, `promptGenDieta`, più `buildPrompt`/`mailText` per le schede).
`promptCard(id, etichetta, testo)` disegna il riquadro con il tasto «Copia il prompt» (`ACT["copy-ta"]`); `copyText()` copia negli appunti o lascia selezionato il testo.

Ogni risposta incollata passa da `parseLoose()` (estrae il primo `{…}` valido, anche tra testo o recinti markdown) e poi da `dietIngest` / `impIngest`.
Un JSON del tipo sbagliato viene rifiutato (`"gymtrack"` distingue `dieta` da `sessione`).

**Schede / sessione** (`"gymtrack": "sessione"`) — *Sessioni → Carica JSON*:

```json
{
  "gymtrack": "sessione", "v": 1,
  "nome": "Marzo–maggio 2026", "obiettivo": "Ipertrofia", "giorni": 4,
  "periodo": { "dal": "2026-03-09", "al": "2026-05-03" },
  "schede": [
    { "nome": "Push", "note": "",
      "esercizi": [
        { "nome": "Distensioni manubri panca piana", "nome_en": "dumbbell bench press", "gruppo": "Petto",
          "serie": 4, "reps": "6/8", "rec": 120, "note": "Panca 20°", "riscal": 0, "sup": false }
      ] }
  ]
}
```
`rec` in secondi; `nome_en` (facoltativo) serve a trovare la GIF; `gruppo` è uno di `GR`. Dopo la lettura l'app chiede se è la scheda corrente; se no, chiede periodo e numero di
allenamenti e crea una sessione conclusa (`fatti`).

**Dieta** (`"gymtrack": "dieta"`) — *Dieta → Nuova dieta*:

```json
{
  "gymtrack": "dieta", "v": 1, "nome": "Dieta 9 mar – 3 mag 2026",
  "periodo": { "dal": "2026-03-09", "al": "2026-05-03" },
  "regole": { "pesce": { "min": 3 }, "carne": { "max": 5 }, "patate": { "max": 2 } },
  "pasti": [
    { "nome": "Pranzo", "piatti": [ { "nome": "Piatto unico", "varianti": [
      { "alimenti": [
        { "opzioni": [ { "nome": "Riso", "qt": 100, "u": "g" }, { "nome": "Quinoa", "qt": 100, "u": "g" } ] },
        { "opzioni": [ { "nome": "Verdura", "qt": 200, "u": "g" } ] }
      ] } ] } ] }
  ]
}
```
Le chiavi di `regole` sono quelle di `optKeys()` (carne, pesce, tonno, uova, latt, legu, patate); `min`/`max` sono volte a settimana.

## Persistenza e cloud

- `saveApp()` → `saveLocal()` (localStorage, ultimi 400 allenamenti) + salvataggio cloud se `window.claude` espone lo storage dell'app (`mode = "cloud"`); altrimenti
  `scheduleSnap()` crea una copia al giorno in IndexedDB (7 giorni) e `autoRestoreIfEmpty()` recupera da lì se i dati principali sono spariti.
- Backup manuale: `exportBk()` / `importBk()` (JSON `{ v:2, S, LOG }`).
- Le GIF sono caricate da `raw.githubusercontent.com` (dataset hasaneyldrm/exercises-dataset) e messe in cache dal service worker.

## Avatar: come è disegnato

`avatarSVG(kind, st, ctx)` con `st = { p, fat, aura, anim? }` e `ctx` = sessione/profilo (`avatar/draw.js`). Stile cartoon «chibi» con contorni scuri; un solo scheletro (`rig`) per tutte le 10 specie
(`AVK`): ogni specie ha palette (`PAL`), proporzioni (`SPEC`) e parti della testa (`headParts`, `tailSVG`: orecchie, muso, criniera, corna, antenne…).
`avState` converte progresso e obiettivo (`OBJP`: grasso `f`, muscolo `m`, magrezza `t` a inizio/fine) in `F`, `Mu`, `T` e calcola lo **stage** 0–4 (`stageOf` in `levels.js`); lo stage sceglie
l'abbigliamento (`outfitFor`, colore per obiettivo in `OC`) e il nome dell'evoluzione (`LVN`). Accessori di obiettivo in `propsSVG`; per dimagrimento/ricomposizione c'è la **sagoma «prima»** (`ghost`).
L'**aura** (`auraSVG`) è a fiamme di poligoni; dipende solo dai boost (`aura`), non dalla forma: alta/luminosa con più boost, colore oro → arancio → azzurro. Cape/fascia/cintura/corona sono legati ai boost.
Con `anim` (`"train"` o `"diet"`) braccia, coda e fiamme sono animate in SMIL (`armSVG` in `anim.js`): si allena e, con la dieta, mangia una mela; fermo se l'utente ha «riduci movimento».
Le immagini in `docs/avatar-*.png` si rigenerano con una pagina di prova che chiama `avatarSVG` per obiettivo/specie/progresso.

## Come provare le modifiche

Non ci sono test automatici. A mano: servire la cartella (`python3 -m http.server`) e aprirla in un browser. Per controlli rapidi si usa Chrome headless
(`--allow-file-access-from-files --screenshot`) con una pagina di prova che carica gli stessi `js/**/*.js` e prepara lo stato chiamando `act("nome-azione", {...})`.
La logica pura (`makePlan`, `dietFromJson`) si può eseguire anche in Node caricando i file in un contesto `vm` con uno stub di `window`/`document`.

## Cose da non fare
- Non committare nulla da `private/` né dati personali (schede, diete, backup).
- Non dimenticare il bump di `VERSION` in `sw.js` quando cambia un file in cache.
- Non introdurre dipendenze o una build: l'app deve restare un sito statico che si pubblica copiando i file.

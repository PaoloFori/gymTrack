# GymTrack — guida per chi lavora sul codice

GymTrack è una **PWA statica** (nessun server, nessuna build, nessuna dipendenza a runtime) per telefono: tiene traccia di
allenamenti, diete e di un **avatar** che cresce con l'impegno. Tutto è in italiano. I dati stanno solo sul dispositivo
(localStorage + copie in IndexedDB). Va servita su HTTPS (GitHub Pages) per avere service worker e notifiche.

## Struttura del repository

Nessun bundler né moduli ES: ogni file in `js/` è uno **script classico** che condivide lo scope globale. L'ordine di
caricamento è quello degli `<script>` in `index.html` (le funzioni si chiamano a runtime, quindi conta solo che gli statement
di primo livello trovino ciò che usano). Il codice è formattato con **Prettier** (`.prettierrc`, `.prettierignore`).

`private/` è ignorata da git (JSON personali). `sw.js` elenca i file in cache. Il resto si trova con `ls`.

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
  solo, archiviata,              // solo = creata senza sessione; resta «corrente» finché non è archiviata o collegata a una sessione
  regole: { carne:{max}, rossa:{max}, pesce:{min}, tonno:{max}, uova:{min}, latt:{min}, legu:{min}, patate:{max}, libero:{n} },
  pref: "carne"|"pesce"|"indiff",  // preferenza: più carne, più pesce o indifferente (sempre dentro le regole)
  cook: { mode: "due"|"uno", dir: "sera"|"pranzo" },
  seed,                          // cambia a ogni «Rigenera» per variare il piano
  pasti: [ { id, nome, ora: "HH:MM"|"", on, piatti: [ { id, nome, varianti: [ { id, on, alimenti: [ { id, opzioni: [ { id, n, qt, u, on } ] } ] } ] } ] } ],
  plan:  [ 7 giorni × [ { t: nomePasto, h: orario, v: [ { n, qt, u, nota?, libero?, pronto?, tot? } ] } ] ],
  spesa: [ { k, n, cat, q, u, preso } ]
}
```
Una *variante* è un'alternativa completa del piatto; un *alimento* è una voce con più *opzioni* equivalenti (la prima è la prescritta). Il collegamento sta nella sessione
(`sessione.dietId`): la dieta è **corrente** se collegata alla sessione in corso, **passata** altrimenti; più sessioni possono puntare alla stessa.

- **Piano** (`makePlan`): per ogni giorno e pasto sceglie una variante (la meno usata) e per ogni alimento un'opzione con un punteggio: bonus per avvicinarsi ai minimi
  settimanali, esclusione al superamento dei massimi, penalità per ripetizioni e per lo stesso cibo due volte nel giorno. Con `cook.mode === "uno"` le coppie
  cena→pranzo del giorno dopo (`dir "sera"`) o pranzo→cena (`dir "pranzo"`) riusano lo stesso cereale/proteina/verdura quando il secondo pasto ha quell'opzione attiva,
  e il primo riceve la nota «cucina X in totale».
- **Pasti liberi**: `regole.libero.n` a settimana; `makePlan` mette «Pasto libero» (`libero: true`) a cena a partire dal sabato, fuori da conteggi e spesa.
- **Preferenza** (`pref`): bonus/penalità nel punteggio di `makePlan` per carne o pesce, senza superare le regole.
- **Spesa** (`makeSpesa`): somma per nome+unità e raggruppa per reparto (`DC`); la lista mostra cosa comprare con «N volte · quantità di ogni cottura» (`spesaTimes`, legge `plan`; `pronto` = già cucinato nel pasto prima, `tot` = quantità totale cucinata). Nessuna marca consigliata.
- **Orari e «Adesso»**: `mealTime(m)` (orario scelto o tipico per nome); `dayHTML` evidenzia nel giorno di oggi il pasto in corso (da 15 min prima a 90 dopo) o il prossimo.
- **Scheda madre** = sessione e/o dieta: `isSolo`/`isCurDiet`/`curDiets()` (model.js); la Home mostra anche le diete correnti senza sessione, lo storico delle Sessioni anche quelle archiviate senza sessione.
- **Promemoria** (`features/notify.js`, `S.notif`): acqua (litri, intervallo), pasti/spuntini della dieta corrente, allenamenti in ritardo (`trainMsg`). `notifTick()` ogni 30 s e al ritorno in primo piano; niente server, quindi solo con l'app aperta o appena in secondo piano.
- **Creazione dieta** (finestra `dieta`): `src` → `pasti` → `alim` (un pasto alla volta, `mi`) → `regole` (se il JSON non le ha le chiede, `RULEDEF`) → `pref` → `cucina`.

## JSON e IA

L'app **non legge PDF**: accetta solo JSON, perché la conversione da PDF/testo la fa un assistente IA su richiesta dell'utente. Per questo in `features/ai/prompts.js` ci sono
gli schemi (`SCHEMA_DIETA`, `SCHEMA_SESSIONE`) e i prompt (`promptConvertDieta`, `promptConvertSessione`, `promptGenDieta`, più `buildPrompt`/`mailText` per le schede).
`promptCard(id, etichetta, testo)` disegna il riquadro con il tasto «Copia il prompt» (`ACT["copy-ta"]`); `copyText()` copia negli appunti o lascia selezionato il testo.

Ogni risposta incollata passa da `parseLoose()` (estrae il primo `{…}` valido, anche tra testo o recinti markdown) e poi da `dietIngest` / `impIngest`.
Un JSON del tipo sbagliato viene rifiutato (`"gymtrack"` distingue `dieta` da `sessione`).

**Schede / sessione** (`"gymtrack": "sessione"`) — *Sessioni → Carica JSON*:

`rec` in secondi; `nome_en` (facoltativo) serve a trovare la GIF; `gruppo` è uno di `GR`. Dopo la lettura l'app chiede se è la scheda corrente; se no, chiede periodo e numero di
allenamenti e crea una sessione conclusa (`fatti`).

**Dieta** (`"gymtrack": "dieta"`) — *Dieta → Nuova dieta*:

Le chiavi di `regole` sono quelle di `optKeys()` (carne, rossa, pesce, tonno, uova, latt, legu, patate) più `libero`; `min`/`max` sono volte a settimana.

## Persistenza e cloud

- `saveApp()` → `saveLocal()` (localStorage, ultimi 400 allenamenti) + salvataggio cloud se `window.claude` espone lo storage dell'app (`mode = "cloud"`); altrimenti
  `scheduleSnap()` crea una copia al giorno in IndexedDB (7 giorni) e `autoRestoreIfEmpty()` recupera da lì se i dati principali sono spariti.
- Backup manuale: `exportBk()` / `importBk()` (JSON `{ v:2, S, LOG }`).
- Le GIF sono caricate da `raw.githubusercontent.com` (dataset hasaneyldrm/exercises-dataset) e messe in cache dal service worker.

## Avatar: gotcha

- L'**aura** (`auraSVG`) dipende solo dai boost settimanali (`aura`), non dalla forma; forma ed evoluzione dipendono dal progresso (`avState`, `stageOf`).
- Con `anim` le animazioni sono SMIL; restano ferme se l'utente ha «riduci movimento».
- Le immagini in `docs/avatar-*.png` si rigenerano con una pagina di prova che chiama `avatarSVG` per obiettivo/specie/progresso.


## Come provare le modifiche

Non ci sono test automatici. A mano: servire la cartella (`python3 -m http.server`) e aprirla in un browser. Per controlli rapidi si usa Chrome headless
(`--allow-file-access-from-files --screenshot`) con una pagina di prova che carica gli stessi `js/**/*.js` e prepara lo stato chiamando `act("nome-azione", {...})`.
La logica pura (`makePlan`, `dietFromJson`) si può eseguire anche in Node caricando i file in un contesto `vm` con uno stub di `window`/`document`.

## Cose da non fare
- Non committare nulla da `private/` né dati personali (schede, diete, backup).
- Non dimenticare il bump di `VERSION` in `sw.js` quando cambia un file in cache.
- Non introdurre dipendenze o una build: l'app deve restare un sito statico che si pubblica copiando i file.

/* Registri condivisi: ogni modulo vi registra le proprie schermate, azioni, finestre e gestori di eventi.
   VIEWS[nome]      = function () { return html }   schermata (view.name = nome)
   ACT["nome"]      = function (d, el, nome) {…}   azione dei bottoni con data-act="nome" (d = dataset)
   SHEETS[kind]     = { html(k), save(k)?, session? }   finestra modale (session: serve una sessione in corso)
   HOOKS.input/change.push(function (target, evento) { …; return true se gestito })   campi di input */
var VIEWS = {}; // VIEWS[view.name] = function () { return html } — schermate (usate da render())
var ACT = {};
var SHEETS = {};
var HOOKS = { input: [], change: [] };

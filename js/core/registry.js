/* Registri condivisi: ogni modulo vi registra le proprie azioni, finestre e gestori di eventi.
   ACT["nome"]      = function (d, el, nome) {…}   azione dei bottoni con data-act="nome" (d = dataset)
   SHEETS[kind]     = { html(k), save(k)?, session? }   finestra modale (session: serve una sessione in corso)
   HOOKS.input/change.push(function (target, evento) { …; return true se gestito })   campi di input */
var ACT = {};
var SHEETS = {};
var HOOKS = { input: [], change: [] };

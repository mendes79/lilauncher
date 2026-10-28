/* remote.js — entrada do controle remoto. Normaliza teclas da TV e do teclado do PC
 * para os mesmos nomes: Left/Right/Up/Down/Enter/Back/Red/Green/Yellow/Blue/Info/PlayPause. */
(function () {
  'use strict';
  var MAP_CODE = { // keyCodes da TV Samsung
    37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down', 13: 'Enter', 10009: 'Back',
    403: 'Red', 404: 'Green', 405: 'Yellow', 406: 'Blue', 457: 'Info', 10252: 'PlayPause'
  };
  var MAP_KEY = { // teclado do PC (simulador)
    ArrowLeft: 'Left', ArrowUp: 'Up', ArrowRight: 'Right', ArrowDown: 'Down',
    Enter: 'Enter', Backspace: 'Back', Escape: 'Back',
    r: 'Red', g: 'Green', y: 'Yellow', b: 'Blue', i: 'Info', ' ': 'PlayPause'
  };

  function name(e) {
    if (MAP_CODE[e.keyCode]) return MAP_CODE[e.keyCode];
    if (MAP_KEY[e.key]) return MAP_KEY[e.key];
    return null;
  }

  window.Remote = {
    onKey: function (handler) {
      document.addEventListener('keydown', function (e) {
        var n = name(e);
        if (!n) return; // teclas de letra não são mapeadas: digitação nativa segue livre
        // Campo de texto focado: não bloqueia (deixa o teclado/IME agir); só 'Back' é tratado.
        var el = document.activeElement;
        if (el && el.tagName === 'INPUT' && n !== 'Back') { handler(n, e); return; }
        e.preventDefault(); handler(n, e);
      });
    }
  };
})();

/* app.js — launcher v0.3 (fileira de capas hero + Entradas/Config + Todos os apps). */
(function () {
  'use strict';
  var OV_COLS = 8, SAVER_MS = 30000;
  var saverMs = SAVER_MS; // tempo do protetor de tela (ajustável no menu)
  var CITY = { name: 'Belo Horizonte', lat: -19.9167, lon: -43.9345 };
  var WALLS = (window.WALLS && window.WALLS.length) ? window.WALLS : ['img/wall-dawn.jpg', 'img/wall-aurora.jpg'];
  var SPEC = window.SPECIALS || {};

  var $ = function (s) { return document.querySelector(s); };
  var brand = window.APP_BRAND || {};
  // "Todos os apps": mostrar apps de verdade, nao componentes internos do sistema.
  // Regra: apps de loja (pacote de 10 chars) OU uma lista de pre-instalados conhecidos.
  var KNOWN = {
    'org.tizen.netflix-app': 1, 'org.tizen.primevideo': 1, 'org.tizen.globoplayapp': 1,
    'com.samsung.tv.aria-video': 1, 'org.tizen.browser': 1, 'com.samsung.tv.store': 1,
    'com.samsung.tv.gaminghub': 1, 'com.samsung.tv.gamehome': 1,
    'com.samsung.tv.cobalt-yt': 1, 'com.samsung.tv.cobalt-yttv': 1, 'com.samsung.tv.cobalt-ytkids': 1
  };
  function isUserApp(a) { return /^[A-Za-z0-9]{10}\./.test(a.id) || KNOWN[a.id] === 1; }
  var allApps = [], allAppsRaw = [], items = [], cards = [], focus = 0, shelfTx = 0, wallIdx = 0;
  var CAND_RX = /plus|volt|tvplus|mycontents|smarthub|samsung\.tv\.store|edenview/i;
  var ov = { open: false, kind: null, cells: [], focus: 0, list: [], ids: false };
  var saverT, saverOn = false;

  /* ---------- escala no PC ---------- */
  function fit() {
    if (!window.IS_SIMULATOR) { $('#stage').style.transform = 'none'; return; }
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    $('#stage').style.transform = 'scale(' + s + ')'; document.body.style.background = '#05070a';
  }
  window.addEventListener('resize', fit);

  /* ---------- papel de parede ---------- */
  function setWall(i) {
    wallIdx = (i + WALLS.length) % WALLS.length;
    $('#wall').src = WALLS[wallIdx];
    try { localStorage.setItem('launcher.wall', String(wallIdx)); } catch (e) {}
  }

  /* ---------- relógio / clima ---------- */
  function two(n) { return (n < 10 ? '0' : '') + n; }
  // Relógio travado no fuso do Brasil e em 24h, independentemente do ajuste da TV.
  // Se a TV não tiver a base de fusos, cai no horário local do sistema.
  var TZ = 'America/Sao_Paulo';
  function fmtTime(d) {
    try { return d.toLocaleTimeString('pt-BR', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return two(d.getHours()) + ':' + two(d.getMinutes()); }
  }
  function fmtDate(d, weekday, month) {
    try { return d.toLocaleDateString('pt-BR', { timeZone: TZ, weekday: weekday, day: 'numeric', month: month }); }
    catch (e) { return d.toLocaleDateString('pt-BR', { weekday: weekday, day: 'numeric', month: month }); }
  }
  function tick() {
    var d = new Date(), t = fmtTime(d);
    $('#time').textContent = t; $('#date').textContent = fmtDate(d, 'short', 'short');
    $('#s-time').textContent = t; $('#s-date').textContent = fmtDate(d, 'long', 'long');
  }
  // Ícones de clima em traço (SVG), estilo linha. currentColor = cor do texto.
  function wxIcon(code) {
    var cat = code === 0 ? 'sun' : code <= 2 ? 'partly' : code <= 44 ? 'cloud'
      : code <= 48 ? 'fog' : (code <= 67 || (code >= 80 && code <= 82)) ? 'rain'
      : code <= 77 ? 'snow' : 'thunder';
    var open = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">';
    var rays = '<path d="M24 4v5M24 39v5M4 24h5M39 24h5M10 10l3.5 3.5M34.5 34.5l3.5 3.5M38 10l-3.5 3.5M13.5 34.5L10 38"/>';
    var sun = '<circle cx="24" cy="24" r="8"/>' + rays;
    var cloud = '<path d="M15 32h17a6.5 6.5 0 0 0 .4-13 9.5 9.5 0 0 0-18.2 2.2A6 6 0 0 0 15 32z"/>';
    var cloudHi = '<path d="M15 28h17a6.5 6.5 0 0 0 .4-13 9.5 9.5 0 0 0-18.2 2.2A6 6 0 0 0 15 28z"/>';
    var smallSun = '<circle cx="17" cy="15" r="5"/><path d="M17 5v3M7 15h3M10 8l2 2M24 8l-2 2M17 23v1"/>';
    var icons = {
      sun: sun,
      partly: smallSun + '<path d="M20 34h13a6 6 0 0 0 .4-12 8.5 8.5 0 0 0-15.8 1.6A5.5 5.5 0 0 0 20 34z"/>',
      cloud: cloud,
      fog: cloudHi + '<path d="M12 34h16M14 39h18"/>',
      rain: cloudHi + '<path d="M18 33l-2 5M25 33l-2 5M32 33l-2 5"/>',
      snow: cloudHi + '<circle cx="18" cy="36" r="1.4" fill="currentColor" stroke="none"/><circle cx="25" cy="38" r="1.4" fill="currentColor" stroke="none"/><circle cx="32" cy="36" r="1.4" fill="currentColor" stroke="none"/>',
      thunder: cloudHi + '<path d="M26 32l-5 7h5l-3 6"/>'
    };
    return open + (icons[cat] || cloud) + '</svg>';
  }
  function showWx(c) {
    $('#weather').querySelector('.wx-ico').innerHTML = wxIcon(c.weather_code);
    $('#wx-temp').textContent = Math.round(c.temperature_2m) + '°';
    $('#wx-city').textContent = CITY.name;
  }
  function weather() {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + CITY.lat + '&longitude=' + CITY.lon + '&current=temperature_2m,weather_code&timezone=auto';
    if (typeof fetch !== 'function') { wxFallback(); return; }
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var tm = ctl ? setTimeout(function () { ctl.abort(); }, 7000) : null;
    fetch(url, ctl ? { signal: ctl.signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (d) { if (tm) clearTimeout(tm); if (d && d.current) showWx(d.current); else wxFallback(); })
      .catch(function () { if (tm) clearTimeout(tm); wxFallback(); });
  }
  // Se a busca falhar: na TV mostra só a cidade; no simulador (preview sem rede),
  // mostra um valor de demonstração para você ver o visual com ícone.
  function wxFallback() {
    if (window.IS_SIMULATOR) { showWx({ weather_code: 2, temperature_2m: 24 }); return; }
    $('#weather').querySelector('.wx-ico').innerHTML = ''; $('#wx-temp').textContent = ''; $('#wx-city').textContent = CITY.name;
  }

  /* ---------- logos ---------- */
  function iconSrc(p) { return /^(file|https?|data):/.test(p) ? p : 'file://' + p; }
  function letterLogo(a) {
    var b = brand[a.id];
    if (b) return '<div class="logo" style="color:' + b.bg + '">' + b.short + '</div>';
    return '<div class="logo">' + (a.name || '?').charAt(0).toUpperCase() + '</div>';
  }

  /* ---------- fileira (capas hero) ---------- */
  function buildItems() {
    items = [];
    (window.SHELF || []).forEach(function (a) { items.push({ type: 'app', app: a }); });
  }
  function itemHero(it) {
    if (it.type === 'app') return it.app.hero;
    return (SPEC[it.type] || SPEC.todos || {}).hero;
  }
  function itemName(it) {
    if (it.type === 'app') return it.app.name;
    return (SPEC[it.type] || SPEC.todos || {}).name || it.type;
  }
  function renderShelf() {
    var shelf = $('#shelf'); shelf.innerHTML = ''; cards = [];
    items.forEach(function (it) {
      var slot = document.createElement('div'); slot.className = 'slot' + (it.type !== 'app' ? ' special' : '');
      var hero = itemHero(it);
      var inner = hero ? '<img class="hero" src="' + hero + '" alt="">' : '<div class="logo">?</div>';
      slot.innerHTML = '<div class="card">' + inner + '</div><div class="cap">' + itemName(it) + '</div>';
      shelf.appendChild(slot); cards.push(slot);
    });
    setFocus(0);
  }
  function setFocus(i) {
    if (!cards.length) return;
    if (cards[focus]) cards[focus].classList.remove('focus');
    focus = Math.max(0, Math.min(cards.length - 1, i));
    cards[focus].classList.add('focus'); scrollShelf();
  }
  function scrollShelf() {
    var vw = 1920, pad = 72, el = cards[focus];
    var left = el.offsetLeft, right = left + el.offsetWidth, tx = shelfTx;
    if (left + tx < pad) tx = pad - left;
    if (right + tx > vw - pad) tx = vw - pad - right;
    shelfTx = tx; $('#shelf').style.transform = 'translateX(' + tx + 'px)';
  }
  // Tenta abrir um app por uma lista de ids (fallback). Sem toast de sucesso
  // (o app abre em tela cheia; o toast ficava "preso" e aparecia ao voltar).
  // Para cada id, tenta em sequência: launch() direto e depois app-control em
  // cada operação de "ops". Apps de serviço/ocultos recusam o direto, mas podem
  // aceitar o app-control. "ops" só é longo no TV Plus (demais apps: só default).
  var OPS_DEFAULT = ['http://tizen.org/appcontrol/operation/default'];
  function launchChain(ids, name, ops, rest) {
    ops = ops || OPS_DEFAULT;
    var steps = [], lastRest = null;
    ids.forEach(function (id) {
      steps.push(function (next) { TV.launch(id, function () {}, next); });
      ops.forEach(function (op) { steps.push(function (next) { TV.launchControlOp(id, op, function () {}, next); }); });
      // API REST local (fallback); guarda o erro p/ diagnóstico se tudo falhar.
      if (rest) steps.push(function (next) { TV.launchRest(id, function () {}, function (e) { lastRest = e; next(); }); });
    });
    var i = 0;
    (function tryNext() {
      if (i >= steps.length) {
        var extra = (rest && lastRest) ? ' [API local: ' + (lastRest.message || 'erro') + ']' : '';
        toast('Não foi possível abrir ' + name + extra);
        return;
      }
      steps[i++](tryNext);
    })();
  }
  function activate() {
    var it = items[focus];
    if (it.type !== 'app') return;
    if (it.app.url) {
      // Atalho de web: abre a pagina no navegador da TV.
      TV.openUrl(it.app.url, function () {}, function () { toast('Não foi possível abrir ' + it.app.name); });
    } else {
      launchChain([it.app.id].concat(it.app.alt || []), it.app.name, it.app.ops, it.app.rest);
    }
  }

  /* ---------- ícones do topo (Todos os apps / Configurações) ---------- */
  var zone = 'shelf', topFocus = 0, topEls = [];
  function openSettings() { openSettingsMenu(); }
  function setTop(i) {
    topFocus = Math.max(0, Math.min(topEls.length - 1, i));
    topEls.forEach(function (e, k) { e.classList.toggle('focus', k === topFocus); });
  }
  function enterTop() { if (cards[focus]) cards[focus].classList.remove('focus'); zone = 'top'; setTop(topFocus); }
  function leaveTop() { topEls.forEach(function (e) { e.classList.remove('focus'); }); zone = 'shelf'; setFocus(focus); }
  function activateTop() { topFocus === 0 ? openAllApps() : openSettingsMenu(); }

  /* ---------- overlay genérico ---------- */
  function renderOverlay(title, list) {
    $('#ov-title').textContent = title; $('#count').textContent = '(' + list.length + ')';
    var g = $('#grid-all'); g.innerHTML = ''; ov.cells = []; ov.list = list;
    list.forEach(function (a) {
      var d = document.createElement('div');
      var cand = ov.ids && (CAND_RX.test(a.id) || CAND_RX.test(a.name || ''));
      d.className = 'cell' + (cand ? ' cand' : '');
      var inner = a.hero ? '<img class="hero" src="' + a.hero + '" alt="">'
        : a.icon ? '<img class="logo-img" src="' + iconSrc(a.icon) + '" alt="">' : letterLogo(a);
      var cap;
      if (ov.ids) {
        var tag = (a.show === false) ? ' <span class="ocul">(oculto)</span>' : '';
        cap = '<div class="cap capid">' + (a.name || '') + tag + '<br><span class="idtxt">' + a.id + '</span></div>';
      } else {
        cap = '<div class="cap">' + (a.name || a.id) + '</div>';
      }
      d.innerHTML = inner + cap;
      g.appendChild(d); ov.cells.push(d);
    });
    ov.open = true; ov.focus = 0; $('#allapps').classList.remove('hidden'); ovFocus(0);
  }
  function openAllApps(showIds) {
    ov.kind = 'apps'; ov.ids = !!showIds;
    var byName = function (a, b) { return (a.name || '').localeCompare(b.name || '', 'pt-BR'); };
    var list;
    if (showIds) {
      // Lista CRUA: todos os apps que a TV retorna, inclusive ocultos (show:false).
      // Candidatos a TV Plus (plus/volt/…) vêm primeiro e destacados.
      list = allAppsRaw.slice().sort(function (a, b) {
        var ca = CAND_RX.test(a.id) || CAND_RX.test(a.name || '');
        var cb = CAND_RX.test(b.id) || CAND_RX.test(b.name || '');
        if (ca !== cb) return ca ? -1 : 1;
        return byName(a, b);
      });
    } else {
      list = allApps.slice().sort(byName);
    }
    renderOverlay(showIds ? 'IDs dos apps (lista crua, inclui ocultos)' : 'Todos os aplicativos', list);
  }
  function openSources() {
    ov.kind = 'sources'; ov.ids = false;
    var list = TV.getSources().map(function (s) { return { id: s.id, name: s.label, hero: (SPEC.entradas || {}).hero }; });
    renderOverlay('Entradas', list);
  }
  function closeOverlay() { ov.open = false; $('#allapps').classList.add('hidden'); }
  function ovFocus(i) {
    if (ov.cells[ov.focus]) ov.cells[ov.focus].classList.remove('focus');
    ov.focus = Math.max(0, Math.min(ov.cells.length - 1, i));
    var el = ov.cells[ov.focus]; if (el) { el.classList.add('focus'); el.scrollIntoView({ block: 'nearest' }); }
  }
  function ovActivate() {
    var a = ov.list[ov.focus]; if (!a) return;
    if (ov.kind === 'sources') { TV.switchSource(a.id, function () {}, function () { toast('Falha na entrada'); }); closeOverlay(); }
    else { launchChain([a.id].concat(a.alt || []), a.name); }
  }

  /* ---------- protetor de tela (rotação + transição) / toast / tema ---------- */
  var saverTimer = null, sbgCur = null, saverIdx = 0, SAVER_INTERVAL = 120000; // 120 s por imagem
  function resetIdle() { clearTimeout(saverT); if (saverOn) hideSaver(); saverT = setTimeout(showSaver, saverMs); }
  function applySaverWall(i) {
    var a = $('#sbg-a'), b = $('#sbg-b');
    var next = (sbgCur === a) ? b : a;
    next.src = WALLS[i];
    next.classList.remove('kb'); void next.offsetWidth; next.classList.add('kb'); // reinicia o zoom
    next.classList.add('show');
    if (sbgCur) sbgCur.classList.remove('show');
    sbgCur = next;
  }
  function nextSaverWall() { saverIdx = (saverIdx + 1) % WALLS.length; applySaverWall(saverIdx); }
  function showSaver() {
    if (cs.open) { resetIdle(); return; } // não cobre a busca de cidade (digitação)
    saverOn = true; $('#saver').classList.remove('hidden');
    sbgCur = null; saverIdx = wallIdx; applySaverWall(saverIdx);
    if (saverTimer) clearInterval(saverTimer);
    if (WALLS.length > 1) saverTimer = setInterval(nextSaverWall, SAVER_INTERVAL);
  }
  function hideSaver() {
    saverOn = false; $('#saver').classList.add('hidden');
    if (saverTimer) { clearInterval(saverTimer); saverTimer = null; }
    $('#sbg-a').classList.remove('show', 'kb'); $('#sbg-b').classList.remove('show', 'kb'); sbgCur = null;
  }
  var toastT; function toast(m) { var e = $('#toast'); e.textContent = m; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove('show'); }, 1700); }

  /* ---------- tema (modo escuro / claro / automático) ---------- */
  function isDayTime() {
    var h;
    try { h = parseInt(new Date().toLocaleTimeString('en-GB', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit' }).slice(0, 2), 10); }
    catch (e) { h = new Date().getHours(); }
    return h >= 6 && h < 18;
  }
  function applyTheme(mode) {
    var light = mode === 'light' || (mode === 'auto' && isDayTime());
    if (light) document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
  }
  function getThemeMode() { try { return localStorage.getItem('launcher.thememode') || 'dark'; } catch (e) { return 'dark'; } }
  function setThemeMode(m) { try { localStorage.setItem('launcher.thememode', m); } catch (e) {} applyTheme(m); }
  function cycleTheme() { var modes = ['dark', 'light', 'auto'], i = modes.indexOf(getThemeMode()); setThemeMode(modes[(i + 1) % 3]); }

  /* ---------- menu de configurações (navegável pelo controle) ---------- */
  var SAVER_OPTS = [{ v: 30000, t: '30 s' }, { v: 60000, t: '1 min' }, { v: 180000, t: '3 min' }, { v: 300000, t: '5 min' }, { v: 600000, t: '10 min' }];
  var THEME_OPTS = [{ v: 'dark', t: 'Escuro' }, { v: 'light', t: 'Claro' }, { v: 'auto', t: 'Automático' }];
  var se = { open: false, focus: 0, rows: ['tema', 'cidade', 'wall', 'saver', 'tv', 'diag'] };
  function setSaverMs(ms) { saverMs = ms; try { localStorage.setItem('launcher.saverms', String(ms)); } catch (e) {} }
  function optText(opts, v) { for (var i = 0; i < opts.length; i++) if (opts[i].v === v) return opts[i].t; return opts[0].t; }
  function seValue(key) {
    if (key === 'tema') return optText(THEME_OPTS, getThemeMode());
    if (key === 'wall') return (wallIdx + 1) + ' / ' + WALLS.length;
    if (key === 'saver') return optText(SAVER_OPTS, saverMs);
    return '';
  }
  function seLabel(key) {
    return key === 'tema' ? 'Tema' : key === 'cidade' ? 'Cidade do clima'
      : key === 'wall' ? 'Papel de parede'
      : key === 'saver' ? 'Protetor de tela' : key === 'diag' ? 'IDs dos apps (diagnóstico)'
      : 'Configurações da TV';
  }
  function seRender() {
    var box = $('#set-list'); box.innerHTML = '';
    se.rows.forEach(function (key, i) {
      var row = document.createElement('div');
      row.className = 'set-row' + (key === 'tv' || key === 'diag' ? ' action' : '') + (i === se.focus ? ' focus' : '');
      var valHtml;
      if (key === 'tv') valHtml = '<span class="val">Abrir <span class="arw">›</span></span>';
      else if (key === 'cidade') valHtml = '<span class="val">' + CITY.name + ' <span class="arw">›</span></span>';
      else if (key === 'diag') valHtml = '<span class="val">Ver <span class="arw">›</span></span>';
      else if (key === 'wall') valHtml = '<span class="val"><img class="wp-thumb" src="' + WALLS[wallIdx] + '" alt="">' + (wallIdx + 1) + ' / ' + WALLS.length + '<span class="arw">›</span></span>';
      else valHtml = '<span class="val"><span class="arw">‹</span>' + seValue(key) + '<span class="arw">›</span></span>';
      row.innerHTML = '<span class="lbl">' + seLabel(key) + '</span>' + valHtml;
      box.appendChild(row);
    });
  }
  function openSettingsMenu() { se.open = true; se.focus = 0; $('#settings').classList.remove('hidden'); seRender(); }
  function closeSettingsMenu() { se.open = false; $('#settings').classList.add('hidden'); }
  function seFocusMove(d) { se.focus = Math.max(0, Math.min(se.rows.length - 1, se.focus + d)); seRender(); }
  function seChange(dir) {
    var key = se.rows[se.focus];
    if (key === 'tema') { var m = ['dark', 'light', 'auto'], i = (m.indexOf(getThemeMode()) + dir + 3) % 3; setThemeMode(m[i]); }
    else if (key === 'wall') { setWall(wallIdx + dir); }
    else if (key === 'saver') { var o = SAVER_OPTS.map(function (x) { return x.v; }), j = (o.indexOf(saverMs) + dir + o.length) % o.length; setSaverMs(o[j]); }
    seRender();
  }
  function seActivate() {
    var key = se.rows[se.focus];
    if (key === 'tv') { closeSettingsMenu(); TV.openSettings(function () { toast('Abrindo configurações da TV'); }, function () { toast('Não foi possível abrir as configurações'); }); }
    else if (key === 'diag') { closeSettingsMenu(); openAllApps(true); }
    else if (key === 'cidade') { openCitySearch(); }
    else if (key === 'wall') { openWallPicker(); }
    else { seChange(1); }
  }

  /* ---------- seletor visual de papel de parede ---------- */
  var wp = { open: false, focus: 0, cells: [], prev: 0, tx: 0 };
  function openWallPicker() {
    wp.open = true; wp.prev = wallIdx; wp.tx = 0;
    var strip = $('#wp-strip'); strip.innerHTML = ''; wp.cells = [];
    WALLS.forEach(function (u) {
      var d = document.createElement('img'); d.className = 'wp-thumb-item'; d.src = u;
      strip.appendChild(d); wp.cells.push(d);
    });
    if (se.open) $('#settings').classList.add('hidden'); // esconde o menu para ver a imagem cheia
    $('#shelf-wrap').style.visibility = 'hidden'; $('#hint').style.visibility = 'hidden';
    $('#wallpicker').classList.remove('hidden');
    wpFocus(wallIdx);
  }
  function wpFocus(i) {
    if (wp.cells[wp.focus]) wp.cells[wp.focus].classList.remove('focus');
    wp.focus = Math.max(0, Math.min(wp.cells.length - 1, i));
    wp.cells[wp.focus].classList.add('focus');
    setWall(wp.focus); // pré-visualiza em tela cheia ao fundo
    var vw = 1920, pad = 72, el = wp.cells[wp.focus], left = el.offsetLeft, right = left + el.offsetWidth, tx = wp.tx;
    if (left + tx < pad) tx = pad - left;
    if (right + tx > vw - pad) tx = vw - pad - right;
    wp.tx = tx; $('#wp-strip').style.transform = 'translateX(' + tx + 'px)';
  }
  function closeWallPicker(apply) {
    wp.open = false; $('#wallpicker').classList.add('hidden');
    $('#shelf-wrap').style.visibility = ''; $('#hint').style.visibility = '';
    if (apply) {
      // OK: mantém o papel escolhido e volta direto ao launcher (fecha o menu).
      if (se.open) closeSettingsMenu();
    } else {
      // Voltar: cancela, restaura o papel anterior e reabre o menu de config.
      setWall(wp.prev);
      if (se.open) { $('#settings').classList.remove('hidden'); seRender(); }
    }
  }

  /* ---------- busca de cidade (clima) ---------- */
  function fetchJson(url, cb) {
    if (typeof fetch !== 'function') { cb(new Error('sem fetch')); return; }
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var tm = ctl ? setTimeout(function () { ctl.abort(); }, 7000) : null;
    fetch(url, ctl ? { signal: ctl.signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (d) { if (tm) clearTimeout(tm); cb(null, d); })
      .catch(function (e) { if (tm) clearTimeout(tm); cb(e); });
  }
  function loadSavedCity() {
    try { var s = localStorage.getItem('launcher.city'); if (s) { var c = JSON.parse(s); if (c && c.name && typeof c.lat === 'number') return c; } } catch (e) {}
    return null;
  }
  function saveCity(c) {
    CITY = c;
    try { localStorage.setItem('launcher.city', JSON.stringify(c)); } catch (e) {}
    weather(); // reconsulta o clima já na nova cidade
  }
  var cs = { open: false, results: [], focus: -1 };
  function cityInputEl() { return $('#city-input'); }
  function cityStatus(t) { $('#city-status').textContent = t || ''; }
  function openCitySearch() {
    cs.open = true; cs.results = []; cs.focus = -1;
    if (se.open) $('#settings').classList.add('hidden');
    $('#citysearch').classList.remove('hidden');
    var inp = cityInputEl(); inp.value = ''; cityStatus('Digite a cidade e tecle OK.'); $('#city-results').innerHTML = '';
    setTimeout(function () { try { inp.focus(); } catch (e) {} }, 40); // foco abre o teclado da TV
  }
  function closeCitySearch() {
    cs.open = false; $('#citysearch').classList.add('hidden');
    try { cityInputEl().blur(); } catch (e) {}
    if (se.open) { $('#settings').classList.remove('hidden'); seRender(); }
  }
  // No simulador (PC sem rede p/ a API), devolve exemplos para testar a interface.
  function mockGeo(q) {
    return [
      { name: q || 'Cidade', latitude: -19.92, longitude: -43.94, country: 'Brasil', admin1: 'Minas Gerais' },
      { name: (q || 'Cidade') + ' 2', latitude: -23.55, longitude: -46.63, country: 'Brasil', admin1: 'São Paulo' }
    ];
  }
  function geocode(q) {
    q = (q || '').trim(); if (!q) { cityStatus('Digite o nome da cidade.'); return; }
    cityStatus('Buscando "' + q + '"…');
    var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=6&language=pt&format=json';
    fetchJson(url, function (err, d) {
      if (err || !d || !d.results || !d.results.length) {
        if (window.IS_SIMULATOR) { renderCityResults(mockGeo(q)); return; }
        cs.results = []; cs.focus = -1; $('#city-results').innerHTML = ''; cityStatus('Nada encontrado para "' + q + '".'); return;
      }
      renderCityResults(d.results);
    });
  }
  function renderCityResults(list) {
    cs.results = list.map(function (r) {
      return { name: r.name, lat: r.latitude, lon: r.longitude, sub: [r.admin1, r.country].filter(Boolean).join(', ') };
    });
    var box = $('#city-results'); box.innerHTML = '';
    cs.results.forEach(function (c) {
      var d = document.createElement('div'); d.className = 'city-row';
      d.innerHTML = c.name + '<span class="sub">' + (c.sub || '') + '</span>';
      box.appendChild(d);
    });
    cs.focus = -1; // foco segue no campo; usuário desce (▼) para escolher
    cityStatus(cs.results.length + ' resultado(s) — ▼ para escolher, OK para aplicar.');
  }
  function csFocus(i) {
    var rows = $('#city-results').children; if (!rows.length) return;
    if (cs.focus >= 0 && rows[cs.focus]) rows[cs.focus].classList.remove('focus');
    cs.focus = Math.max(0, Math.min(rows.length - 1, i));
    rows[cs.focus].classList.add('focus');
    try { cityInputEl().blur(); } catch (e) {}
  }
  function csFocusInput() {
    var rows = $('#city-results').children;
    if (cs.focus >= 0 && rows[cs.focus]) rows[cs.focus].classList.remove('focus');
    cs.focus = -1; try { cityInputEl().focus(); } catch (e) {}
  }
  function csSelect() {
    if (cs.focus < 0 || !cs.results[cs.focus]) return;
    var c = cs.results[cs.focus];
    saveCity({ name: c.name, lat: c.lat, lon: c.lon });
    closeCitySearch(); toast('Cidade do clima: ' + c.name);
  }

  /* ---------- init ---------- */
  function init() {
    applyTheme(getThemeMode());
    var savedCity = loadSavedCity(); if (savedCity) CITY = savedCity; // cidade escolhida pelo usuário
    try { var sm = parseInt(localStorage.getItem('launcher.saverms'), 10); if (!isNaN(sm)) saverMs = sm; } catch (e) {}
    var w; try { w = parseInt(localStorage.getItem('launcher.wall'), 10); } catch (e) {}
    setWall(isNaN(w) ? 0 : w);
    fit(); tick(); setInterval(tick, 10000); weather(); setInterval(weather, 600000);
    setInterval(function () { if (getThemeMode() === 'auto') applyTheme('auto'); }, 60000); // reavalia tema automático
    $('#mode').textContent = TV.isSimulator() ? 'SIMULADOR' : 'Tizen ' + TV.platform();

    topEls = [$('#btn-apps'), $('#btn-config')];
    $('#btn-apps').addEventListener('click', function () { openAllApps(); });
    $('#btn-config').addEventListener('click', function () { openSettingsMenu(); });
    // Teclado da TV: ao concluir a digitação (botão "OK/Concluir" do teclado), busca.
    cityInputEl().addEventListener('change', function () { if (cs.open) geocode(this.value); });
    buildItems(); renderShelf();   // fileira fixa não depende da TV
    TV.getApps(function (err, list) {
      allAppsRaw = list || []; // tudo que a TV retorna (inclui ocultos) — para o diagnóstico
      allApps = allAppsRaw.filter(function (a) { return a.show && isUserApp(a); });
    });

    resetIdle();
    Remote.onKey(function (k) {
      if (saverOn) { resetIdle(); return; }
      resetIdle();
      if (cs.open) {
        var typing = (document.activeElement === cityInputEl());
        switch (k) {
          case 'Back': closeCitySearch(); break;
          case 'Enter': if (typing) geocode(cityInputEl().value); else csSelect(); break;
          case 'Down': if (typing) { if (cs.results.length) csFocus(0); } else csFocus(cs.focus + 1); break;
          case 'Up': if (!typing) { if (cs.focus <= 0) csFocusInput(); else csFocus(cs.focus - 1); } break;
        }
        return;
      }
      if (wp.open) {
        switch (k) {
          case 'Left': wpFocus(wp.focus - 1); break;
          case 'Right': wpFocus(wp.focus + 1); break;
          case 'Enter': closeWallPicker(true); break;
          case 'Back': closeWallPicker(false); break;
        }
        return;
      }
      if (se.open) {
        switch (k) {
          case 'Up': seFocusMove(-1); break;
          case 'Down': seFocusMove(1); break;
          case 'Left': seChange(-1); break;
          case 'Right': seChange(1); break;
          case 'Enter': seActivate(); break;
          case 'Back': closeSettingsMenu(); break;
        }
        return;
      }
      if (ov.open) {
        switch (k) {
          case 'Left': ovFocus(ov.focus - 1); break;
          case 'Right': ovFocus(ov.focus + 1); break;
          case 'Up': ovFocus(ov.focus - OV_COLS); break;
          case 'Down': ovFocus(ov.focus + OV_COLS); break;
          case 'Enter': ovActivate(); break;
          case 'Back': closeOverlay(); break;
        }
        return;
      }
      if (zone === 'top') {
        switch (k) {
          case 'Left': setTop(topFocus - 1); break;
          case 'Right': setTop(topFocus + 1); break;
          case 'Down': leaveTop(); break;
          case 'Enter': activateTop(); break;
          case 'Blue': cycleTheme(); break;
          case 'Green': setWall(wallIdx + 1); break;
        }
        return;
      }
      switch (k) {
        case 'Left': setFocus(focus - 1); break;
        case 'Right': setFocus(focus + 1); break;
        case 'Up': enterTop(); break;
        case 'Enter': activate(); break;
        case 'Blue': cycleTheme(); break;
        case 'Green': setWall(wallIdx + 1); break;
        case 'Back': if (!TV.isSimulator()) TV.exit(); break;
      }
    });
    if (window.IS_SIMULATOR) document.addEventListener('mousemove', resetIdle);
    // Ao sair para um app (página oculta), limpa o toast para não aparecer "preso" na volta.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearTimeout(toastT); $('#toast').classList.remove('show'); }
      else {
        // App residente (background-support=enable): ao voltar, atualiza o
        // relógio na hora, reavalia tema automático e reinicia o ocioso.
        tick();
        if (getThemeMode() === 'auto') applyTheme('auto');
        resetIdle();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

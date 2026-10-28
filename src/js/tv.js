/* tv.js — camada única de acesso à TV. Igual no PC (via shim) e na TV real. */
(function () {
  'use strict';
  var TV = {};
  TV.isSimulator = function () { return !!window.IS_SIMULATOR; };

  TV.getApps = function (cb) {
    try {
      tizen.application.getAppsInfo(function (list) {
        cb(null, list.map(function (a) {
          return { id: a.id, name: a.name || a.id, pkg: a.packageId, icon: a.iconPath || '', show: a.show !== false };
        }));
      }, function (e) { cb(e, null); });
    } catch (e) { cb(e, null); }
  };

  TV.launch = function (id, ok, err) { try { tizen.application.launch(id, ok, err); } catch (e) { err && err(e); } };

  // Abre uma pagina no navegador da TV (operacao "view" do app-control).
  // Tenta o navegador explicito e, se falhar, deixa o sistema escolher.
  TV.openUrl = function (url, ok, err) {
    if (window.IS_SIMULATOR) { ok && ok(); return; }
    var VIEW = 'http://tizen.org/appcontrol/operation/view';
    function tryOpen(appId, next) {
      try {
        var ac = new tizen.ApplicationControl(VIEW, url, null, null, []);
        tizen.application.launchAppControl(ac, appId, function () { ok && ok(); }, next);
      } catch (e) { next(e); }
    }
    tryOpen('org.tizen.browser', function () { tryOpen(null, function (e) { err && err(e); }); });
  };

  // Abre um app via app-control com uma operação específica e appId explícito.
  // É o mecanismo oficial p/ apps de serviço/ocultos (ex.: Samsung TV Plus
  // "Deeplinker") que recusam o launch() direto. No simulador, só confirma.
  TV.launchControlOp = function (id, op, ok, err) {
    if (window.IS_SIMULATOR) { ok && ok(); return; }
    try {
      var ac = new tizen.ApplicationControl(op, null, null, null, []);
      tizen.application.launchAppControl(ac, id, function () { ok && ok(); }, function (e) { err && err(e); }, null);
    } catch (e) { err && err(e); }
  };
  // Atalho: app-control com a operação "default".
  TV.launchControl = function (id, ok, err) {
    TV.launchControlOp(id, 'http://tizen.org/appcontrol/operation/default', ok, err);
  };

  // Abre um app via API REST local da TV (a mesma do controle do celular/Smart Hub).
  // POST http://127.0.0.1:8001/api/v2/applications/<id>. Tem privilégio diferente
  // do app-control, então pode abrir apps de sistema (ex.: TV Plus) que recusam o
  // app-control. Exige o controle por IP/rede ativo na TV. No simulador, só confirma.
  TV.launchRest = function (id, ok, err) {
    if (window.IS_SIMULATOR) { ok && ok(); return; }
    try {
      var x = new XMLHttpRequest();
      x.timeout = 5000;
      x.open('POST', 'http://127.0.0.1:8001/api/v2/applications/' + encodeURIComponent(id));
      x.onload = function () {
        if (x.status >= 200 && x.status < 300) { ok && ok(); }
        else { err && err(new Error('REST ' + x.status)); }
      };
      x.onerror = x.ontimeout = function () { err && err(new Error('REST inacessível')); };
      x.send();
    } catch (e) { err && err(e); }
  };

  // Abre as Configurações nativas da TV via operação oficial do Tizen (app-control "setting").
  // Funciona em Tizen 3+; na TV de Luís (6.5) deve abrir. No simulador, só confirma.
  TV.openSettings = function (ok, err) {
    if (window.IS_SIMULATOR) { ok && ok(); return; }
    function fallbackMenu() {
      // Plano B: abrir o menu do sistema (como faz o free-my-tv quando a operação falha).
      try { tizen.application.launch('org.tizen.menu', function () { ok && ok(); }, function (e) { err && err(e); }); }
      catch (e) { err && err(e); }
    }
    try {
      var c = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/setting', null, null, null, []);
      tizen.application.launchAppControl(c, null, function () { ok && ok(); }, fallbackMenu);
    } catch (e) { fallbackMenu(); }
  };
  TV.exit = function () { try { tizen.application.getCurrentApplication().exit(); } catch (e) {} };
  TV.platform = function () { try { return tizen.systeminfo.getCapability('http://tizen.org/feature/platform.version'); } catch (e) { return '?'; } };

  // Entradas HDMI. No simulador, lista de exemplo. Na TV, a leitura/troca real
  // será validada no on-device (APIs de fonte externa têm restrições no Tizen).
  TV.getSources = function () { return window.SOURCES_SAMPLE || []; };
  TV.switchSource = function (id, ok, err) {
    if (window.IS_SIMULATOR) { ok && ok(); return; }
    try { /* on-device: a definir após validação */ ok && ok(); } catch (e) { err && err(e); }
  };

  window.TV = TV;
})();

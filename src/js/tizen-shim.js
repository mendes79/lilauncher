/* tizen-shim.js — SIMULADOR da TV para rodar o launcher no navegador do PC.
 * Só entra em ação quando NÃO há a API `tizen` (fora da TV). Na TV fica inerte. */
(function () {
  'use strict';
  window.IS_SIMULATOR = (typeof window.tizen === 'undefined');
  if (!window.IS_SIMULATOR) return;

  var sample = (window.APPS_SAMPLE || []).map(function (a) {
    return { id: a.id, name: a.name, packageId: a.pkg, show: a.show,
             iconPath: '', categories: [], version: '1.0' };
  });

  window.tizen = {
    application: {
      getAppsInfo: function (ok) { setTimeout(function () { ok(sample.slice()); }, 200); },
      getAppInfo: function (id) { return sample.filter(function (a) { return a.id === id; })[0] || null; },
      launch: function (id, ok) { setTimeout(function () { ok && ok(); }, 100); },
      getCurrentApplication: function () {
        return { appInfo: { id: 'LMlauncher.Home' }, exit: function () { console.log('[sim] exit()'); },
                 hide: function () { console.log('[sim] hide()'); } };
      }
    },
    tvinputdevice: {
      getSupportedKeys: function () { return [{ name: 'ColorF0Red', code: 403 }, { name: 'ColorF1Green', code: 404 }, { name: 'ColorF3Blue', code: 406 }]; },
      registerKey: function () {}, unregisterKey: function () {}
    },
    systeminfo: { getCapability: function (k) { return k.indexOf('platform.version') >= 0 ? '6.5 (sim)' : null; } }
  };
  // Entradas HDMI de exemplo (na TV, a leitura real será validada no on-device).
  window.SOURCES_SAMPLE = [{ id: 'HDMI1', label: 'HDMI 1' }, { id: 'HDMI2', label: 'HDMI 2' }, { id: 'HDMI3', label: 'HDMI 3' }];
  console.log('[sim] Simulador ativo — ' + sample.length + ' apps.');
})();

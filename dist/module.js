'use strict';

System.register(['./worldmap_ctrl', 'app/plugins/sdk'], function (_export, _context) {
  var WorldmapCtrl, loadPluginCss;
  return {
    setters: [function (_worldmap_ctrl) {
      WorldmapCtrl = _worldmap_ctrl.WorldmapCtrl;
    }, function (_appPluginsSdk) {
      loadPluginCss = _appPluginsSdk.loadPluginCss;
    }],
    execute: function () {

      loadPluginCss({
        dark: 'plugins/grafana-worldmap-panel/css/worldmap.dark.css',
        light: 'plugins/grafana-worldmap-panel/css/worldmap.light.css'
      });

      _export('PanelCtrl', WorldmapCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map

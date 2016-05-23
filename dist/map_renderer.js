'use strict';

System.register(['./css/leaflet.css!', './worldmap'], function (_export, _context) {
  "use strict";

  var WorldMap;
  function link(scope, elem, attrs, ctrl) {
    var mapContainer = elem.find('.mapcontainer');

    ctrl.events.on('render', function () {
      render();
      ctrl.renderingCompleted();
    });

    function render() {
      if (!ctrl.data) return;

      if (!ctrl.map) {
        ctrl.map = new WorldMap(ctrl, mapContainer[0]);
      }

      ctrl.map.resize();

      if (ctrl.mapCenterMoved) ctrl.map.panToMapCenter();

      if (!ctrl.map.legend && ctrl.panel.showLegend) ctrl.map.createLegend();

      ctrl.map.drawCircles();
    }
  }

  _export('default', link);

  return {
    setters: [function (_cssLeafletCss) {}, function (_worldmap) {
      WorldMap = _worldmap.default;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=map_renderer.js.map

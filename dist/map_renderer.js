'use strict';

System.register(['lodash', './leaflet'], function (_export, _context) {
  var _, L;

  function link(scope, elem, attrs, ctrl) {
    ctrl.events.on('render', function () {
      render();
      ctrl.renderingCompleted();
    });

    function render() {
      if (!ctrl.data) {
        return;
      }

      if (!ctrl.map) {
        createMap();
      }

      resize();

      if (ctrl.mapCenterMoved) {
        ctrl.panToMapCenter();
        ctrl.mapCenterMoved = false;
      }

      if (ctrl.circles) {
        ctrl.circles.eachLayer(function (layer) {
          if (layer._container) ctrl.circles.removeLayer(layer);
        });
      }

      ctrl.circles = [];
      drawCircles();
    }

    function createMap() {
      ctrl.map = window.L.map('mapid_' + ctrl.panel.id, { worldCopyJump: true, center: [ctrl.panel.mapCenterLatitude, ctrl.panel.mapCenterLongitude] }).fitWorld().zoomIn(ctrl.panel.initialZoom);

      var selectedTileServer = ctrl.panel.tileServers[ctrl.panel.tileServer];
      window.L.tileLayer(selectedTileServer.url, {
        maxZoom: 18,
        subdomains: selectedTileServer.subdomains,
        reuseTiles: true,
        detectRetina: true,
        attribution: selectedTileServer.attribution
      }).addTo(ctrl.map);

      drawCircles();
    }

    function drawCircles() {
      var circles = [];
      ctrl.data.forEach(function (dataPoint) {
        var location = _.find(ctrl.locations, function (loc) {
          return loc.key === dataPoint.key;
        });

        if (!location) return;

        var circle = window.L.circleMarker([location.latitude, location.longitude], {
          radius: Math.min(10, Math.max(1, (dataPoint.value || 0) * ctrl.panel.circleSize)),
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0.5
        });

        circle.bindPopup(location.name + ': ' + dataPoint.valueRounded);
        circles.push(circle);
      });
      ctrl.circles = window.L.layerGroup(circles).addTo(ctrl.map);
    }

    function resize() {
      if (ctrl.map) ctrl.map.invalidateSize();
    }
  }

  _export('default', link);

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_leaflet) {
      L = _leaflet.default;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=map_renderer.js.map

'use strict';

System.register(['lodash', './leaflet'], function (_export, _context) {
  var _, L;

  function link(scope, elem, attrs, ctrl) {
    ctrl.events.on('render', function () {
      render();
      ctrl.renderingCompleted();
    });

    function render() {
      if (!ctrl.data) return;

      if (!ctrl.map) createMap();
      resize();

      if (ctrl.mapCenterMoved) panToMapCenter();

      if (!ctrl.legend) createLegend();

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
    }

    function createLegend() {
      ctrl.legend = window.L.control({ position: 'bottomleft' });
      ctrl.legend.onAdd = function () {
        ctrl.legend._div = window.L.DomUtil.create('div', 'info legend');
        ctrl.legend.update();
        return ctrl.legend._div;
      };

      ctrl.legend.update = function () {
        var thresholds = ctrl.data.thresholds;
        var legendHtml = '';
        legendHtml += '<i style="background:' + ctrl.panel.colors[0] + '"></i> ' + '&lt; ' + thresholds[0] + '<br>';
        for (var index = 0; index < thresholds.length; index++) {
          legendHtml += '<i style="background:' + getColor(thresholds[index] + 1) + '"></i> ' + thresholds[index] + (thresholds[index + 1] ? '&ndash;' + thresholds[index + 1] + '<br>' : '+');
        }
        ctrl.legend._div.innerHTML = legendHtml;
      };

      ctrl.legend.addTo(ctrl.map);
    }

    function getColor(value) {
      for (var index = ctrl.data.thresholds.length; index > 0; index--) {
        if (value >= ctrl.data.thresholds[index - 1]) {
          return ctrl.panel.colors[index];
        }
      }
      return _.first(ctrl.panel.colors);
    }

    function drawCircles() {
      if (ctrl.circles) {
        ctrl.circles.eachLayer(function (layer) {
          if (layer._container) ctrl.circles.removeLayer(layer);
        });
      }

      ctrl.circles = [];

      var circles = [];
      ctrl.data.forEach(function (dataPoint) {
        var location = _.find(ctrl.locations, function (loc) {
          return loc.key === dataPoint.key;
        });

        if (!location) return;

        var circle = window.L.circleMarker([location.latitude, location.longitude], {
          radius: Math.min(30, Math.max(2, (dataPoint.value || 0) * ctrl.panel.circleSize)),
          color: getColor(dataPoint.value),
          fillColor: getColor(dataPoint.value),
          fillOpacity: 0.5
        });

        if (dataPoint.value || dataPoint.value === 0) {
          circle.bindPopup(location.name + ': ' + dataPoint.valueRounded);
        } else {
          circle.bindPopup(location.name + ': No data');
        }

        circles.push(circle);
      });
      ctrl.circles = window.L.layerGroup(circles).addTo(ctrl.map);
    }

    function resize() {
      if (ctrl.map) ctrl.map.invalidateSize();
    }

    function panToMapCenter() {
      ctrl.map.panTo([ctrl.panel.mapCenterLatitude, ctrl.panel.mapCenterLongitude]);
      ctrl.mapCenterMoved = false;
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

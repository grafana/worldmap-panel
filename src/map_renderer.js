import _ from 'lodash';
import L from './leaflet';

export default function link(scope, elem, attrs, ctrl) {
  ctrl.events.on('render', () => {
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
      ctrl.circles.eachLayer(layer => {
        if (layer._container) ctrl.circles.removeLayer(layer);
      });
    }

    ctrl.circles = [];
    drawCircles();
  }

  function createMap() {
    ctrl.map = window.L.map('mapid_' + ctrl.panel.id, {worldCopyJump: true, center: [ctrl.panel.mapCenterLatitude, ctrl.panel.mapCenterLongitude]})
      .fitWorld()
      .zoomIn(ctrl.panel.initialZoom);

    const selectedTileServer = ctrl.panel.tileServers[ctrl.panel.tileServer];
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
    const circles = [];
    ctrl.data.forEach(dataPoint => {
      const location = _.find(ctrl.locations, (loc) => { return loc.key === dataPoint.key; });

      if (!location) return;

      const circle = window.L.circleMarker([location.latitude, location.longitude], {
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

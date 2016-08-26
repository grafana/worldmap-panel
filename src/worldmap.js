import _ from 'lodash';
/* eslint-disable id-length, no-unused-vars */
import L from './leaflet';
import './leaflet-heat';
/* eslint-disable id-length, no-unused-vars */

const tileServers = {
  'CartoDB Positron': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd'},
  'CartoDB Dark': {url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd'}
};

export default class WorldMap {
  constructor(ctrl, mapContainer) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.createMap();
    this.circles = {};
    this.heatData = [];
  }

  createMap() {
    const mapCenter = window.L.latLng(parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude));
    this.map = window.L.map(this.mapContainer, {worldCopyJump: true, center: mapCenter})
      .fitWorld()
      .zoomIn(parseInt(this.ctrl.panel.initialZoom, 10));
    this.map.panTo(mapCenter);

    const selectedTileServer = tileServers[this.ctrl.tileServer];
    window.L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution
    }).addTo(this.map);
  }

  createLegend() {
    this.legend = window.L.control({position: 'bottomleft'});
    this.legend.onAdd = () => {
      this.legend._div = window.L.DomUtil.create('div', 'info legend');
      this.legend.update();
      return this.legend._div;
    };

    this.legend.update = () => {
      const thresholds = this.ctrl.data.thresholds;
      let legendHtml = '';
      legendHtml += '<i style="background:' + this.ctrl.panel.colors[0] + '"></i> ' +
          '&lt; ' + thresholds[0] + '<br>';
      for (let index = 0; index < thresholds.length; index++) {
        legendHtml +=
          '<i style="background:' + this.getColor(thresholds[index] + 1) + '"></i> ' +
          thresholds[index] + (thresholds[index + 1] ? '&ndash;' + thresholds[index + 1] + '<br>' : '+');
      }
      this.legend._div.innerHTML = legendHtml;
    };
    this.legend.addTo(this.map);
  }


  drawOverlay() {
    switch (this.ctrl.data.mapType) {
      case "circle":
        this.clearHeat();
        this.drawCircles();
        break;
      case "heat":
        this.clearCircles();
        this.drawHeat();
        break;
      default:
        break;
    }
  }

  needToRedrawCircles() {
    let nCirc = _.size(this.circles);
    if (nCirc === 0 && this.ctrl.data.length > 0) return true;
    if (nCirc !== this.ctrl.data.length) return true;
    const locations = new Set(_.map(_.map(this.circles, 'options'), 'location'));
    const dataPoints = new Set(_.map(this.ctrl.data, 'key'));
    return !_.isEqual(locations, dataPoints);
  }

  clearCircles() {
    if (this.circlesLayer) {
      this.circlesLayer.clearLayers();
      this.removeCircles(this.circlesLayer);
      this.circles = {};
    }
  }

  clearHeat() {
    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
    }
    this.heatData = [];
  }

  drawCircles() {
    if (this.needToRedrawCircles()) {
      this.clearCircles();
      this.createCircles();
    } else {
      this.updateCircles();
    }
  }

  createCircles() {
    const circles = {};
    this.ctrl.data.forEach(dataPoint => {
      if (!dataPoint.locationName) return;
      circles[dataPoint.key] = this.createCircle(dataPoint);
    });
    this.circlesLayer = this.addCircles(_.values(circles));
    this.circles = circles;
  }

  updateCircles() {
    this.ctrl.data.forEach(dataPoint => {
      if (!dataPoint.locationName) return;

      const circle = this.circles[dataPoint.key];

      if (circle) {
        circle.setRadius(this.calcCircleSize(dataPoint.value || 0));
        circle.setStyle({
          color: this.getColor(dataPoint.value),
          fillColor: this.getColor(dataPoint.value),
          fillOpacity: 0.5,
          location: dataPoint.key
        });
        circle.unbindPopup();
        this.createPopup(circle, dataPoint.locationName, dataPoint.valueRounded);
      }
    });
  }

  createCircle(dataPoint) {
    const circle = window.L.circleMarker([dataPoint.locationLatitude, dataPoint.locationLongitude], {
      radius: this.calcCircleSize(dataPoint.value || 0),
      color: this.getColor(dataPoint.value),
      fillColor: this.getColor(dataPoint.value),
      fillOpacity: 0.5,
      location: dataPoint.key
    });

    this.createPopup(circle, dataPoint.locationName, dataPoint.valueRounded);
    return circle;
  }

  calcCircleSize(dataPointValue) {
    const circleMinSize = parseInt(this.ctrl.panel.circleMinSize, 10);
    const circleMaxSize = parseInt(this.ctrl.panel.circleMaxSize, 10);

    if (this.ctrl.data.valueRange === 0) {
      return circleMaxSize;
    }

    const dataFactor = (dataPointValue - this.ctrl.data.lowestValue) / this.ctrl.data.valueRange;
    const circleSizeRange = this.ctrl.panel.circleMaxSize - circleMinSize;

    return (circleSizeRange * dataFactor) + circleMinSize;
  }

  createPopup(circle, locationName, value) {
    const unit = value && value === 1 ? this.ctrl.panel.unitSingular : this.ctrl.panel.unitPlural;
    const label = (locationName + ': ' + value + ' ' + (unit || '')).trim();
    circle.bindPopup(label, {'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': false});

    circle.on('mouseover', function onMouseOver(evt) {
      const layer = evt.target;
      layer.bringToFront();
      this.openPopup();
    });
    circle.on('mouseout', function onMouseOut() {
      circle.closePopup();
    });
  }

  getColor(value) {
    for (let index = this.ctrl.data.thresholds.length; index > 0; index--) {
      if (value >= this.ctrl.data.thresholds[index - 1]) {
        return this.ctrl.panel.colors[index];
      }
    }
    return _.first(this.ctrl.panel.colors);
  }

  rgb2hex(rgb){
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
      ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
    }

  drawHeat() {
    this.clearHeat();
    // build up the array to feed the heat layer
    const heatData = [];
    let minValue = _.min(_.map(this.ctrl.data, 'value'));
    let maxValue = _.max(_.map(this.ctrl.data, 'value'));

    this.ctrl.data.forEach(dataPoint => {
      if (!dataPoint.locationName) return;
      let normalizedValue = (dataPoint.value - minValue) / (maxValue - minValue);
      // let heatPoint = [dataPoint.locationLatitude, dataPoint.locationLongitude, normalizedValue];
      let heatPoint = [dataPoint.locationLatitude, dataPoint.locationLongitude, dataPoint.value];
      heatData.push(heatPoint);
    });

    let maxGrad = _.max(this.ctrl.data.thresholds);
    let minGrad = 0;//_.min(this.ctrl.data.thresholds);
    let mapMaxVal = maxGrad;//_.max([maxGrad,maxValue]);
    // gradient - color gradient config, e.g. {0.4: 'blue', 0.65: 'lime', 1: 'red'}
    var gradientData = {};
    gradientData[0] = this.rgb2hex(this.ctrl.panel.colors[0]);
    for (let index = 0; index < this.ctrl.data.thresholds.length; index++) {
      let thresh = (this.ctrl.data.thresholds[index] - minGrad) / (maxGrad - minGrad);
      if (thresh > 1)      thresh = 1;
      else if (thresh < 0) thresh = 0;
      gradientData[thresh] = this.rgb2hex(this.ctrl.panel.colors[index+1]);
    }
    let radius = parseInt(this.ctrl.panel.heatSize), blur = parseInt(this.ctrl.panel.heatBlur);
    let heatOpts = {radius:radius,blur:blur,max:mapMaxVal,gradient:gradientData};
    this.heatLayer = window.L.heatLayer(heatData,heatOpts).addTo(this.map);
    this.heatData = heatData;
  }

  resize() {
    this.map.invalidateSize();
  }

  panToMapCenter() {
    this.map.panTo([parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)]);
    this.ctrl.mapCenterMoved = false;
  }

  removeLegend() {
    this.legend.removeFrom(this.map);
    this.legend = null;
  }

  addCircles(circles) {
    return window.L.layerGroup(circles).addTo(this.map);
  }

  removeCircles() {
    this.map.removeLayer(this.circlesLayer);
  }

  setZoom(zoomFactor) {
    this.map.setZoom(parseInt(zoomFactor, 10));
  }

  remove() {
    this.circles = {};
    if (this.circlesLayer) this.removeCircles();
    if (this.legend) this.removeLegend();
    this.map.remove();
  }
}

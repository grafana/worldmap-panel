import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import L from './leaflet';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';

const panelDefaults = {
  mapCenterLatitude: 0,
  mapCenterLongitude: 0,
  initialZoom: 1,
  valueName: 'avg',
  circleSize: 100,
  tileServers: {
    'OpenStreetMap': {url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>', subdomains: 'abc'},
    'Mapquest': {url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', attribution: 'Tiles by <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
              'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
              subdomains: '1234'},
    'CartoDB Dark': {url: 'http://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, &copy;<a href="http://cartodb.com/attributions#basemaps">CartoDB</a>, CartoDB <a href="http://cartodb.com/attributions" target="_blank">attribution</a>', subdomains: '1234'}
  },
  tileServer: 'Mapquest'
};

export class WorldmapCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector) {
    super($scope, $injector);
    _.defaults(this.panel, panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
  }

  onInitEditMode() {
    this.addEditorTab('Worldmap', 'public/plugins/grafana-worldmap-panel/editor.html', 2);
  }

  onDataReceived(dataList) {
    this.series = dataList.map(this.seriesHandler.bind(this));
    const data = [];
    this.setValues(data);
    this.data = data;

    if (!this.map) {
      window.$.getJSON('public/plugins/grafana-worldmap-panel/countries.json').then(res => {
        this.countries = res;
        this.createMap();
      });
    }

    this.render();
  }

  setValues(data) {
    if (this.series && this.series.length > 0) {
      this.series.forEach(serie => {
        const lastPoint = _.last(serie.datapoints);
        const lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;

        if (_.isString(lastValue)) {
          data.push({countryCode: serie.alias, value: 0, valueFormatted: lastValue, valueRounded: 0});
        } else {
          const dataValue = {
            countryCode: serie.alias,
            value: serie.stats[this.panel.valueName],
            flotpairs: serie.flotpairs,
            valueFormatted: lastValue,
            valueRounded: 0
          };

          dataValue.valueRounded = kbn.roundValue(dataValue.value, 0);
          data.push(dataValue);
        }
      });
    }
  }

  seriesHandler(seriesData) {
    const series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  createMap() {
    this.map = window.L.map('mapid_' + this.panel.id, {worldCopyJump: true, center: [this.panel.mapCenterLatitude, this.panel.mapCenterLongitude]})
      .fitWorld()
      .zoomIn(this.panel.initialZoom);

    const selectedTileServer = this.panel.tileServers[this.panel.tileServer];
    window.L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution
    }).addTo(this.map);

    this.drawCircles();
  }

  drawCircles() {
    const circles = [];
    this.data.forEach(dataPoint => {
      const country = _.find(this.countries, (cou) => { return cou.country === dataPoint.countryCode; });

      if (!country) return;

      const circle = window.L.circle([country.latitude, country.longitude], dataPoint.value * this.panel.circleSize, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5
      });

      circle.bindPopup(country.name + ': ' + dataPoint.valueRounded);
      circles.push(circle);
    }, this);
    this.circles = window.L.layerGroup(circles).addTo(this.map);
  }

  setNewMapCenter() {
    this.mapCenterMoved = true;
    this.panToMapCenter();
  }

  panToMapCenter() {
    this.map.panTo([this.panel.mapCenterLatitude, this.panel.mapCenterLongitude]);
  }

  setZoom() {
    this.map.setZoom(this.panel.initialZoom);
  }

  resize() {
    if (this.map) this.map.invalidateSize();
  }

  changeTileServer() {
    this.map.remove();
    this.createMap();
    this.render();
  }

  render() {
    if (!this.data || !this.map || !this.circles) {
      return;
    }

    this.resize();

    if (this.mapCenterMoved) {
      this.panToMapCenter();
      this.mapCenterMoved = false;
    }

    this.circles.eachLayer(layer => {
      if (layer._container) this.circles.removeLayer(layer);
    });

    this.drawCircles();
  }
}

WorldmapCtrl.templateUrl = 'module.html';

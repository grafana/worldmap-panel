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
  circleSize: 100
};

export class WorldmapCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector) {
    super($scope, $injector);
    _.defaults(this.panel, panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/grafana-worldmap-panel/editor.html', 2);
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
    this.map = window.L.map('mapid').setView([this.panel.mapCenterLatitude, this.panel.mapCenterLongitude], this.panel.initialZoom);

    window.L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      subdomains: 'abc',
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    }).addTo(this.map);

    this.drawCircles();
  }

  drawCircles() {
    const circles = [];
    this.data.forEach(dataPoint => {
      const country = _.find(this.countries, (cou) => { return cou.country === dataPoint.countryCode; });
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

  render() {
    if (!this.data || !this.map || !this.circles) {
      return;
    }
    this.circles.clearLayers();
    this.drawCircles();
  }
}

WorldmapCtrl.templateUrl = 'module.html';

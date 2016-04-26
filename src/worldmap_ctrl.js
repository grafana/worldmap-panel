import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';
import mapRenderer from './map_renderer';
import './css/worldmap-panel.css!';

const panelDefaults = {
  mapCenter: '(0°, 0°)',
  mapCenterLatitude: 0,
  mapCenterLongitude: 0,
  initialZoom: 1,
  valueName: 'total',
  circleSizeFactor: 1,
  circleMinSize: 2,
  circleMaxSize: 30,
  locationData: 'countries',
  thresholds: '0,10',
  colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
  unitSingle: '',
  unitPlural: ''
};

const tileServers = {
  'Estri WorldGrey': {url: 'http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ', subdomains: '' },
  'OpenStreetMap': {url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>', subdomains: 'abc'},
  'Mapquest': {url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', attribution: 'Tiles by <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
            'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
            subdomains: '1234'},
  'CartoDB Positron': { url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd'},
  'CartoDB Dark': {url: 'http://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: '1234'}
};

const mapCenters = {
  '(0°, 0°)': {mapCenterLatitude: 0, mapCenterLongitude: 0},
  'North America': {mapCenterLatitude: 40, mapCenterLongitude: -100},
  'Europe': {mapCenterLatitude: 46, mapCenterLongitude: 14},
  'West Asia': {mapCenterLatitude: 26, mapCenterLongitude: 53},
  'SE Asia': {mapCenterLatitude: 10, mapCenterLongitude: 106}
};

export class WorldmapCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector, contextSrv) {
    super($scope, $injector);

    this.setDefaults(contextSrv);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));

    this.loadLocationDataFromFile();
  }

  setDefaults(contextSrv) {
    if (this.panel && !this.panel.tileServer) {
      this.panel.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
    }
    _.defaults(this.panel, panelDefaults);
    this.setMapSaturationClass();
    this.tileServers = tileServers;
  }

  setMapSaturationClass() {
    if (this.panel.tileServer === 'CartoDB Dark') {
      this.saturationClass = 'map-darken';
    } else if (this.panel.tileServer === 'Mapquest') {
      this.saturationClass = 'map-lighten';
    } else {
      this.saturationClass = '';
    }
  }

  loadLocationDataFromFile() {
    if (!this.map) {
      window.$.getJSON('public/plugins/grafana-worldmap-panel/' + this.panel.locationData + '.json').then(res => {
        this.locations = res;
        this.render();
      });
    }
  }

  onPanelTeardown() {
    this.circles = [];
    if (this.circlesLayer) this.map.removeLayer(this.circlesLayer);
    if (this.legend) this.legend.removeFrom(this.map);
    this.legend = null;
    if (this.map) this.map.remove();
  }

  onInitEditMode() {
    this.addEditorTab('Worldmap', 'public/plugins/grafana-worldmap-panel/editor.html', 2);
  }

  onDataReceived(dataList) {
    this.series = dataList.map(this.seriesHandler.bind(this));
    const data = [];
    this.setValues(data);
    this.data = data;

    this.updateThresholdData();

    this.render();
  }

  setValues(data) {
    if (this.series && this.series.length > 0) {
      this.series.forEach(serie => {
        const lastPoint = _.last(serie.datapoints);
        const lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;

        if (_.isString(lastValue)) {
          data.push({key: serie.alias, value: 0, valueFormatted: lastValue, valueRounded: 0});
        } else {
          const dataValue = {
            key: serie.alias,
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

  setNewMapCenter() {
    if (this.panel.mapCenter !== 'custom') {
      this.panel.mapCenterLatitude = mapCenters[this.panel.mapCenter].mapCenterLatitude;
      this.panel.mapCenterLongitude = mapCenters[this.panel.mapCenter].mapCenterLongitude;
    }
    this.mapCenterMoved = true;
    this.render();
  }

  setZoom() {
    this.map.setZoom(this.panel.initialZoom);
  }

  changeTileServer() {
    this.legend.removeFrom(this.map);
    this.legend = null;
    this.map.remove();
    this.map = null;
    this.render();
  }

  changeThresholds() {
    this.updateThresholdData();
    this.legend.update();
    this.render();
  }

  updateThresholdData() {
    this.data.thresholds = this.panel.thresholds.split(',').map(strValue => {
      return Number(strValue.trim());
    });
  }

  changeLocationData() {
    window.$.getJSON('public/plugins/grafana-worldmap-panel/' + this.panel.locationData + '.json').then(res => {
      this.locations = res;
      this.render();
    });
  }

  link(scope, elem, attrs, ctrl) {
    mapRenderer(scope, elem, attrs, ctrl);
  }
}

WorldmapCtrl.templateUrl = 'module.html';

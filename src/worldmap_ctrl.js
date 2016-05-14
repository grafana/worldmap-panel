import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';
import mapRenderer from './map_renderer';
import DataFormatter from './data_formatter';
import decodeGeoHash from './geohash';
import './css/worldmap-panel.css!';

const panelDefaults = {
  mapCenter: '(0°, 0°)',
  mapCenterLatitude: 0,
  mapCenterLongitude: 0,
  initialZoom: 1,
  valueName: 'total',
  circleMinSize: 2,
  circleMaxSize: 30,
  locationData: 'countries',
  thresholds: '0,10',
  colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
  unitSingle: '',
  unitPlural: '',
  showLegend: true,
  esMetric: 'Count'
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

    this.setMapProvider(contextSrv);
    _.defaults(this.panel, panelDefaults);

    this.dataFormatter = new DataFormatter(this, kbn);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));

    this.loadLocationDataFromFile();
  }

  setMapProvider(contextSrv) {
    this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
    this.setMapSaturationClass();
  }

  setMapSaturationClass() {
    if (this.tileServer === 'CartoDB Dark') {
      this.saturationClass = 'map-darken';
    } else {
      this.saturationClass = '';
    }
  }

  loadLocationDataFromFile() {
    if (!this.map && this.panel.locationData !== 'geohash') {
      window.$.getJSON('public/plugins/grafana-worldmap-panel/data/' + this.panel.locationData + '.json').then(res => {
        this.locations = res;
        this.render();
      });
    }
  }

  onPanelTeardown() {
    if (this.map) this.map.remove();
  }

  onInitEditMode() {
    this.addEditorTab('Worldmap', 'public/plugins/grafana-worldmap-panel/editor.html', 2);
  }

  onDataReceived(dataList) {
    this.series = dataList.map(this.seriesHandler.bind(this));
    const data = [];
    if (this.panel.locationData === 'geohash') {
      this.setGeohashValues(data);
    } else {
      this.dataFormatter.setValues(data);
    }
    this.data = data;

    this.updateThresholdData();

    this.render();
  }

  setGeohashValues(data) {
    if (!this.panel.esGeoPoint || !this.panel.esMetric) return;

    if (this.series && this.series.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      this.series[0].datapoints.forEach(datapoint => {
        const encodedGeohash = datapoint[this.panel.esGeoPoint];
        const decodedGeohash = decodeGeoHash(encodedGeohash);

        const dataValue = {
          key: encodedGeohash,
          locationName: this.panel.esLocationName ? datapoint[this.panel.esLocationName] : encodedGeohash,
          locationLatitude: decodedGeohash.latitude,
          locationLongitude: decodedGeohash.longitude,
          value: datapoint[this.panel.esMetric],
          valueFormatted: datapoint[this.panel.esMetric],
          valueRounded: 0
        };

        if (dataValue.value > highestValue) highestValue = dataValue.value;
        if (dataValue.value < lowestValue) lowestValue = dataValue.value;

        dataValue.valueRounded = kbn.roundValue(dataValue.value, 0);
        data.push(dataValue);
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
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

  toggleLegend() {
    if (!this.panel.showLegend) {
      this.map.removeLegend();
    }
    this.render();
  }

  changeThresholds() {
    this.updateThresholdData();
    this.map.legend.update();
    this.render();
  }

  updateThresholdData() {
    this.data.thresholds = this.panel.thresholds.split(',').map(strValue => {
      return Number(strValue.trim());
    });
  }

  changeLocationData() {
    this.loadLocationDataFromFile();

    if (this.panel.locationData === 'geohash') {
      this.render();
    }
  }

  link(scope, elem, attrs, ctrl) {
    mapRenderer(scope, elem, attrs, ctrl);
  }
}

WorldmapCtrl.templateUrl = 'module.html';

import _ from 'lodash';
import decodeGeoHash from './geohash';

export default class DataFormatter {
  constructor(ctrl, kbn) {
    this.ctrl = ctrl;
    this.kbn = kbn;
  }

  setValues(data) {
    if (this.ctrl.series && this.ctrl.series.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      this.ctrl.series.forEach((serie) => {
        const lastPoint = _.last(serie.datapoints);
        const lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;
        const location = _.find(this.ctrl.locations, (loc) => { return loc.key.toUpperCase() === serie.alias.toUpperCase(); });

        if (!location) return;

        if (_.isString(lastValue)) {
          data.push({key: serie.alias, value: 0, valueFormatted: lastValue, valueRounded: 0});
        } else {
          const dataValue = {
            key: serie.alias,
            locationName: location.name,
            locationLatitude: location.latitude,
            locationLongitude: location.longitude,
            value: serie.stats[this.ctrl.panel.valueName],
            valueFormatted: lastValue,
            valueRounded: 0
          };

          if (dataValue.value > highestValue) highestValue = dataValue.value;
          if (dataValue.value < lowestValue) lowestValue = dataValue.value;

          dataValue.valueRounded = this.kbn.roundValue(dataValue.value, parseInt(this.ctrl.panel.decimals, 10) || 0);
          data.push(dataValue);
        }
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
    }
  }

  setGeohashValues(dataList, data) {
    if (!this.ctrl.panel.esGeoPoint || !this.ctrl.panel.esMetric) return;

    if (dataList && dataList.length > 0) {
      //Prometheus' returned results have a different structure than ElasticSearch.
      //The shape is approximately: 
      //dataList = [ 
      //             { 
      //               target="someGeoHash", 
      //               datapoints = [ 
      //                               [0=metric, 1=ticks],
      //                               ...
      //                            ] 
      //             } 
      //           ]
      //For now, just take the latest datapoint for each geohash, since we aren't displaying
      //the full time series on the map, and we just want the current value.
      let isPrometheus = this.ctrl.panel.datasource == "prometheus";
      if(isPrometheus) {
        let highestValue = 0;
        let lowestValue = Number.MAX_VALUE;

        dataList.forEach((datapoint) => {
          const encodedGeohash = datapoint.target;
          const decodedGeohash = decodedGeohash(encodedGeohash);
          const metricValue = datapoint.datapoints.last()[0];

          const dataValue = {
            key: encodedGeohash,
            locationName: encodedGeohash,
            locationLatitude: decodedGeohash.latitude,
            locationLongitude: decodedGeohash.longitude,
            value: metricValue,//0 is the actual metric value
            valueFormatted: metricValue + (metricValue == 1 ? this.ctrl.panel.unitSingular : this.ctrl.panel.unitPlural),
            valueRounded: this.kbn.roundValue(metricValue, this.ctrl.panel.decimals || 0)
          };

          if (dataValue.value > highestValue) highestValue = dataValue.value;
          if (dataValue.value < lowestValue) lowestValue = dataValue.value;

          data.push(dataValue);
        });

        data.highestValue = highestValue;
        data.lowestValue = lowestValue;
        data.valueRange = highestValue - lowestValue;
      }
      else {//Not Prometheus; proceed as normal.
        let highestValue = 0;
        let lowestValue = Number.MAX_VALUE;

        dataList[0].datapoints.forEach((datapoint) => {
          const encodedGeohash = datapoint[this.ctrl.panel.esGeoPoint];
          const decodedGeohash = decodeGeoHash(encodedGeohash);

          const dataValue = {
            key: encodedGeohash,
            locationName: this.ctrl.panel.esLocationName ? datapoint[this.ctrl.panel.esLocationName] : encodedGeohash,
            locationLatitude: decodedGeohash.latitude,
            locationLongitude: decodedGeohash.longitude,
            value: datapoint[this.ctrl.panel.esMetric],
            valueFormatted: datapoint[this.ctrl.panel.esMetric],
            valueRounded: 0
          };

          if (dataValue.value > highestValue) highestValue = dataValue.value;
          if (dataValue.value < lowestValue) lowestValue = dataValue.value;

          dataValue.valueRounded = this.kbn.roundValue(dataValue.value, this.ctrl.panel.decimals || 0);
          data.push(dataValue);
        });

        data.highestValue = highestValue;
        data.lowestValue = lowestValue;
        data.valueRange = highestValue - lowestValue;
      }
    }
  }

  static tableHandler(tableData) {
    const datapoints = [];

    if (tableData.type === 'table') {
      const columnNames = {};

      tableData.columns.forEach((column, columnIndex) => {
        columnNames[columnIndex] = column.text;
      });

      tableData.rows.forEach((row) => {
        const datapoint = {};

        row.forEach((value, columnIndex) => {
          const key = columnNames[columnIndex];
          datapoint[key] = value;
        });

        datapoints.push(datapoint);
      });
    }

    return datapoints;
  }

  setTableValues(tableData, data) {
    if (tableData && tableData.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      tableData[0].forEach((datapoint) => {
        if (!datapoint.geohash) {
          return;
        }

        const encodedGeohash = datapoint.geohash;
        const decodedGeohash = decodeGeoHash(encodedGeohash);

        const dataValue = {
          key: encodedGeohash,
          locationName: datapoint[this.ctrl.panel.tableLabel] || 'n/a',
          locationLatitude: decodedGeohash.latitude,
          locationLongitude: decodedGeohash.longitude,
          value: datapoint.metric,
          valueFormatted: datapoint.metric,
          valueRounded: 0
        };

        if (dataValue.value > highestValue) highestValue = dataValue.value;
        if (dataValue.value < lowestValue) lowestValue = dataValue.value;

        dataValue.valueRounded = this.kbn.roundValue(dataValue.value, this.ctrl.panel.decimals || 0);
        data.push(dataValue);
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
    }
  }
}
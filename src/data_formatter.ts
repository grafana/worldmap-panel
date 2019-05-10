import * as _ from 'lodash';
import decodeGeoHash from './geohash';
import kbn from 'grafana/app/core/utils/kbn';
import TimeSeries from 'grafana/app/core/time_series2';
import {DataError, MappingError} from "./core";
import WorldmapCtrl from "./worldmap_ctrl";

interface DataInfo {
  /*
   * Result from introspecting ingress data through `analyzeData`.
   * "type" is either "table" or "timeseries" or "json".
   */
  type: DataFormat;
  count: number;
}

enum DataFormat {
  Table = 'table',
  // Fixme: Add detection for other data formats.
  //Timeseries = 'timeseries',
  //Json = 'json',
}

export default class DataFormatter {

  settings: any;
  
  constructor(private ctrl: any | WorldmapCtrl) {
    this.settings = ctrl.settings;

    // Backward compatibility for tests after adding the `PluginSettings` proxy.
    // Todo: Don't worry, this will go away.
    if (!this.settings) {
      this.settings = ctrl.panel;
    }
  }

  static analyzeData(dataList) : DataInfo {
    /*
     * Introspect the ingress data and try to heuristically
     * find out about its data format and character.
     *
     * This is still in its infancy but should be improved to make
     * the plugin more robust wrt. to applying the correct mapping
     * flavors to the corresponding ingress data format.
     *
     * Fixme: Add detection for timeseries format.
     *
     */

    const dataInfo = <DataInfo>{};
    if (!_.isEmpty(dataList)) {
      const metric0 = dataList[0];
      dataInfo.type = metric0.type;

      if (dataInfo.type == DataFormat.Table) {
        dataInfo.count = metric0.rows.length;

      } else {
        console.warn('Todo: Implement "analyzeData" for other data sources');
        //info.type = 'timeseries';
      }
    }
    return dataInfo;
  }

  static seriesHandler(seriesData, settings) {
    const series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target
    });

    series.flotpairs = series.getFlotPairs(settings.nullPointMode);
    return series;
  }

  setTimeseriesValues(data) {
    if (this.ctrl.series && this.ctrl.series.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      this.ctrl.series.forEach(serie => {
        const lastPoint = _.last(serie.datapoints);
        const lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;
        const location = _.find(this.ctrl.locations, loc => {
          return loc.key.toUpperCase() === serie.alias.toUpperCase();
        });

        if (!location) {
          return;
        }

        if (_.isString(lastValue)) {
          data.push({ key: serie.alias, value: 0, valueFormatted: lastValue, valueRounded: 0 });
        } else {
          // Todo: Bring this up to speed with the current state in `setTableValues`.
          const dataValue = {
            key: serie.alias,
            locationName: location.name,
            locationLatitude: location.latitude,
            locationLongitude: location.longitude,
            value: serie.stats[this.settings.valueName],
            valueFormatted: lastValue,
            valueRounded: 0,
          };

          if (dataValue.value > highestValue) {
            highestValue = dataValue.value;
          }

          if (dataValue.value < lowestValue) {
            lowestValue = dataValue.value;
          }

          dataValue.valueRounded = kbn.roundValue(dataValue.value, parseInt(this.settings.decimals, 10) || 0);
          data.push(dataValue);
        }
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
    } else {
      this.addWarning('No data in timeseries format received');
    }
  }

  createDataValue(encodedGeohash, decodedGeohash, locationName, value, link) {
    // Todo: Bring this up to speed with the current state in `setTableValues`.
    const dataValue = {
      key: encodedGeohash,
      locationName: locationName,
      locationLatitude: decodedGeohash.latitude,
      locationLongitude: decodedGeohash.longitude,
      value: value,
      valueFormatted: value,
      valueRounded: 0,
      link: link
    };

    dataValue.valueRounded = kbn.roundValue(dataValue.value, this.settings.decimals || 0);
    return dataValue;
  }

  decodeGeohashSafe(encodedGeohash) {
    // Safely decode the geohash value, either by raising an exception or by ignoring it.
    if (!encodedGeohash) {
      if (!this.settings.ignoreEmptyGeohashValues) {
        throw new DataError('geohash value missing or empty');
      }
      return;
    }
    try {
      const decodedGeohash = decodeGeoHash(encodedGeohash);
      return decodedGeohash;
    } catch (e) {
      if (!this.settings.ignoreInvalidGeohashValues) {
        throw e;
      }
      return;
    }
  }

  setGeohashValues(dataList, data) {

    if (!this.settings.esGeoPoint) {
      throw new MappingError('geohash field not configured');
    }

    if (dataList && dataList.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      dataList.forEach(result => {

        // Process table format data.
        if (result.type === 'table') {

          const geoHashField = this.settings.esGeoPoint;

          // Sanity check: Croak if the designated geohash column does not exist in ingress data.
          if (!_.includes(_.map(result.columns, 'text'), geoHashField)) {
            throw new MappingError(`Field "${this.settings.esGeoPoint}" not found in database`);
          }

          const columnNames = {};

          result.columns.forEach((column, columnIndex) => {
            columnNames[column.text] = columnIndex;
          });

          result.rows.forEach(row => {

            const encodedGeohash = row[columnNames[geoHashField]];

            // Safely decode the geohash value.
            const decodedGeohash = this.decodeGeohashSafe(encodedGeohash);
            if (!decodedGeohash) return;

            const locationName = this.settings.esLocationName
              ? row[columnNames[this.settings.esLocationName]]
              : encodedGeohash;
            const value = row[columnNames[this.settings.esMetric]];
            const link = this.settings.esLink
              ? row[columnNames[this.settings.esLink]]
              : null;

            const dataValue = this.createDataValue(encodedGeohash, decodedGeohash, locationName, value, link);
            if (dataValue.value > highestValue) {
              highestValue = dataValue.value;
            }

            if (dataValue.value < lowestValue) {
              lowestValue = dataValue.value;
            }

            data.push(dataValue);
          });

          data.highestValue = highestValue;
          data.lowestValue = lowestValue;
          data.valueRange = highestValue - lowestValue;

        // Process timeseries format data.
        } else {
          result.datapoints.forEach(datapoint => {
            const encodedGeohash = datapoint[this.settings.esGeoPoint];

            // Safely decode the geohash value.
            const decodedGeohash = this.decodeGeohashSafe(encodedGeohash);
            if (!decodedGeohash) return;

            const locationName = this.settings.esLocationName
              ? datapoint[this.settings.esLocationName]
              : encodedGeohash;
            const value = datapoint[this.settings.esMetric];
            const link = this.settings.esLink
              ? datapoint[this.settings.esLink]
              : null;

            const dataValue = this.createDataValue(encodedGeohash, decodedGeohash, locationName, value, link);
            if (dataValue.value > highestValue) {
              highestValue = dataValue.value;
            }
            if (dataValue.value < lowestValue) {
              lowestValue = dataValue.value;
            }
            data.push(dataValue);
          });

          data.highestValue = highestValue;
          data.lowestValue = lowestValue;
          data.valueRange = highestValue - lowestValue;
        }
      });
    } else {
      this.addWarning('No data received from geohash query');
    }
  }

  static tableHandler(tableData) {
    const datapoints: any[] = [];

    if (tableData.type === 'table') {
      const columnNames = {};

      tableData.columns.forEach((column, columnIndex) => {
        columnNames[columnIndex] = column.text;
      });

      tableData.rows.forEach(row => {
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

      // Todo: Using hardcoded `tableData[0]` means
      //  this will only use the first active query?
      tableData[0].forEach(datapoint => {
        let key;
        let longitude;
        let latitude;

        // Todo: Think about introducing a "Ignore decoding errors" control option
        //  in order to compensate for anything in here where the shit might hit the fan.
        //  Essentially, this would mask all exceptions raised from this code.

        // Assign value.
        let value = datapoint[this.settings.tableQueryOptions.metricField];
        let valueRounded = kbn.roundValue(value, this.settings.decimals || 0);

        // Assign latitude and longitude, either directly or by decoding from geohash.
        if (this.settings.tableQueryOptions.queryType === 'geohash') {
          const encodedGeohash = datapoint[this.settings.tableQueryOptions.geohashField];

          // Safely decode the geohash value.
          const decodedGeohash = this.decodeGeohashSafe(encodedGeohash);
          if (!decodedGeohash) return;

          latitude = decodedGeohash.latitude;
          longitude = decodedGeohash.longitude;
          key = encodedGeohash;

        } else {
          latitude = datapoint[this.settings.tableQueryOptions.latitudeField];
          longitude = datapoint[this.settings.tableQueryOptions.longitudeField];
          key = `${latitude}_${longitude}`;
        }

        // Assign label.
        let label = datapoint[this.settings.tableQueryOptions.labelField];

        // For improved labelling, attempt to resolve value from table's "labelLocationKeyField" against JSON location key.
        let labelJsonKey = datapoint[this.settings.tableQueryOptions.labelLocationKeyField];
        let location = _.find(this.ctrl.locations, function (loc) {
            return loc.key == labelJsonKey;
        });

        // Assign link.
        let link = datapoint[this.settings.tableQueryOptions.linkField] || null;

        // Compute effective location name.
        let locationNameFromTable = label;
        let locationNameFromJson  = location ? location.name : undefined;
        let locationNameEffective = locationNameFromJson || locationNameFromTable || key;

        // Add regular label as suffix when label is coming from JSON through "table+json" or "table+jsonp".
        // This is effectively the key value.
        // This is required to attach station identifiers to the effective name.
        // Todo: Better control this through appropriate editor option, e.g.
        //  "Add location key to label" (`addLocationKey`).
        if (labelJsonKey) {
          locationNameEffective += ` (${labelJsonKey})`;
        }

        const dataValue = {

          // Add location information.
          key: key,
          locationName: locationNameEffective,
          locationLatitude: latitude,
          locationLongitude: longitude,

          // Add metric name and values.
          label: label,
          value: value,
          valueFormatted: value,
          valueRounded: valueRounded,

          // Add link.
          link: link,
        };

        // Add all values from the original datapoint as attributes prefixed with `__field_`.
        for (let key in datapoint) {
          const value = datapoint[key];
          key = '__field_' + key;
          dataValue[key] = value;
        }

        // Bookkeeping for computing valueRange.
        if (dataValue.value > highestValue) {
          highestValue = dataValue.value;
        }

        if (dataValue.value < lowestValue) {
          lowestValue = dataValue.value;
        }

        data.push(dataValue);
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;

    } else {
      this.addWarning('No data in table format received');
    }
  }

  setJsonValues(data) {
    if (this.ctrl.series && this.ctrl.series.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      this.ctrl.series.forEach(point => {
        // Todo: Bring this up to speed with the current state in `setTableValues`.
        const dataValue = {
          key: point.key,
          locationName: point.name,
          locationLatitude: point.latitude,
          locationLongitude: point.longitude,
          value: point.value !== undefined ? point.value : 1,
          valueRounded: 0,
        };
        if (dataValue.value > highestValue) {
          highestValue = dataValue.value;
        }
        if (dataValue.value < lowestValue) {
          lowestValue = dataValue.value;
        }
        dataValue.valueRounded = Math.round(dataValue.value);
        data.push(dataValue);
      });
      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;

    } else {
      this.addWarning('No data in JSON format received');
    }
  }

  addWarning(message) {
    this.ctrl.errors.add(message, {level: 'warning', domain: 'data'});
  }

}

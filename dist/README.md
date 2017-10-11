## Worldmap Panel Plugin for Grafana

The Worldmap Panel is a tile map of the world that can be overlaid with circles representing data points from a query. It can be used with time series metrics, with geohash data from Elasticsearch or Table Data.

![Worldmap](https://raw.githubusercontent.com/grafana/worldmap-panel/54f83cfdc7339fee02df00933422c35630677330/src/images/worldmap-world.png)

There are currently two ways to connect data with points on a map. Either by matching a tag or series name to a country code/state code (e.g. SE for Sweden, TX for Texas) or by using geohashes to map against geographic coordinates.

## Time Series Data as the Data Source

Supported Databases:

- Graphite
- InfluxDB
- OpenTSDB
- Prometheus

Included location data:

- Countries (2 letter codes)
- Countries (3 letter codes)
- US states

This works by matching country codes (like US or GB or FR) or US state codes (TX or NY) to a node or a wildcard in a metric namespace. If there is a match in the list of countries or states then a circle will be drawn at the location.

If you want to match to other data than countries or states, then you will have to provide custom location data. The current way to do that is via a JSON endpoint that returns a json file with location data (See Map Data Options)

The size of the circle depends on the value of the matched metric. Circle size is relative e.g. if you have 3 countries with values 1, 2 and 3 or 100, 200 and 300 then you will get one small circle, one medium circle and one large circle.

#### Query Examples

#### Graphite Query for Countries

Use the aliasByNode function to point to the field containing the country code. See the image below for an example of a graphite query.

![Graphite Query for Countries](https://raw.githubusercontent.com/grafana/worldmap-panel/master/src/images/worldmap-timeseries-query.png)

#### Influx Query for Countries

The Group By clause should be the country code and an alias is needed too. The alias should be in the form `$tag_<field name>`.

![Influx Query for Countries](https://raw.githubusercontent.com/grafana/worldmap-panel/master/src/images/influx-query.png)

#### Map Data Options for Time Series Data

Under the Worldmap tab, choose either the `countries` or `states` option.

![Worldmap Options for Countries](https://raw.githubusercontent.com/grafana/worldmap-panel/master/src/images/countries-option.png)

Using a JSON endpoint to return a custom list of locations:

![Worldmap Options for JSON](https://raw.githubusercontent.com/grafana/worldmap-panel/master/src/images/json-endpoint.png)

The endpoint used here is for the demo version of worldPing - [https://worldpingdemo.grafana.net/api/plugin-proxy/raintank-worldping-app/api/v2/probes/locations](https://worldpingdemo.grafana.net/api/plugin-proxy/raintank-worldping-app/api/v2/probes/locations)

Using a JSONP endpoint (if you need to wrap the JSON to get around CORS problems):

![Worldmap Options for JSONP](https://raw.githubusercontent.com/grafana/worldmap-panel/master/src/images/jsonp-endpoint.png)

## Geohashes as the Data Source

Supported Databases:

- ElasticSearch

The [Geo-point](https://www.elastic.co/guide/en/elasticsearch/reference/2.3/geo-point.html) data type with geohash indexing in Elasticsearch can also be used as a datasource for the worldmap panel. Grafana has a new bucket aggregate for Elasticsearch queries - Geo Hash Grid that allows grouping of coordinates. The Geo Hash Grid has a precision option where 1 is the highest level and 7 is the lowest.

![Elasticsearch Query for Worldmap](https://raw.githubusercontent.com/grafana/worldmap-panel/master/src/images/worldmap-geohash-query.png)

Three fields need to be provided by the ElasticSearch query:

- A metric. This is free text and should match the aggregation used (Count, Average, Sum, Unique Count etc.)
- Location Name (optional - geohash value will be shown if not chosen)
- geo_point field that provides the geohash value.

![Elasticsearch Query for Worldmap](https://raw.githubusercontent.com/grafana/worldmap-panel/master/src/images/es-options.png)


## Table Data as the Data Source

Supported Databases:

- InfluxDB

An example of Table Data would using InfluxDB and then formatting the data returned from the metric query as Table.

Similar to the Elasticsearch query above, 3 fields are expected (2 of them are mandatory)

- a field named *metric*
- a geohash tag named *geohash*
- an optional location name (shown in the mouse over). This location name has to be specified in the Worldmap settings tab too.

![Example influxdb query](https://cloud.githubusercontent.com/assets/434655/16535977/8cd520be-3fec-11e6-8dc9-2ecf7b16ad5f.png)

## JSON result as the Data Source


Supported Databases: 

- Warp&nbsp;10 via [grafana-warp10-datasource](https://github.com/cityzendata/grafana-warp10) plugin  

It supports any datasource capable of generating a JSON response with a  a custom list of locations (the same format that for the JSON enpoint).

### Map Visual Option Settings

**Center**

This settings configures the default center of the map. There are 5 centers to choose from or you can choose a custom center or last GeoHash center..For a custom center there are two fields: latitude and longitude. Examples of values are 37.09024, -95.712891 for the center of the US or 55.378051, -3.435973 for Great Britain. Last GeoHash center will centered the map on the last GeoHash received from the data.


**Initial Zoom**

The initial zoom factor for the map. This is a value between 1 and 18 where 1 is the most zoomed out.

**Min Circle Size**

This is minimum size for a circle in pixels.

**Max Circle Size**

This is the maximum size for a circle in pixels. Depending on the zoom level you might want a larger or smaller max circle size to avoid overlapping.

**Unit**

The Unit is shown in the popover when you hover over a circle. There are two fields the singular form and the plural form. E.g. visit/visits or error/errors

**Show Legend**

Shows/hide the legend on the bottom left that shows the threshold ranges and their associated colors.

### Map Data Options

**Location Data**

There are four ways to provide data for the worldmap panel:
 - *countries*: This is a list of all the countries in the world. It works by matching a country code (US, FR, AU) to a node alias in a time series query.
 - *states*: Similar to countries but for the states in USA e.g. CA for California
 - *geohash*: An ElasticSearch query that returns geohashes.
 - *json*: A json endpoint that returns custom json. Examples of the format are the [countries data used in first option](https://github.com/grafana/worldmap-panel/blob/master/src/data/countries.json) or [this list of cities](https://github.com/grafana/worldmap-panel/blob/master/src/data/probes.json).
 - *jsonp*: A jsonp endpoint that returns custom json wrapped as jsonp. Use this if you are having problems with CORS.
 - *table*: This expects the metric query to return data points with a field named geohash. This field should contain a string in the [geohash form](https://www.elastic.co/guide/en/elasticsearch/guide/current/geohashes.html). For example: London -> "gcpvh3zgu992".

**Aggregation**

If you chose *countries* or *table* as the source of the location data then you can choose an aggregation here: avg, total etc.

For Graphite, be aware that the default value for Max Data Points is 1. This is to aggregate data points per country to one value in the most accurate way. This will by default, consolidate by average. To change the consolidation, use the consolidateBy function like so:

![Graphite Consolidate By](https://raw.githubusercontent.com/grafana/worldmap-panel/master/src/images/graphite-consolidateby.png)

Or just remove the 1 from the Max Data Point field and use the consolidation functions in Map Data Options (though depending on the timerange and amount of data points, this will be usually less accurate due to Graphite consolidation).

![Graphite Max Data Points](https://raw.githubusercontent.com/grafana/worldmap-panel/master/src/images/graphite-maxdatapoints.png)

**ES Metric/Location Name/geo_point Field**

Three fields need to be provided by the ElasticSearch query. They are text fields and should be the field names from the query under the Metrics tab.
- Metric is one of Count, Average, Sum etc.
- Location Name is the field that gives the circle a name. If it is blank, then the geohash value is shown in the popover instead of the location.
- geo_point is the GeoHashGrid field that provides the geohash value.

### Threshold Options

Thresholds control the color of the circles.

If one value is specified then two colors are used. For example, if the threshold is set to 10 then values under 10 get the first color and values that are 10 or more get the second color.

The threshold field also accepts 2 or more comma-separated values. For example, if you have 2 values that represents 3 ranges that correspond to the three colors. For example: if the thresholds are 70, 90 then the first color represents < 70, the second color represents between 70 and 90 and the third color represents > 90.

### CHANGELOG

The latest changes can be found here: [CHANGELOG.md](https://github.com/grafana/worldmap-panel/blob/master/CHANGELOG.md)

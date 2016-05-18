## Worldmap Panel Plugin for Grafana

The Worldmap Panel is a tile map of the world that can be overlaid with circles representing data points from a query. It can be used with time series metrics or with geohash data from Elasticsearch.

![Worldmap](https://raw.githubusercontent.com/grafana/worldmap-panel/54f83cfdc7339fee02df00933422c35630677330/src/images/worldmap-world.png)

## Time Series Data as the Datasource

If you are using a database like graphite then country codes (like US or GB or FR) are matched to a node or a wildcard in a metric namespace e.g. apps.country.FR.requests.count or apps.country.*.requests.count. Use the aliasByNode function to point to the field containing the country code. See the image below for an example of a graphite query.

![Graphite Query for Worldmap](https://raw.githubusercontent.com/grafana/worldmap-panel/54f83cfdc7339fee02df00933422c35630677330/src/images/worldmap-timeseries-query.png)

A circle is then drawn for every country code matched and the size of the circle depends on the value. Circle size is relative e.g. if you have 3 countries with values 1, 2 and 3 or 100, 200 and 300 then you will get one small circle, one medium circle and one large circle.

At the moment, only country codes are supported right now but support for uploading a custom location file with keys and coordinates is on the backlog.

## ElasticSearch as the Datasource

The [Geo-point](https://www.elastic.co/guide/en/elasticsearch/reference/2.3/geo-point.html) data type with geohash indexing in Elasticsearch can also be used as a datasource for the worldmap panel. Grafana has a new bucket aggregate for Elasticsearch queries - Geo Hash Grid that allows grouping of coordinates. The Geo Hash Grid has a precision option where 1 is the highest level and 7 is the lowest.

![Elasticsearch Query for Worldmap](https://raw.githubusercontent.com/grafana/worldmap-panel/54f83cfdc7339fee02df00933422c35630677330/src/images/worldmap-geohash-query.png)

Three fields need to be provided by the ElasticSearch query:
- A metric (Count, Average, Sum etc.)
- Location Name (optional - geohash value will be shown if not chosen)
- geo_point field that provides the geohash value.

### Map Visual Option Settings

**Center**

This settings configures the default center of the map. There are 5 centers to choose from or you can choose a custom center..For a custom center there are two fields: latitude and longitude. Examples of values are 37.09024, -95.712891 for the center of the US or 55.378051, -3.435973 for Great Britain.

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
 - *geohash*: An ElasticSearch query that returns geohashes.
 - *json*: A json endpoint that returns custom json. Examples of the format are the [countries data used in first option](https://github.com/grafana/worldmap-panel/blob/master/src/data/countries.json) or [this list of cities](https://github.com/grafana/worldmap-panel/blob/master/src/data/probes.json).
 - *jsonp*: A jsonp endpoint that returns custom json wrapped as jsonp. Use this if you are having problems with CORS.

**Aggregation**

If you chose *countries* as the source of the location data then you can choose an aggregation here: avg, total etc.

**ES Metric/Location Name/geo_point Field**

Three fields need to be provided by the ElasticSearch query. They are text fields and should be the field names from the query under the Metrics tab.
- Metric is one of Count, Average, Sum etc.
- Location Name is the field that gives the circle a name. If it is blank, then the geohash value is shown in the popover instead of the location.
- geo_point is the GeoHashGrid field that provides the geohash value.

### Threshold Options

Thresholds control the color of the circles. A threshold can contain one or two values.

If one value is specified then two colors are used. For example, if the threshold is set to 10 then values under 10 get the first color and values that are 10 or more get the second color.

The threshold field also accepts 2 comma-separated values which represent 3 ranges that correspond to the three colors. For example: if the thresholds are 70, 90 then the first color represents < 70, the second color represents between 70 and 90 and the third color represents > 90.

#### Changelog

##### v0.0.2
- Fixes bug where time series with a country code not found in the country data crashes the panel.
- Adds some extra country codes to the country data to be more similar to the MaxMind Country database.

##### v0.0.3
- Support for lowercase country codes for non-elasticsearch datasources.

##### v0.0.4
- Fixes snapshotting.

##### v.0.0.5

- Adds support for json and jsonp endpoints for location data.

##### v.0.0.6

- Adds decimal places option for data values in circle popovers.
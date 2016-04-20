## Worldmap Panel Plugin for Grafana

The Worldmap Panel is a world map that can be overlaid with circles representing data points from a query. It matches country codes (like US or GB or FR) to a node or a wildcard in a metric namespace e.g. apps.country.US.requests.count or apps.country.*.requests.count.

### Options

**Center**

Consists of two fields: latitude and longitude. The default is 0, 0. Examples of other values are 37.09024, -95.712891 for the center of the US or 55.378051, -3.435973 for Great Britain.

**Initial Zoom**

The initial zoom factor for the map.
  

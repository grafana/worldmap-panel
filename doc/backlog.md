# Backlog for Grafana Worldmap Panel

## Prio 1
- Completely proxy all accesses to self.panel through self.settings
- Indicate which location source might be suitable for which data source 
- Remove overloading of labelField for table+json location source
- Add note about variable interpolation to user interface
- Document the Makefile and how to run this in a sandbox
- Propagate errors from InfluxDB like "GROUP BY requires at least one aggregate function"
  when having "GROUP BY time ($__interval)" in query.
- Add control options ignoreGeohashDecodingErrors, strokeWidth, attributionText
- Add documentation about table+json and table+jsonp
- When switching from JSON to JSONP, the location list will not get cleared out.
- Currently, only "valueRounded is displayed"
- Just reloading / `refresh` does not acquire locations again if previously empty.
  Improve that.

## Documentation
- https://community.grafana.com/t/influxdb-and-grafana-plugin-worldmap-panel/16761

## Prio 2
- Add variable interpolation like `$point_station_id` also to other data sources != "table"
- Think about introducing a panel-wide "Ignore decoding errors" control option 
  in order to compensate for anything in decoding machinery of the 
  `DataFormatter.setXXXValues` methods from where the shit might hit the fan.
  Essentially, this would mask all exceptions raised from this code.
- When introducing more "Ignore XXX" functions, think about adding a
  "Enable log" function to compensate against not being informed about
  errors at all. Maybe exclusively display these errors/warnings within 
  the editor pane.
- initialZoom => zoomOffset
- Dynamic content attribution
- More presets for "Center" settings
- Improve inline documentation (code-wise and inside editor)
- Zoom radius (km) => select unit
- Rename ctrl.panel.locationData ==='states' to "us-states"
- Strichstärke für Kreise einstellen
- Rename popover => popup
- Make text fields autoselect content from available field names
- Enrich "location data" label by data source
- Reintegrate features from https://github.com/pR0Ps/grafana-trackmap-panel
    - [5] https://github.com/ravithb/worldmap-panel
    - [6] https://github.com/ravithb/worldmap-panel/commit/36e0c488
    - [7] https://github.com/pR0Ps/grafana-trackmap-panel
- Run "interpolateVariableValue" on linkUrl only if value contains template variables
- Add "padding" to "Fit to data" option
- Add removeEscapeKeyBinding functionality based on conditions from $request or $location
- Why are getLocationDataChoices and getMapCenterChoices getting called so often?
- When adding the panel, does it really open the "Visualization" tab first?
  This might be perfectly fine when **editing** the panel, but it should really
  open the "Queries" tab after creating it from scratch.
- Implement more features from Leaflet? https://leanpub.com/leaflet-tips-and-tricks/read
- Improve the drill-down feature by adding $from/$to/$interval to 
  https://github.com/grafana/grafana/issues/1909
- Improve $__from / $__to formats for displaying the time range in panel title
  - https://github.com/grafana/grafana/issues/1909#issuecomment-458890110
  - https://community.grafana.com/t/problem-with-epoch-timestamps-to-human-readable-date-conversion/3576
- Deliver version number in some json model
- Show geohash instead of "n/a" when no location name is available
- createClickthrough
  - Take link from variable and apply templating
  - Optionally construct this link using baseurl + relative url
  - Link to dashboard with templated parameters
  - Just switch to dashboard internally instead of fully navigating to the url
  - Optionally open link in new or named window
  - Convenience checkbox "Add complete dataPoint as query parameters"

## Prio 3
- Something might still be fishy with circle sizes.
    - When not limiting circle size, circles are getting an orange second circle around the primary
      red one initially loading the dashboard. After toggling **any** editor control, the display
      is refreshed and the circles are displayed correctly right away. Why? 
    - Changing the "maximum circle size" does not yield proper interactive 
      results on the map, only after toggling "Skip empty values". Why?
  => Only happens when grouping by time like:: 

      SELECT last("RSSI_DL") AS "metric" 
      FROM "loradbmapper" 
      WHERE $timeFilter 
      GROUP BY time($interval), "geohash"
- Use custom tile server
- Add Heatmaps / color gradients
    - [9] http://leaflet.github.io/Leaflet.heat/demo/
    - [10] https://iosphere.github.io/Leaflet.hotline/demo/
    - [11] https://github.com/grafana/worldmap-panel/issues/17
    - [12] https://github.com/grafana/worldmap-panel/pull/35
    - [8] https://github.com/pR0Ps/grafana-trackmap-panel/issues/6
- Dynamic coloring
    - https://github.com/grafana/worldmap-panel/issues/171
- Add location picker based on NominatimAssistant

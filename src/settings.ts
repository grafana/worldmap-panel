import * as _ from 'lodash';
import { TemplateSrv } from 'grafana/app/features/templating/template_srv';

export default class PluginSettings {
  private _request: {};
  private requestVariables: {};

  constructor(private model: {}, private templateSrv: TemplateSrv, private request?: {}) {
    this._request = this.request || {};
    this.requestVariables = {};
    this.loadVariablesFromRequest();
    this.establishProperties();
  }

  establishProperties() {
    for (const name in this.model) {
      Object.defineProperty(this, name, {
        get: () => this.interpolateVariable(name),
        enumerable: true,
      });
    }
  }

  loadVariablesFromRequest() {
    // Put all request parameters from url into the variable
    // interpolation dictionary, prefixed by `request_`.
    //
    // This enables to use request variables in all panel control options.
    // So, when invoking the dashboard with an url query parameter like
    // `map_center_latitude=42.42`, you would be able to interpolate it to
    // a panel control options by i.e. assigning
    // `mapCenterLatitude: $request_map_center_latitude`.
    for (let key in this._request) {
      const value = this._request[key];
      key = 'request_' + key;
      this.requestVariables[key] = value;
    }
  }

  interpolateVariable(name, variables?: {}) {
    variables = variables || {};

    variables = _.cloneDeep(variables);
    _.merge(variables, this.requestVariables);

    // By default, use vanilla control option attribute from panel data model.
    let value = this.model[name];

    // Optionally, use `panel-` variables from request query parameters.
    value = this.getVariableFromRequest(name, value);

    // Interpolate the dashboard and dataPoint variables.
    return this.interpolateVariableValue(value, variables);
  }

  interpolateVariableValue(target: string, variables?: {}, format?: string | Function) {
    if (typeof target === 'string') {
      const scopedVariables = this.toScoped(variables || {});
      target = this.templateSrv.replace(target, scopedVariables, format);
    }
    return target;
  }

  toScoped(variables) {
    const scopedVars = {};
    for (const key in variables) {
      const value = variables[key];
      scopedVars[key] = { text: key, value: value };
    }
    return scopedVars;
  }

  getVariableFromRequest(name, value) {
    // When given, use request variable "panel-*", making things like these possible.
    // - ?panel-mapCenterLatitude=62.2
    // - ?panel-showZoomControl=false
    // - ?panel-clickthroughUrl=/path/to/?geohash=$__field_geohash
    // - https://daq.example.org/d/D1Fx12kWk/magic-dashboard?panel-clickthroughUrl=/path/to/?foobar=$request_foobar&foobar=hello
    const panelQueryName = 'panel-' + name;
    const panelQueryValue = this._request[panelQueryName];
    if (panelQueryValue !== undefined) {
      // Apply appropriate type conversion. This is important for booleans.
      if (typeof value === 'boolean') {
        value = asBool(panelQueryValue);
      } else {
        value = panelQueryValue;
      }
    }

    return value;
  }
}

function asBool(value) {
  // https://stackoverflow.com/questions/263965/how-can-i-convert-a-string-to-boolean-in-javascript/1414175#1414175
  switch (value.toLowerCase().trim()) {
    case 'true':
    case 'yes':
    case '1':
      return true;
    case 'false':
    case 'no':
    case '0':
    case null:
      return false;
    default:
      return Boolean(value);
  }
}

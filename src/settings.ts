import * as _ from 'lodash';
import {TemplateSrv} from "grafana/app/features/templating/template_srv";


export default class PluginSettings {

    private _request: Object;
    private request_variables: Object;

    constructor(private model: Object, private templateSrv: TemplateSrv, private request?: Object) {
        this._request = this.request || {};
        this.request_variables = {};
        this.loadVariablesFromRequest();
        this.establishProperties();
    }

    establishProperties() {
        for (let name in this.model) {
            Object.defineProperty(this, name, {
                get: function() { return this.interpolateVariable(name) },
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
            this.request_variables[key] = value;
        }
    }

    interpolateVariable(name, variables?: Object) {

        variables = variables || {};

        variables = _.cloneDeep(variables);
        _.merge(variables, this.request_variables);

        // By default, use vanilla control option attribute from panel data model.
        let value = this.model[name];

        // Optionally, use `panel-` variables from request query parameters.
        value = this.getVariableFromRequest(name, value);

        // Interpolate the dashboard and dataPoint variables.
        return this.interpolateVariableValue(value, variables);
    }

    interpolateVariableValue(target: string, variables?: Object, format?: string | Function) {
        if (typeof target == 'string') {
            const scopedVariables = this.toScoped(variables || {});
            target = this.templateSrv.replace(target, scopedVariables, format);
        }
        return target;
    }

    toScoped(variables) {
        let scopedVars = {};
        for (let key in variables) {
            const value = variables[key];
            scopedVars[key] = {text: key, value: value};
        }
        return scopedVars;
    }

    getVariableFromRequest(name, value) {

        // When given, use request variable "panel-*", making things like these possible.
        // - ?panel-mapCenterLatitude=62.2
        // - ?panel-showZoomControl=false
        // - ?panel-clickthroughUrl=/path/to/?geohash=$point_geohash
        // - https://daq.example.org/d/D1Fx12kWk/magic-dashboard?panel-clickthroughUrl=/path/to/?foobar=$request_foobar&foobar=hello
        const panel_query_name = 'panel-' + name;
        const panel_query_value = this._request[panel_query_name];
        if (panel_query_value !== undefined) {

            // Apply appropriate type conversion. This is important for booleans.
            if (typeof value == 'boolean') {
                value = asBool(panel_query_value);
            } else {
                value = panel_query_value;
            }
        }

        return value;

    }

}

function asBool(value) {
    // https://stackoverflow.com/questions/263965/how-can-i-convert-a-string-to-boolean-in-javascript/1414175#1414175
    switch(value.toLowerCase().trim()){
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: return false;
        default: return Boolean(value);
    }
}

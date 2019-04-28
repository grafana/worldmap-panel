import {TemplateSrv} from "grafana/app/features/templating/template_srv";

export default class SmartSettings {

    private _request: Object;

    constructor(private model: Object, private templateSrv: TemplateSrv, private request?: Object) {
        this._request = this.request || {};
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

    interpolateVariable(name, variables?: Object) {

        variables = variables || {};

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
            variables[key] = value;
        }

        // By default, use vanilla control option attribute from panel data model.
        let value = this.model[name];

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

}

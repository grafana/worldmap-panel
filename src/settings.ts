import {TemplateSrv} from "grafana/app/features/templating/template_srv";

export default class SmartSettings {

    constructor(private model: Object, private templateSrv: TemplateSrv) {
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

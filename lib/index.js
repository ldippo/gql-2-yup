"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
var Scalars;
(function (Scalars) {
    Scalars["ID"] = "ID";
    Scalars["String"] = "String";
    Scalars["DateTime"] = "DateTime";
    Scalars["Float"] = "Float";
    Scalars["Int"] = "Int";
    Scalars["Boolean"] = "Boolean";
})(Scalars || (Scalars = {}));
var GQLTypes;
(function (GQLTypes) {
    GQLTypes["GraphQLNonNull"] = "GraphQLNonNull";
    GQLTypes["GraphQLScalarType"] = "GraphQLScalarType";
    GQLTypes["GraphQLList"] = "GraphQLList";
    GQLTypes["GraphQLEnumType"] = "GraphQLEnumType";
    GQLTypes["GraphQLInputObjectType"] = "GraphQLInputObjectType";
})(GQLTypes || (GQLTypes = {}));
function createScalarType(type, required) {
    function processInner(str) {
        return "yup." + str + (required ? ".required()" : "");
    }
    var res;
    switch (type.name) {
        case Scalars.ID:
        case Scalars.String:
            res = processInner("string()");
            break;
        case Scalars.Boolean:
            res = processInner("boolean()");
            break;
        case Scalars.Float:
            res = processInner("number()");
            break;
        case Scalars.Int:
            res = processInner("number().integer()");
            break;
        case Scalars.DateTime:
            res = processInner("date()");
            break;
    }
    return res;
}
function createObjectType(type, required) {
    var fields = type.getFields();
    var objResult = "yup.object().shap({ ";
    for (var name in fields) {
        objResult += name + ": " + createField(fields[name].type, false) + (required ? ".required()" : "");
    }
    objResult += " })" + (required ? "" : ".default(null).nullable()");
    return objResult;
}
function createListType(type, required) {
    return "yup.array().of(" + createField(type, false) + ")" + (required ? ".required()" : "");
}
function createEnumType(type, required) {
    return "yup.mixed().oneOf([" + type
        .getValues()
        .map(function (_a) {
        var value = _a.value;
        return "'" + value + "'";
    })
        .concat("null")
        .join(",") + "])" + (required ? ".required()" : "");
}
function createField(type, required) {
    var val;
    switch (type.__proto__.constructor.name) {
        case GQLTypes.GraphQLNonNull:
            val = "get" + type.ofType + "Schema()";
            break;
        case GQLTypes.GraphQLEnumType:
            val = createEnumType(type, required);
            break;
        case GQLTypes.GraphQLScalarType:
            val = createScalarType(type, required);
            break;
        case GQLTypes.GraphQLList:
            val = createListType(type, required);
            break;
        case GQLTypes.GraphQLInputObjectType:
            val = createObjectType(type, required);
            break;
    }
    return val;
}
function plugin(schema, _documents, _config) {
    var pluginOutput = "import * as yup from 'yup';";
    var types = Object.keys(schema.getTypeMap());
    types.forEach(function (typeName) {
        var type = schema.getType(typeName);
        if (type) {
            pluginOutput += "\n              export function get" + typeName + "Schema() {\n                  return " + createField(type, true) + "\n              }\n\n              ";
        }
    });
    return pluginOutput;
}
exports.plugin = plugin;
// @ts-ignore
module.exports = {
    plugin: plugin,
};
exports.default = {
    plugin: plugin,
};
//# sourceMappingURL=index.js.map
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
    switch (type.name) {
        case Scalars.ID:
            return processInner("string()");
        case Scalars.String:
            return processInner("string()");
        case Scalars.Boolean:
            return processInner("boolean()");
        case Scalars.Float:
            return processInner("number()");
        case Scalars.Int:
            return processInner("number().integer()");
        case Scalars.DateTime:
            return processInner("date()");
    }
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
    switch (type.__proto__.constructor.name) {
        case GQLTypes.GraphQLNonNull:
            return "get" + type.ofType + "Schema()";
        case GQLTypes.GraphQLEnumType:
            return createEnumType(type, required);
        case GQLTypes.GraphQLScalarType:
            return createScalarType(type, required);
        case GQLTypes.GraphQLList:
            return createListType(type, required);
        case GQLTypes.GraphQLInputObjectType:
            return createObjectType(type, required);
    }
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
exports.default = {
    plugin: plugin,
};
//# sourceMappingURL=index.js.map
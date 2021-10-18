import {
  GraphQLSchema,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLEnumType,
} from "graphql";

enum Scalars {
  ID = "ID",
  String = "String",
  DateTime = "DateTime",
  Float = "Float",
  Int = "Int",
  Boolean = "Boolean",
}

enum GQLTypes {
  GraphQLNonNull = "GraphQLNonNull",
  GraphQLScalarType = "GraphQLScalarType",
  GraphQLList = "GraphQLList",
  GraphQLEnumType = "GraphQLEnumType",
  GraphQLInputObjectType = "GraphQLInputObjectType",
}

function createScalarType(type: GraphQLNamedType, required?: boolean) {
  function processInner(str: string) {
    return `yup.${str}${required ? ".required()" : ""}`;
  }
  let res;
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

function createObjectType(
  type: GraphQLObjectType<any, any>,
  required?: boolean
): string {
  const fields = type.getFields();
  let objResult = "yup.object().shap({ ";
  for (let name in fields) {
    objResult += `${name}: ${createField((fields as any)[name].type, false)}${
      required ? ".required()" : ""
    }`;
  }
  objResult += ` })${required ? "" : ".default(null).nullable()"}`;
  return objResult;
}

function createListType(type: GraphQLNamedType, required?: boolean): string {
  return `yup.array().of(${createField(type, false)})${
    required ? ".required()" : ""
  }`;
}

function createEnumType(type: GraphQLEnumType, required?: boolean): string {
  return `yup.mixed().oneOf([${type
    .getValues()
    .map(({ value }) => `'${value}'`)
    .concat("null")
    .join(",")}])${required ? ".required()" : ""}`;
}

function createField(type: GraphQLNamedType, required?: boolean) {
  let val;
  switch ((type as any).__proto__.constructor.name) {
    case GQLTypes.GraphQLNonNull:
      val = `get${(type as any).ofType}Schema()`;
      break;
    case GQLTypes.GraphQLEnumType:
      val = createEnumType(type as GraphQLEnumType, required);
      break;
    case GQLTypes.GraphQLScalarType:
      val = createScalarType(type, required);
      break;
    case GQLTypes.GraphQLList:
      val = createListType(type, required);
      break;
    case GQLTypes.GraphQLInputObjectType:
      val = createObjectType(type as GraphQLObjectType, required);
      break;
  }
  return val;
}

function plugin(schema: GraphQLSchema, _documents?: any, _config?: any) {
  let pluginOutput = `import * as yup from 'yup';`;
  const types = Object.keys(schema.getTypeMap());
  types.forEach((typeName) => {
    const type = schema.getType(typeName);
    if (type) {
      pluginOutput += `
              export function get${typeName}Schema() {
                  return ${createField(type, true)}
              }

              `;
    }
  });

  return pluginOutput;
}
// @ts-ignore
module.exports = {
  plugin,
};
export { plugin };
export default {
  plugin,
};

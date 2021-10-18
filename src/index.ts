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
  switch ((type as any).__proto__.constructor.name) {
    case GQLTypes.GraphQLNonNull:
      return `get${(type as any).ofType}Schema()`;
    case GQLTypes.GraphQLEnumType:
      return createEnumType(type as GraphQLEnumType, required);
    case GQLTypes.GraphQLScalarType:
      return createScalarType(type, required);
    case GQLTypes.GraphQLList:
      return createListType(type, required);
    case GQLTypes.GraphQLInputObjectType:
      return createObjectType(type as GraphQLObjectType, required);
  }
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

export { plugin };

export default {
  plugin,
};

import { memoize } from "lodash";
import {
  GraphQLSchema,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLEnumType,
} from "graphql";

import { writeFileSync, existsSync, appendFileSync } from "fs";

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

const createScalarType = memoize(function createScalarType(
  type: GraphQLNamedType,
  required?: boolean
) {
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
});

const createObjectType = memoize(function createObjectType(
  type: GraphQLObjectType<any, any>,
  required?: boolean
): string {
  const fields = type.getFields();
  let objResult = "yup.object().shape({ ";
  for (let name in fields) {
    objResult += `${name}: ${createField((fields as any)[name].type, false)}${
      required ? ".required()" : ""
    },`;
  }
  objResult += ` })${required ? "" : ".default(null).nullable()"}`;
  return objResult;
});

const createListType = memoize(function createListType(
  type: GraphQLNamedType,
  required?: boolean
): string {
  return `yup.array().of(${createField(type, false)})${
    required ? ".required()" : ""
  }`;
});

const createEnumType = memoize(function createEnumType(
  type: GraphQLEnumType,
  required?: boolean
): string {
  return `yup.mixed().oneOf([${type
    .getValues()
    .map(({ value }) => `'${value}'`)
    .concat("null")
    .join(",")}])${required ? ".required()" : ""}`;
});

const createField = memoize(function createField(
  type: GraphQLNamedType,
  required?: boolean
) {
  let val;
  switch ((type as any).__proto__.constructor.name) {
    case GQLTypes.GraphQLNonNull:
      val = `get${(type as any).ofType}Schema()`;
      break;
    case GQLTypes.GraphQLScalarType:
      val = createScalarType(type, required);
      break;
    case GQLTypes.GraphQLList:
      val = createListType(type, required);
      break;
    case GQLTypes.GraphQLEnumType:
      val = createEnumType(type as GraphQLEnumType, required);
      break;
    case GQLTypes.GraphQLInputObjectType:
      val = createObjectType(type as GraphQLObjectType, required);
      break;
  }
  return val;
});

function plugin(schema: GraphQLSchema, _documents?: any, _config?: any) {
  let pluginOutput = `import * as yup from 'yup';\n\n`;
  const filePath = `${__dirname}/tmp-schema`;
  if (!existsSync(filePath)) writeFileSync(filePath, pluginOutput);
  const types = Object.keys(schema.getTypeMap());
  types.forEach((typeName) => {
    const type = schema.getType(typeName);
    try {
      if (type) {
        const def = `
export function get${typeName}Schema() {
    return ${createField(type, true)}
}
                `;
        appendFileSync(filePath, def);
      }
    } catch (e) {
      console.error(`Failed to create schema for ${typeName}`);
      console.error(e);
    }
  });

  return "";
}

export { plugin };

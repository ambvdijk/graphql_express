const express = require('express')
const graphqlHTTP = require('express-graphql')
const graphql = require('graphql')
const joinMonster = require('join-monster')

// Connect to database
const { Client } = require('pg')
const client = new Client({
  host: "localhost",
  user: "postgres-user",
  port: 4251,
  password: "x@VZhYX812be&dXdb5!w",
  database: "shopping-db"
})
client.connect()

// Define the schema
const Product = new graphql.GraphQLObjectType({
  name: 'Product',
  fields: () => ({
    id: { type: graphql.GraphQLInt },
    name: { type: graphql.GraphQLString },
    description: { type: graphql.GraphQLString },
  })
});

Product._typeConfig = {
  sqlTable: 'product',
  uniqueKey: 'id',
}

const MutationRoot = new graphql.GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    player: {
      type: Product,
      args: {
        name: { type: graphql.GraphQLNonNull(graphql.GraphQLString) },
        description: { type: graphql.GraphQLNonNull(graphql.GraphQLString) }
      },
      resolve: async (parent, args, context, resolveInfo) => {
        try {
          return (await client.query("INSERT INTO product (name, description) VALUES ($1, $2) RETURNING *", [args.name, args.description])).rows[0]
        } catch (err) {
          throw new Error("Failed to insert new Product")
        }
      }
    }
  })
})

const QueryRoot = new graphql.GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    hello: {
      type: graphql.GraphQLString,
      resolve: () => "Hello world!"
    },
    products: {
      type: new graphql.GraphQLList(Product),
      resolve: (parent, args, context, resolveInfo) => {
        return joinMonster.default(resolveInfo, {}, sql => {
          return client.query(sql)
        })
      }
    },
    product: {
      type: Product,
      args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) } },
      where: (productTable, args, context) => `${productTable}.id = ${args.id}`,
      resolve: (parent, args, context, resolveInfo) => {
        return joinMonster.default(resolveInfo, {}, sql => {
          return client.query(sql)
        })
      }
    }
  })
})

const schema = new graphql.GraphQLSchema({
  query: QueryRoot,
  mutation: MutationRoot
});

// Create the Express app
const app = express();
app.use('/api', graphqlHTTP({
  schema: schema,
  graphiql: true
}));

app.listen(4000);
// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
const axios = require("axios");
// Set the region

// Create the DynamoDB service object
var credentials = new AWS.SharedIniFileCredentials({
  profile: "dynamoDB-user",
});
// AWS.config.credentials = credentials;
AWS.config.update({ region: "eu-west-3", credentials });

var ddb = new AWS.DynamoDB({});
(async () => {
  const TableName = "Dogs";
  console.log(await ddb.listTables().promise());
  try {
    await deleteTable({ TableName });
  } catch (e) {}
  const res = await axios.get(
    "https://gist.githubusercontent.com/kastriotadili/acc722c9858189440d964db976303078/raw/ba63ffd45a76e54fd816ff471e9f3ac348e983b7/dog-breeds-data.json"
  );
  const data = res.data.dogBreeds;

  var createParams = {
    TableName,
    AttributeDefinitions: [
      {
        AttributeName: "breed",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "breed",
        KeyType: "HASH",
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  };
  await createTable(createParams);

  for (const dog of data) {
    const putParams = {
      TableName,
      Item: {
        breed: { S: dog.breed },
        intelligence: { N: dog.intelligence.toString() },
      },
    };
    await ddb.putItem(putParams).promise();
    console.log(dog.breed, "inserted");
  }

  const scanParams = {
    ExpressionAttributeValues: {
      ":n": { N: "7" },
    },
    FilterExpression: "intelligence = :n",
    ProjectionExpression: "breed",
    TableName,
  };

  const scanRes = await ddb.scan(scanParams).promise();
  console.log(`Result: ${scanRes.Items.map((i) => i.breed.S).join(",")}`);

  const deleteParams = {
    Key: {
      breed: { S: "German Shepard" },
    },
    TableName,
  };

  console.log(
    "Delete German Shepard",
    await ddb.deleteItem(deleteParams).promise()
  );

  await deleteTable({ TableName });
})();

async function createTable(params) {
  console.log(`Creating ${params.TableName}...`);
  await ddb.createTable(params).promise();
  await ddb.waitFor("tableExists", { TableName: params.TableName }).promise();
  console.log(`${params.TableName} successfully created!`);
}

async function deleteTable(params) {
  console.log(`Deleting ${params.TableName}...`);
  await ddb.deleteTable(params).promise();
  await ddb.waitFor("tableNotExists", params).promise();
  console.log(`${params.TableName} successfully deleted!`);
}

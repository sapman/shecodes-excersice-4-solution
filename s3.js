// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
const fs = require("fs");
const axios = require("axios");

// Set the region

// Create the DynamoDB service object
var credentials = new AWS.SharedIniFileCredentials({
  profile: "s3-user",
});
// AWS.config.credentials = credentials;
AWS.config.update({ region: "eu-west-3", credentials });

var s3 = new AWS.S3({});
(async () => {
  const Bucket = "shecodes-ex1-solution";
  const Key = "file";
  try {
    await s3.deleteObject({ Bucket, Key }).promise();
    await s3.deleteBucket({ Bucket }).promise();
  } catch (e) {
  }
  await s3
    .createBucket({
      Bucket,
      ACL: "public-read",
    })
    .promise();
  const fileStream = fs.createReadStream("./file.txt");

  const uploadRes = await s3
    .upload({ Bucket, Key, Body: fileStream })
    .promise();
  const getObjectRes = await s3.getObject({ Bucket, Key }).promise();

  console.log(`Object content: ${Buffer.from(getObjectRes.Body).toString()}`);

  await s3
    .putPublicAccessBlock({
      Bucket,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        BlockPublicPolicy: false,
        IgnorePublicAcls: false,
        RestrictPublicBuckets: false,
      },
    })
    .promise();
  await s3.putObjectAcl({ Bucket, Key, ACL: "public-read" }).promise();
  const res = await axios.get(uploadRes.Location);
  console.log(`Object public content: ${res.data}`);
  try {
    await s3.deleteObject({ Bucket, Key }).promise();
    await s3.deleteBucket({ Bucket }).promise();
  } catch (e) {
    console.log(e);
  }
})();

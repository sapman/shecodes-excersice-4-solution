// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
const axios = require("axios");
// Set the region

// Create the DynamoDB service object
var credentials = new AWS.SharedIniFileCredentials({
  profile: "ec2-user",
});
// AWS.config.credentials = credentials;
AWS.config.update({ region: "eu-west-3", credentials });

var ec2 = new AWS.EC2({});
(async () => {
  console.log("Creating instance");
  const res = await ec2
    .runInstances({
      ImageId: "ami-0d6aecf0f0425f42a",
      InstanceType: "t2.micro",
      MinCount: 1,
      MaxCount: 1,
      UserData: Buffer.from(`#!/bin/bash \n apt install -y apache2`).toString(
        "base64"
      ),
      SecurityGroupIds: ["sg-02b07e3c83e60c587"],
    })
    .promise();
  await ec2
    .waitFor("instanceRunning", { InstanceIds: [res.Instances[0].InstanceId] })
    .promise();
  console.log("Instance created and running");

  // Here you should break, and test the connectivity of you apache2 instance.
  // Try to use the public IP and not the DNS, because sometimes the DNS servers provided by the ISP
  // Cant recognize DNS names of AWS (Or just change your DNS to 8.8.8.8)

  await ec2
    .terminateInstances({ InstanceIds: [res.Instances[0].InstanceId] })
    .promise();
  await ec2
    .waitFor("instanceTerminated", {
      InstanceIds: [res.Instances[0].InstanceId],
    })
    .promise();
  console.log("Instance deleted successfully");
})();

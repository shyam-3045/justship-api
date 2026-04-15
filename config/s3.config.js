const { S3Client } = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_BUCKET_REG

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

module.exports=s3
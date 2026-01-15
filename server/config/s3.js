const AWS = require('aws-sdk');
require('dotenv').config();

const s3Client = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

const bucketName = process.env.S3_BUCKET;
const publicUrl = process.env.S3_PUBLIC_URL;

module.exports = {
  s3Client,
  bucketName,
  publicUrl,
};

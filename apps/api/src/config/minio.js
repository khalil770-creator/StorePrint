const Minio = require('minio');

const client = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT,
  port:      parseInt(process.env.MINIO_PORT) || 9000,
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const BUCKET = process.env.MINIO_BUCKET || 'storeprint';

const ensureBucket = async () => {
  const exists = await client.bucketExists(BUCKET);
  if (!exists) {
    await client.makeBucket(BUCKET, 'us-east-1');
    console.log(`MinIO bucket '${BUCKET}' created`);
  }
};

const uploadFile = async (objectName, stream, size, contentType) => {
  await client.putObject(BUCKET, objectName, stream, size, { 'Content-Type': contentType });
  return `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET}/${objectName}`;
};

const getPresignedUrl = async (objectName, expiry = 3600) => {
  return client.presignedGetObject(BUCKET, objectName, expiry);
};

module.exports = { client, BUCKET, ensureBucket, uploadFile, getPresignedUrl };

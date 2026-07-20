const Minio = require('minio');

// Internal client — uses Docker hostname for actual S3 operations (upload, delete, bucket checks)
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
  return `/${BUCKET}/${objectName}`;
};

// presignedGetObject only computes an HMAC — it does NOT open a network connection.
// We create a throw-away client configured with the public hostname so the signed URL
// contains localhost (reachable by the browser/mobile) instead of the Docker-internal
// 'minio' hostname. No connection is made during presigning so ECONNREFUSED never occurs.
const getPresignedUrl = async (objectName, expiry = 3600) => {
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  if (publicUrl) {
    try {
      const u = new URL(publicUrl);
      const signingClient = new Minio.Client({
        endPoint:  u.hostname,
        port:      parseInt(u.port) || (u.protocol === 'https:' ? 443 : 80),
        useSSL:    u.protocol === 'https:',
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
      });
      return await signingClient.presignedGetObject(BUCKET, objectName, expiry);
    } catch (err) {
      console.warn('[minio] Public URL presigning failed, falling back to internal client:', err.message);
    }
  }
  return client.presignedGetObject(BUCKET, objectName, expiry);
};

module.exports = { client, BUCKET, ensureBucket, uploadFile, getPresignedUrl };

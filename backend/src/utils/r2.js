const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { nanoid } = require('nanoid');
const env = require('../config/env');

let s3Client = null;

if (env.r2AccessKeyId && env.r2SecretAccessKey && env.r2Endpoint) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: env.r2Endpoint,
    credentials: {
      accessKeyId: env.r2AccessKeyId,
      secretAccessKey: env.r2SecretAccessKey,
    },
  });
}

function normalizeObjectKey(objectKey) {
  return String(objectKey || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/');
}

function getR2BaseUrl() {
  if (env.r2PublicUrl) {
    return env.r2PublicUrl.replace(/\/$/, '');
  }

  return '';
}

function isR2Configured() {
  return Boolean(getR2BaseUrl());
}

function getObjectUrl(objectKey) {
  const key = normalizeObjectKey(objectKey);
  if (!key) {
    throw new Error('R2 object key is required');
  }

  const baseUrl = getR2BaseUrl();
  if (!baseUrl) {
    throw new Error('Cloudflare R2 is not configured');
  }

  return `${baseUrl}/${encodeURI(key)}`;
}

async function uploadToR2(fileBuffer, mimeType, originalName, folder = 'uploads', fileNamePrefix = '', explicitKey = null) {
  if (!s3Client || !env.r2BucketName) {
    throw new Error('Cloudflare R2 is not properly configured for uploading');
  }

  let key = explicitKey;
  if (!key) {
    const extension = originalName.split('.').pop() || '';
    // Ensure the folder path is clean (no leading slash, has a trailing slash if not empty)
    let cleanFolder = normalizeObjectKey(folder);
    if (cleanFolder && !cleanFolder.endsWith('/')) {
      cleanFolder += '/';
    }

    let finalFileName = `${nanoid()}.${extension}`;
    if (fileNamePrefix && fileNamePrefix.trim()) {
      finalFileName = `${fileNamePrefix.trim()}-${finalFileName}`;
    }

    key = `${cleanFolder}${finalFileName}`;
  }

  const command = new PutObjectCommand({
    Bucket: env.r2BucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  await s3Client.send(command);

  return key;
}

async function deleteFromR2(objectKey) {
  if (!s3Client || !env.r2BucketName) return false;
  if (!objectKey) return false;

  const key = normalizeObjectKey(objectKey);
  if (!key) return false;

  try {
    const command = new DeleteObjectCommand({
      Bucket: env.r2BucketName,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`Failed to delete object from R2: ${key}`, error);
    return false;
  }
}

module.exports = {
  normalizeObjectKey,
  getR2BaseUrl,
  isR2Configured,
  getObjectUrl,
  uploadToR2,
  deleteFromR2,
};

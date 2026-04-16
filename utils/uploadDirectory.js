const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");
const s3 = require("../config/s3.config");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

const BUCKET = process.env.AWS_BUCKET_NAME;

async function uploadDirectory(localDir, s3Prefix, currentPrefix) {
  if (!BUCKET) {
    throw new Error("AWS_BUCKET_NAME is not set");
  }

  await fsPromises.access(localDir);

  const items = await fsPromises.readdir(localDir);

  for (const item of items) {
    const fullPath = path.join(localDir, item);
    const stat = await fsPromises.stat(fullPath);

    const versionKey = `${s3Prefix}/${item}`;
    const currentKey = `${currentPrefix}/${item}`;

    if (stat.isDirectory()) {
      await uploadDirectory(fullPath, versionKey, currentKey);
    } else {
      const contentType =
        mime.lookup(fullPath) || "application/octet-stream";

      let cacheControl;
      if (contentType === "text/html") {
        cacheControl = "no-cache";
      } else {
        cacheControl = "public, max-age=31536000";
      }

      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: versionKey,
            Body: fs.createReadStream(fullPath),
            ContentLength: stat.size,
            ContentType: contentType,
            CacheControl: cacheControl,
          })
        );

        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: currentKey,
            Body: fs.createReadStream(fullPath),
            ContentLength: stat.size,
            ContentType: contentType,
            CacheControl: cacheControl,
          })
        );

        console.log("Uploaded:", versionKey);
      } catch (err) {
        console.error("❌ Upload failed for:", fullPath);
        throw err;
      }
    }
  }
}

module.exports = { uploadDirectory };
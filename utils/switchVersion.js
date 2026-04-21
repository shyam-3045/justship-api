const s3 = require("../config/s3.config");
const {
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const BUCKET = process.env.AWS_BUCKET_NAME;

async function switchVersion(projectName, version) {
  if (!BUCKET) {
    throw new Error("AWS_BUCKET_NAME is not set");
  }

  const sourcePrefix = `${projectName}/v${version}/`;
  const targetPrefix = `${projectName}/current/`;

  const existing = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: targetPrefix,
    })
  );

  if (existing.Contents && existing.Contents.length > 0) {
    const objects = existing.Contents.map((obj) => ({
      Key: obj.Key,
    }));

    await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: objects },
      })
    );
  }

  const list = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: sourcePrefix,
    })
  );

  if (!list.Contents || list.Contents.length === 0) {
    throw new Error("No files found for this version");
  }

  for (const file of list.Contents) {
    const sourceKey = file.Key;

    if (sourceKey.endsWith("/")) continue;

    const relativePath = sourceKey.replace(sourcePrefix, "");

    const targetKey = `${targetPrefix}${relativePath}`;

    await s3.send(
      new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${sourceKey}`,
        Key: targetKey,
      })
    );

    console.log("Copied:", targetKey);
  }
}

module.exports = { switchVersion };
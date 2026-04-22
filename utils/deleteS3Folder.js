
const {
  ListObjectsV2Command,
  DeleteObjectsCommand
} = require("@aws-sdk/client-s3")

const s3 = require("../config/s3.config")

const BUCKET = process.env.AWS_BUCKET_NAME

const deleteS3Folder = async (prefix) => {
  try {
    let isTruncated = true
    let continuationToken = undefined

    while (isTruncated) {
      
      const listParams = {
        Bucket: BUCKET,
        Prefix: `${prefix}/`,
        ContinuationToken: continuationToken
      }

      const listedObjects = await s3.send(
        new ListObjectsV2Command(listParams)
      )

      const contents = listedObjects.Contents

      if (!contents || contents.length === 0) {
        console.log("No files found in S3 for:", prefix)
        return
      }

     
      const deleteParams = {
        Bucket: BUCKET,
        Delete: {
          Objects: contents.map((obj) => ({
            Key: obj.Key
          }))
        }
      }

      
      await s3.send(new DeleteObjectsCommand(deleteParams))

      
      isTruncated = listedObjects.IsTruncated
      continuationToken = listedObjects.NextContinuationToken
    }

    console.log(`S3 folder deleted successfully: ${prefix}`)

  } catch (error) {
    console.error("Error deleting S3 folder:", error)
    throw error
  }
}

module.exports = deleteS3Folder
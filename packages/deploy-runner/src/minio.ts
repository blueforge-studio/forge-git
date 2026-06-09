import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'http://minio:9000'
const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'forge-git-builds'
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'minioadmin'
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'minioadmin'

let s3: S3Client | null = null

function getClient(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      endpoint: MINIO_ENDPOINT,
      region: 'us-east-1',
      credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    })
  }
  return s3
}

export async function uploadBuildArtifact(
  repoId: string,
  commitSha: string,
  filename: string,
  content: string | Buffer,
  contentType?: string,
): Promise<string> {
  const client = getClient()
  const key = `${repoId}/${commitSha}/${filename}`
  await client.send(new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: key,
    Body: content,
    ContentType: contentType ?? 'text/plain',
  }))
  return `${MINIO_ENDPOINT}/${MINIO_BUCKET}/${key}`
}

export async function listBuildArtifacts(
  repoId: string,
  commitSha: string,
): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')
  const client = getClient()
  const result = await client.send(new ListObjectsV2Command({
    Bucket: MINIO_BUCKET,
    Prefix: `${repoId}/${commitSha}/`,
  }))
  return (result.Contents ?? []).map((obj) => ({
    key: obj.Key ?? '',
    size: obj.Size ?? 0,
    lastModified: obj.LastModified ?? new Date(),
  }))
}

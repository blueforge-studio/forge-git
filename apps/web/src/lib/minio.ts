import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? ''
const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'forge-git-builds'
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? ''
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? ''

export interface BuildArtifact {
  key: string
  size: number
  lastModified: Date
  downloadUrl?: string
}

let s3: S3Client | null = null

function getClient(): S3Client | null {
  if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) return null
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

export async function listBuildArtifacts(
  repoId: string,
  commitSha: string,
): Promise<BuildArtifact[]> {
  const client = getClient()
  if (!client) return []

  try {
    const result = await client.send(new ListObjectsV2Command({
      Bucket: MINIO_BUCKET,
      Prefix: `${repoId}/${commitSha}/`,
    }))

    const entries = (result.Contents ?? []).map((obj) => ({
      key: obj.Key ?? '',
      size: obj.Size ?? 0,
      lastModified: obj.LastModified ?? new Date(),
    }))

    const artifacts = await Promise.all(
      entries.map(async (entry) => {
        try {
          const url = await getSignedUrl(
            client,
            new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: entry.key }),
            { expiresIn: 3600 },
          )
          return { ...entry, downloadUrl: url }
        } catch {
          return { ...entry }
        }
      }),
    )

    return artifacts
  } catch {
    return []
  }
}

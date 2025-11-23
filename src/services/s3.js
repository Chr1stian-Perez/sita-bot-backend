const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3")

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_CHATS

async function saveChatToS3(userId, chatId, messages) {
  try {
    const key = `chats/${userId}/${chatId}.json`
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify({
        id: chatId,
        userId,
        messages,
        updatedAt: new Date().toISOString(),
      }),
      ContentType: "application/json",
    })

    await s3Client.send(command)
    console.log(`[S3] Saved chat ${chatId} for user ${userId}`)
  } catch (error) {
    console.error("[S3 Error]:", error)
    throw error
  }
}

async function loadChatsFromS3(userId) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `chats/${userId}/`,
    })

    const response = await s3Client.send(command)

    if (!response.Contents || response.Contents.length === 0) {
      return []
    }

    const chats = []
    for (const item of response.Contents) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.Key,
        })

        const data = await s3Client.send(getCommand)
        const bodyString = await data.Body.transformToString()
        const chat = JSON.parse(bodyString)

        chats.push({
          id: chat.id,
          title: chat.messages[0]?.content.substring(0, 30) || "Sin título",
          messages: chat.messages,
          createdAt: chat.updatedAt,
          userId: chat.userId,
        })
      } catch (error) {
        console.error(`[S3] Error loading chat ${item.Key}:`, error)
      }
    }

    return chats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch (error) {
    console.error("[S3 Error]:", error)
    return []
  }
}

module.exports = { saveChatToS3, loadChatsFromS3 }

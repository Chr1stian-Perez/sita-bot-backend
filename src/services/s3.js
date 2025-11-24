const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3")

const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  // credentials will be automatically loaded from EC2 IAM role
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

        const messages = Array.isArray(chat.messages) ? chat.messages : []
        const title = messages.length > 0 && messages[0]?.content ? messages[0].content.substring(0, 30) : "Sin título"

        chats.push({
          id: chat.id,
          title: title,
          messages: messages,
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

async function getChatFromS3(userId, chatId) {
  try {
    const key = `chats/${userId}/${chatId}.json`
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const data = await s3Client.send(command)
    const bodyString = await data.Body.transformToString()
    const chat = JSON.parse(bodyString)

    console.log(`[S3] Retrieved chat ${chatId} for user ${userId}`)
    return chat
  } catch (error) {
    if (error.name === "NoSuchKey") {
      console.log(`[S3] Chat ${chatId} not found for user ${userId}`)
      return null
    }
    console.error("[S3 Error]:", error)
    throw error
  }
}

async function listUserChats(userId) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `chats/${userId}/`,
    })

    const response = await s3Client.send(command)

    if (!response.Contents || response.Contents.length === 0) {
      console.log(`[S3] No chats found for user ${userId}`)
      return []
    }

    const chats = response.Contents.map((item) => {
      const chatId = item.Key.split("/").pop().replace(".json", "")
      return {
        chatId,
        lastModified: item.LastModified,
        size: item.Size,
      }
    })

    console.log(`[S3] Found ${chats.length} chats for user ${userId}`)
    return chats
  } catch (error) {
    console.error("[S3 Error]:", error)
    return []
  }
}

module.exports = { saveChatToS3, loadChatsFromS3, getChatFromS3, listUserChats }

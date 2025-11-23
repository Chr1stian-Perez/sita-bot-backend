const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge")

const eventBridge = new EventBridgeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

async function publishUpgradeEvent(userId, planType, creditsToAdd) {
  try {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: process.env.EVENTBRIDGE_SOURCE,
          DetailType: process.env.EVENTBRIDGE_DETAIL_TYPE,
          Detail: JSON.stringify({
            userId,
            planType,
            creditsToAdd,
            timestamp: new Date().toISOString(),
          }),
          EventBusName: process.env.EVENTBRIDGE_EVENT_BUS,
        },
      ],
    })

    await eventBridge.send(command)
    console.log(`[EventBridge] Published upgrade event for user ${userId}`)
  } catch (error) {
    console.error("[EventBridge Error]:", error)
    throw error
  }
}

module.exports = { publishUpgradeEvent }

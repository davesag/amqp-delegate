const taskRunner = (channel, task) => async message => {
  try {
    const params = JSON.parse(message.content.toString())
    const result = await task(...params)
    await channel.sendToQueue(
      message.properties.replyTo,
      Buffer.from(JSON.stringify(result)),
      { correlationId: message.properties.correlationId }
    )
    channel.ack(message)
    return result
  } catch (err) {
    channel.ack(message)
    throw err
  }
}

module.exports = taskRunner

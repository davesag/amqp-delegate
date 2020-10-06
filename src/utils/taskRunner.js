/**
 *  Creates a task runner function that receives a message, checks to ensure it's the message
 *  we want, runs the curried task, then responds to the message's replyTo with the result of the task.
 *
 *  @param {Function} task — An async function to be run when a suitable message is received.
 *  @param {Object} channel — The channel to use for the reply.
 *  @returns Function that runs the curried task.
 */
const taskRunner = (channel, task) => async message => {
  try {
    const params = JSON.parse(message.content.toString())
    const result = await task(...params)
    await channel.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify(result)), {
      correlationId: message.properties.correlationId
    })
    channel.ack(message)
    return result
  } catch (err) {
    channel.ack(message)
    throw err
  }
}

module.exports = taskRunner

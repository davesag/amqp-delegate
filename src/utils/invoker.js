const messageCorrelator = require('./messageCorrelator')

/**
 *  Creates a function that sends a message to invoke the remote task and waits for a reply.
 *
 *  @param {string} correlationId The ID You expect to get back
 *  @param {Object} channel The channel to listen on
 *  @param {string} replyTo The queue to reply to
 */
const invoker = (correlationId, channel, replyTo) => async (name, params) =>
  new Promise((resolve, reject) => {
    channel.consume(replyTo, messageCorrelator(correlationId, resolve, reject), { noAck: true })

    channel.sendToQueue(name, Buffer.from(JSON.stringify(params)), {
      correlationId,
      replyTo
    })
  })

module.exports = invoker

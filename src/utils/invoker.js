const messageCorrelator = require('./messageCorrelator')

const invoker = (correlationId, channel, replyTo) => async (name, params) =>
  new Promise((resolve, reject) => {
    channel.consume(
      replyTo,
      messageCorrelator(correlationId, resolve, reject),
      { noAck: true }
    )

    channel.sendToQueue(name, Buffer.from(JSON.stringify(params)), {
      correlationId,
      replyTo
    })
  })

module.exports = invoker
